require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { QuotaEngine, PLAN_TIERS } = require('./src/core/quota-engine');
const { CoThreadFirestoreDB } = require('./src/db/firestore-db');
const { CoThreadADKOrchestrator } = require('./src/adk/cothread-adk-agent');
const { MCP_TOOLS, handleMcpJsonRpcRequest } = require('./src/mcp/cothread-mcp-server');

let geminiService = null;
function getGeminiService() {
  if (!geminiService) {
    try {
      geminiService = require('./src/ai/gemini-service');
    } catch (err) {
      geminiService = null;
    }
  }
  return geminiService;
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static frontend assets and shared core modules
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Initialize Persistent Cloud Firestore Database + Quota Engine + Google ADK Orchestrator
const db = new CoThreadFirestoreDB();
const engine = new QuotaEngine();
engine.state = db.loadSnapshot(() => engine.getState());
const adkOrchestrator = new CoThreadADKOrchestrator({ quotaEngine: engine, db });

// Real-time Server-Sent Events (SSE) clients for instant multi-window sync
const sseClients = new Set();

function broadcastStateUpdate(eventType, payload = {}) {
  db.saveSnapshot(engine.state);
  const message = JSON.stringify({
    eventType,
    timestamp: new Date().toISOString(),
    payload,
    state: engine.getState()
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${message}\n\n`);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

/**
 * Health & Google Stack Readiness Check (Cloud Run, Firestore, ADK, MCP, Gemini)
 */
app.get('/api/health', (req, res) => {
  const svc = getGeminiService();
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    platform: 'CoThread Enterprise AI',
    database: db.getDatabaseStatus(),
    adk: adkOrchestrator.getManifest(),
    mcpToolsCount: MCP_TOOLS.length,
    userApiKeyRequired: false,
    geminiMode: hasApiKey ? 'live-gemini-api' : 'adk-runtime',
    sdkLoaded: Boolean(svc),
    planTiers: PLAN_TIERS,
    timestamp: new Date().toISOString()
  });
});

/**
 * Google Stack & Architecture Manifest Endpoint (Firestore + Firebase Studio + ADK + MCP)
 */
app.get('/api/stack', (req, res) => {
  res.json({
    ok: true,
    database: db.getDatabaseStatus(),
    firebaseStudio: {
      nixConfig: '.idx/dev.nix',
      mcpConfig: '.idx/mcp.json',
      firebaseConfig: 'firebase.json',
      firestoreRules: 'firestore.rules'
    },
    adk: adkOrchestrator.getManifest(),
    mcp: {
      endpoint: '/api/mcp',
      tools: MCP_TOOLS
    }
  });
});

/**
 * Model Context Protocol (MCP) Server Endpoints
 */
app.get('/api/mcp/tools', (req, res) => {
  res.json({ ok: true, tools: MCP_TOOLS });
});

app.post('/api/mcp', async (req, res) => {
  const response = await handleMcpJsonRpcRequest(req.body, { engine, adkOrchestrator, db });
  broadcastStateUpdate('MCP_TOOL_CALLED', { method: req.body?.method, tool: req.body?.params?.name });
  res.json(response);
});

/**
 * Server-Sent Events stream for real-time multiplayer state synchronization
 */
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  res.write(
    `data: ${JSON.stringify({
      eventType: 'INITIAL_STATE',
      timestamp: new Date().toISOString(),
      state: engine.getState()
    })}\n\n`
  );

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

/**
 * Get complete workspace state (users, software-assigned quotas, sessions, ledger)
 */
app.get('/api/state', (req, res) => {
  const userId = req.query.userId;
  const fullState = engine.getState();
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

  res.json({
    ...fullState,
    visibleSessions: userId ? engine.getSessionsForUser(userId) : fullState.sessions,
    database: db.getDatabaseStatus(),
    adk: adkOrchestrator.getManifest(),
    mcpTools: MCP_TOOLS,
    aiStatus: {
      mode: hasApiKey ? 'live' : 'adk-runtime',
      userApiKeyRequired: false,
      modelDefault: 'gemini-3.8-flash',
      googleClientId: process.env.GOOGLE_CLIENT_ID || null
    }
  });
});

/**
 * AUTHENTICATION: Email/Password Sign-Up with automatic software-assigned token quota
 */
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, email, password, plan = 'Starter', role } = req.body || {};
    const result = engine.registerUser({
      name,
      email,
      password,
      plan,
      authProvider: 'email',
      role
    });
    broadcastStateUpdate('USER_REGISTERED', { user: result.user });
    res.status(201).json({
      ok: true,
      ...result,
      state: engine.getState()
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * AUTHENTICATION: Email/Password Sign-In
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = engine.loginUser({ email, password });
    res.json({
      ok: true,
      ...result,
      state: engine.getState()
    });
  } catch (err) {
    res.status(401).json({ ok: false, error: err.message });
  }
});

/**
 * AUTHENTICATION: Google Sign-In (OAuth / Google Identity Services)
 */
app.post('/api/auth/google', (req, res) => {
  try {
    const { name, email, avatarUrl, credential } = req.body || {};
    let googleProfile = { name, email, avatarUrl };

    // Decode JWT payload if a raw Google Identity Services credential token was passed
    if (credential && typeof credential === 'string' && credential.split('.').length === 3) {
      try {
        const payloadJson = Buffer.from(credential.split('.')[1], 'base64').toString('utf8');
        const decoded = JSON.parse(payloadJson);
        googleProfile = {
          name: decoded.name || name,
          email: decoded.email || email,
          avatarUrl: decoded.picture || avatarUrl
        };
      } catch (_) {
        // Fallback to explicit name/email fields
      }
    }

    const result = engine.loginWithGoogle(googleProfile);
    broadcastStateUpdate('USER_GOOGLE_AUTH', { user: result.user, isNewUser: result.isNewUser });
    res.json({
      ok: true,
      ...result,
      state: engine.getState()
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * PLAN MANAGEMENT: Upgrade or change a user's software subscription tier & token quota
 */
app.post('/api/users/:id/plan', (req, res) => {
  try {
    const userId = req.params.id;
    const { plan } = req.body || {};
    const updatedUser = engine.updateUserPlan(userId, plan);
    broadcastStateUpdate('USER_PLAN_UPDATED', { userId, user: updatedUser });
    res.json({
      ok: true,
      user: updatedUser,
      state: engine.getState()
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * Reset demo state back to clean initial benchmark state
 */
app.post('/api/reset', (req, res) => {
  const fresh = new QuotaEngine();
  engine.state = fresh.getState();
  broadcastStateUpdate('STATE_RESET', {});
  res.json({
    ok: true,
    state: engine.getState()
  });
});

/**
 * List sessions (optionally filtered by userId visibility rules)
 */
app.get('/api/sessions', (req, res) => {
  const { userId } = req.query;
  const sessions = userId ? engine.getSessionsForUser(userId) : engine.getState().sessions;
  res.json({ sessions });
});

/**
 * Resolve a `/s/:shareId` sublink and join the shared session as an authenticated participant
 */
app.post('/api/sessions/join/:shareId', (req, res) => {
  try {
    const { shareId } = req.params;
    const { userId = 'user_b' } = req.body || {};
    const session = engine.joinSessionByShareId(shareId, userId);
    broadcastStateUpdate('SUBLINK_JOINED', {
      shareId,
      sessionId: session.id,
      userId
    });
    res.json({
      ok: true,
      session,
      state: engine.getState()
    });
  } catch (err) {
    res.status(403).json({ ok: false, error: err.message });
  }
});

/**
 * Inspect a `/s/:shareId` sublink metadata
 */
app.get('/api/sessions/share/:shareId', (req, res) => {
  const session = engine.getSessionByShareId(req.params.shareId);
  if (!session) {
    return res.status(404).json({ ok: false, error: 'Shared sublink not found.' });
  }
  const host = engine.getUser(session.ownerId);
  res.json({
    ok: true,
    session,
    host: host ? engine.sanitizeUser(host) : null
  });
});

/**
 * Create a new Shared Session or Personal Chat
 */
app.post('/api/sessions', (req, res) => {
  try {
    const { ownerId = 'user_a', title, type = 'shared', tokenCap = 20000, permission = 'collaborator' } = req.body || {};
    const session = engine.createSession({ ownerId, title, type, tokenCap, permission });
    broadcastStateUpdate('SESSION_CREATED', { sessionId: session.id, ownerId });
    res.status(201).json({ ok: true, session, state: engine.getState() });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * Update a Shared Session's link permissions, token cap, or active status (Host Only)
 */
app.patch('/api/sessions/:id/share', (req, res) => {
  try {
    const sessionId = req.params.id;
    const { requestingUserId = 'user_a', linkActive, permission, tokenCap, allowProModel, regenerateLink } = req.body || {};
    const updatedSession = engine.updateShareConfig(sessionId, requestingUserId, {
      linkActive,
      permission,
      tokenCap,
      allowProModel,
      regenerateLink
    });
    broadcastStateUpdate('SHARE_CONFIG_UPDATED', {
      sessionId,
      shareConfig: updatedSession.shareConfig
    });
    res.json({ ok: true, session: updatedSession, state: engine.getState() });
  } catch (err) {
    res.status(403).json({ ok: false, error: err.message });
  }
});

/**
 * Copy / Fork a Shared Session into a strictly independent Personal Chat owned by `newOwnerUserId`.
 * All subsequent prompts in the new copy consume `newOwnerUserId`'s own personal quota.
 */
app.post('/api/sessions/:id/copy-to-personal', (req, res) => {
  try {
    const sourceSessionId = req.params.id;
    const { userId = 'user_b', customTitle } = req.body || {};
    const newPersonalSession = engine.copySessionToPersonal(sourceSessionId, userId, customTitle);
    broadcastStateUpdate('SESSION_COPIED_TO_PERSONAL', {
      sourceSessionId,
      newSessionId: newPersonalSession.id,
      newOwnerUserId: userId
    });
    res.status(201).json({
      ok: true,
      newSession: newPersonalSession,
      state: engine.getState()
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * Update collaborative canvas document
 */
app.put('/api/sessions/:id/canvas', (req, res) => {
  try {
    const sessionId = req.params.id;
    const { userId = 'user_a', content, title } = req.body || {};
    const canvasDocument = engine.updateCanvas(sessionId, userId, content, title);
    broadcastStateUpdate('CANVAS_UPDATED', { sessionId, userId, canvasDocument });
    res.json({ ok: true, canvasDocument, state: engine.getState() });
  } catch (err) {
    res.status(403).json({ ok: false, error: err.message });
  }
});

/**
 * Submit a prompt in either a Shared Session (Host-Sponsored Quota) or Personal Chat (Personal Quota)
 */
app.post('/api/sessions/:id/messages', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const {
      userId = 'user_a',
      content,
      model = 'gemini-3.8-flash',
      apiKey = null,
      useCompression = true,
      updateCanvasDoc = false
    } = req.body || {};

    if (!content || !String(content).trim()) {
      return res.status(400).json({ ok: false, error: 'Prompt content cannot be empty.' });
    }

    const session = engine.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ ok: false, error: 'Session not found.' });
    }

    const sender = engine.getUser(userId);
    if (!sender) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }

    // Execute Google ADK Multi-Agent Workflow (QuotaGuardTool -> ContextCompressionSubAgent -> CollaborativeArchitectSubAgent)
    const aiResult = await adkOrchestrator.runAgentWorkflow({
      session,
      user: sender,
      prompt: String(content).trim(),
      model,
      apiKey,
      useCompression
    });

    // Validate & charge the appropriate quota (Host's quota for shared sessions, Owner's personal quota for personal sessions)
    const chargeResult = engine.validateAndChargeQuota(
      sessionId,
      userId,
      aiResult.tokenCost,
      aiResult.tokensSaved
    );

    if (!chargeResult.allowed) {
      return res.status(403).json({
        ok: false,
        code: chargeResult.code,
        error: chargeResult.reason,
        canCopyToPersonal: session.type === 'shared',
        state: engine.getState()
      });
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderRoleLabel =
      session.type === 'shared'
        ? session.ownerId === userId
          ? 'Host'
          : 'Collaborator'
        : 'Personal Owner';

    const userMsgTokenCost = Math.max(80, Math.round(aiResult.tokenCost * 0.28));
    const aiMsgTokenCost = Math.max(120, aiResult.tokenCost - userMsgTokenCost);

    const userMessage = {
      id: 'msg_u_' + Date.now(),
      senderId: sender.id,
      senderName: sender.shortName,
      senderRole: senderRoleLabel,
      role: 'user',
      content: String(content).trim(),
      timestamp,
      tokenCost: userMsgTokenCost,
      tokensSaved: 0,
      chargedToUserId: chargeResult.chargedToUserId,
      chargedToName: chargeResult.chargedToName,
      modelUsed: aiResult.modelUsed || model
    };

    const aiMessage = {
      id: 'msg_ai_' + (Date.now() + 1),
      senderId: 'ai',
      senderName: 'CoThread AI',
      senderRole: session.type === 'shared' ? 'Shared AI Architect' : 'Personal AI Assistant',
      role: 'assistant',
      content: aiResult.replyText,
      timestamp,
      tokenCost: aiMsgTokenCost,
      tokensSaved: aiResult.tokensSaved || 0,
      chargedToUserId: chargeResult.chargedToUserId,
      chargedToName: chargeResult.chargedToName,
      modelUsed: aiResult.modelUsed || model,
      compressionStats: aiResult.compressionStats || null
    };

    session.messages.push(userMessage, aiMessage);
    session.updatedAt = new Date().toISOString();

    if ((updateCanvasDoc || aiResult.canvasUpdate) && aiResult.canvasUpdate) {
      session.canvasDocument = {
        title: aiResult.canvasUpdate.title || session.canvasDocument.title,
        content: aiResult.canvasUpdate.content,
        lastEditedBy: `CoThread AI (via ${sender.shortName})`,
        updatedAt: new Date().toISOString()
      };
    }

    broadcastStateUpdate('NEW_MESSAGES', {
      sessionId,
      userMessage,
      aiMessage,
      chargeResult
    });

    res.status(201).json({
      ok: true,
      userMessage,
      aiMessage,
      chargeResult,
      session,
      state: engine.getState()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Explicit Sublink Routing (like gemini.google.com / chatgpt.com)
const spaEntrypoint = path.join(__dirname, 'public', 'index.html');
app.get(['/', '/chat', '/login', '/signup', '/app', '/s/:shareId'], (req, res) => {
  res.sendFile(spaEntrypoint);
});

// Fallback for any other client route
app.get('*', (req, res) => {
  res.sendFile(spaEntrypoint);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[CoThread] Enterprise Multiplayer AI Platform listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, engine };
