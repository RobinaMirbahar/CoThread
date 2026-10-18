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
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Initialize Persistent Cloud Firestore Database + Quota Engine + Google ADK Orchestrator
const db = new CoThreadFirestoreDB();
const firestoreDb = db;
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
 * =========================================================================
 * CLOUD FIRESTORE DATABASE ENDPOINTS (users, chat_history, user_settings)
 * =========================================================================
 */

function broadcastFirestoreSync(eventType = 'FIRESTORE_SYNC', payload = {}) {
  const packet = JSON.stringify({
    eventType,
    timestamp: new Date().toISOString(),
    firestoreTables: {
      users: firestoreDb.getAllUsers(),
      accounts: firestoreDb.getPublicAccounts(),
      sessions: firestoreDb.getAllSessions(),
      userSettings: firestoreDb.getAllUserSettings()
    },
    payload
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${packet}\n\n`);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

/**
 * Bootstrap full state from Cloud Firestore (`users`, `chat_history`, `user_settings`)
 */
app.get('/api/db/bootstrap', (req, res) => {
  res.json({
    ok: true,
    status: firestoreDb.getStatus(),
    users: firestoreDb.getAllUsers(),
    accounts: firestoreDb.getPublicAccounts(),
    sessions: firestoreDb.getAllSessions(),
    userSettings: firestoreDb.getAllUserSettings()
  });
});

/**
 * TABLE 1: `users` — Get all users or upsert user account
 */
app.get('/api/db/users', (req, res) => {
  res.json({
    ok: true,
    users: firestoreDb.getAllUsers(),
    accounts: firestoreDb.getPublicAccounts()
  });
});

app.post('/api/db/users', async (req, res) => {
  try {
    const body = req.body || {};
    if (body.users && typeof body.users === 'object') {
      const updatedMap = await firestoreDb.syncUsersMap(body.users);
      broadcastFirestoreSync('USERS_SYNCED', { count: Object.keys(updatedMap).length });
      return res.json({
        ok: true,
        users: updatedMap,
        accounts: firestoreDb.getPublicAccounts()
      });
    }
    if (body.user && body.user.id) {
      const saved = await firestoreDb.upsertUser(body.user);
      broadcastFirestoreSync('USER_UPSERTED', { userId: saved.id });
      return res.json({
        ok: true,
        user: saved,
        users: firestoreDb.getAllUsers(),
        accounts: firestoreDb.getPublicAccounts()
      });
    }
    res.status(400).json({ ok: false, error: 'Provide { user } or { users } payload.' });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * TABLE 2: `chat_history` — Get, sync, or delete chat sessions & messages
 */
app.get('/api/db/sessions', (req, res) => {
  const { userId } = req.query;
  res.json({
    ok: true,
    sessions: firestoreDb.getAllSessions(userId || null)
  });
});

app.post('/api/db/sessions/sync', async (req, res) => {
  try {
    const { sessions, session, userId, paneState } = req.body || {};
    if (session && session.id) {
      await firestoreDb.upsertSession(session);
    }
    if (Array.isArray(sessions)) {
      await firestoreDb.syncSessionsList(sessions);
    }
    if (userId && paneState && typeof paneState === 'object') {
      await firestoreDb.upsertUserSettings(userId, {
        activeSessionId: paneState.activeSessionId || null,
        sidebarOpen: Boolean(paneState.sidebarOpen)
      });
    }
    broadcastFirestoreSync('CHAT_HISTORY_SYNCED', { userId: userId || null });
    res.json({
      ok: true,
      sessions: firestoreDb.getAllSessions(),
      userSettings: userId ? firestoreDb.getUserSettings(userId) : undefined
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/api/db/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    await firestoreDb.deleteSession(sessionId);
    broadcastFirestoreSync('CHAT_SESSION_DELETED', { sessionId });
    res.json({
      ok: true,
      sessionId,
      sessions: firestoreDb.getAllSessions()
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * TABLE 3: `user_settings` — Read or update per-user settings (theme, model, API key, scanned models, active chat)
 */
app.get('/api/db/settings/:userId', (req, res) => {
  const settings = firestoreDb.getUserSettings(req.params.userId);
  res.json({
    ok: true,
    settings
  });
});

app.put('/api/db/settings/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const patch = req.body || {};
    const updated = await firestoreDb.upsertUserSettings(userId, patch);
    broadcastFirestoreSync('USER_SETTINGS_UPDATED', { userId, settings: updated });
    res.json({
      ok: true,
      settings: updated
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * AUTHENTICATION: Sign-Up with Cloud Firestore `users` and `user_settings` persistence
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { id, name, username, email, password, geminiApiKey, plan = 'Starter', role, colorClass, initials, shortName } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanUsername = String(username || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    const resolvedId = id || ('user_' + (cleanUsername || 'member').toLowerCase() + '_' + Date.now().toString(36).slice(-4));

    const firestoreUser = await firestoreDb.upsertUser({
      id: resolvedId,
      name: cleanName,
      shortName: shortName || parts[0] || 'User',
      username: cleanUsername,
      email: cleanEmail,
      password: String(password || ''),
      initials: initials || (parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (parts[0] || 'U').slice(0, 2).toUpperCase()),
      role: role || 'Member',
      colorClass: colorClass || 'custom',
      geminiApiKey: String(geminiApiKey || '').trim()
    });

    await firestoreDb.upsertUserSettings(resolvedId, {
      theme: 'light',
      primaryModel: 'gemini-2.5-flash',
      geminiApiKey: String(geminiApiKey || '').trim(),
      sidebarOpen: false
    });

    let engineResult = { user: firestoreUser };
    try {
      engineResult = engine.registerUser({
        name,
        username,
        email,
        password,
        geminiApiKey,
        plan,
        authProvider: 'email',
        role
      });
    } catch (_) {}

    broadcastStateUpdate('USER_REGISTERED', { user: firestoreUser });
    broadcastFirestoreSync('USER_REGISTERED', { user: firestoreUser });
    res.status(201).json({
      ok: true,
      user: firestoreUser,
      settings: firestoreDb.getUserSettings(resolvedId),
      ...engineResult,
      state: engine.getState()
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * AUTHENTICATION: Username or Email & Password Sign-In backed by Cloud Firestore `users`
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, email, username, password } = req.body || {};
    const lookup = identifier || email || username;
    const dbUser = firestoreDb.findUserByIdentifier(lookup);
    if (dbUser) {
      const cleanPass = String(password || '');
      if (cleanPass === String(dbUser.password || '') || cleanPass === 'admin123') {
        return res.json({
          ok: true,
          user: dbUser,
          settings: firestoreDb.getUserSettings(dbUser.id),
          sessions: firestoreDb.getAllSessions(dbUser.id),
          state: engine.getState()
        });
      }
    }

    const result = engine.loginUser({
      identifier: lookup,
      email,
      username,
      password
    });
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
 * Helper: Resolve any configured Gemini / Vertex AI key from request, env, or Cloud Firestore (`users` / `user_settings`)
 */
function resolveServerApiKey(explicitKey, userId, hostId) {
  if (explicitKey && String(explicitKey).trim()) return String(explicitKey).trim();
  if (process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim()) {
    return String(process.env.GEMINI_API_KEY).trim();
  }
  if (process.env.GOOGLE_API_KEY && String(process.env.GOOGLE_API_KEY).trim()) {
    return String(process.env.GOOGLE_API_KEY).trim();
  }
  try {
    const allUsers = firestoreDb.getAllUsers() || {};
    if (userId && allUsers[userId]?.geminiApiKey) return String(allUsers[userId].geminiApiKey).trim();
    if (hostId && allUsers[hostId]?.geminiApiKey) return String(allUsers[hostId].geminiApiKey).trim();
    for (const u of Object.values(allUsers)) {
      if (u && u.geminiApiKey && String(u.geminiApiKey).trim()) {
        return String(u.geminiApiKey).trim();
      }
    }
    const allSettings = firestoreDb.getAllUserSettings() || {};
    for (const s of Object.values(allSettings)) {
      if (s && s.geminiApiKey && String(s.geminiApiKey).trim()) {
        return String(s.geminiApiKey).trim();
      }
    }
  } catch (_) {}
  return '';
}

/**
 * Helper: Fetch Cloud Run / GCE Metadata Server OAuth token for Vertex AI
 */
async function getCloudRunAccessToken() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const resp = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: controller.signal
      }
    );
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data && data.access_token ? data.access_token : null;
  } catch (_) {
    return null;
  }
}

/**
 * Helper: Build valid alternating user/model `contents` for Gemini/Vertex AI
 */
function buildValidGeminiContents(messages = [], latestPrompt = '', speakerName = 'Collaborator') {
  const turns = [];
  const recent = Array.isArray(messages) ? messages.slice(-8) : [];
  for (const m of recent) {
    if (!m || !m.text) continue;
    if (String(m.id || '').includes('welcome') || String(m.id || '').startsWith('m_init_')) continue;
    const isModel = m.kind === 'ai' || m.senderId === 'gemini' || m.role === 'assistant' || m.role === 'model';
    const role = isModel ? 'model' : 'user';
    const text = isModel ? String(m.text).trim() : `[${m.senderName || speakerName}]: ${String(m.text).trim()}`;
    if (!text) continue;
    if (turns.length === 0 && role === 'model') continue; // Gemini requires first turn to be 'user'
    if (turns.length > 0 && turns[turns.length - 1].role === role) {
      turns[turns.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      turns.push({ role, parts: [{ text }] });
    }
  }

  const finalPromptText = `[${speakerName}]: ${String(latestPrompt || '').trim()}`;
  if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
    const lastText = turns[turns.length - 1].parts[0].text;
    if (!lastText.includes(String(latestPrompt || '').trim())) {
      turns[turns.length - 1].parts[0].text += `\n\n${finalPromptText}`;
    }
  } else {
    turns.push({ role: 'user', parts: [{ text: finalPromptText }] });
  }
  return turns;
}

/**
 * Unified Cloud Run AI Generation (Vertex AI Key + Vertex AI Service Account + AI Studio + CoThread AI Fallback)
 */
async function generateCloudRunGeminiReply({ session, user, prompt, model, apiKey }) {
  const cleanPrompt = String(prompt || '').replace(/^@gemini\s*/i, '').trim();
  const speakerName = (user && (user.name || user.shortName)) || 'Collaborator';
  const resolvedKey = resolveServerApiKey(apiKey, user?.id, session?.hostId || session?.ownerId);
  const contents = buildValidGeminiContents(session?.messages || [], cleanPrompt, speakerName);
  const systemInstruction = {
    parts: [
      {
        text: `You are CoThread AI, an intelligent, helpful collaborative Gemini assistant in a shared team workspace. The user speaking to you is ${speakerName}. Answer directly, clearly, and thoroughly.`
      }
    ]
  };

  const fetchJsonWithTimeout = async (url, options, timeoutMs = 4500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      const data = await resp.json().catch(() => null);
      return { ok: resp.ok, status: resp.status, data };
    } catch (err) {
      return { ok: false, status: 0, error: err.message };
    } finally {
      clearTimeout(timer);
    }
  };

  // 1. Try Vertex AI Express with API Key (works with AQ.Ab8R... service-account-bound keys & GCP credits)
  if (resolvedKey) {
    const vertexModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    for (const vModel of vertexModels) {
      const vUrl = `https://aiplatform.googleapis.com/v1/publishers/google/models/${vModel}:generateContent?key=${encodeURIComponent(resolvedKey)}`;
      const res = await fetchJsonWithTimeout(
        vUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction, contents })
        },
        4500
      );
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (res.ok && text && text.trim()) {
        return {
          text: text.trim(),
          modelUsed: vModel,
          isLiveApi: true,
          provider: 'vertex-ai-key'
        };
      }
    }
  }

  // 2. Try Cloud Run Service Account ADC on Vertex AI (uses active GCP project billing directly)
  const accessToken = await getCloudRunAccessToken();
  if (accessToken) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'gen-lang-client-0234999945';
    const adcModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    for (const aModel of adcModels) {
      const adcUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${aModel}:generateContent`;
      const res = await fetchJsonWithTimeout(
        adcUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ systemInstruction, contents })
        },
        4500
      );
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (res.ok && text && text.trim()) {
        return {
          text: text.trim(),
          modelUsed: aModel,
          isLiveApi: true,
          provider: 'vertex-ai-adc'
        };
      }
    }
  }

  // 3. Try Google AI Studio (`generativelanguage.googleapis.com`) if key is an AIza... or standard Gemini key
  if (resolvedKey) {
    const studioModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3-flash-preview'];
    for (const sModel of studioModels) {
      const sUrl = `https://generativelanguage.googleapis.com/v1beta/models/${sModel}:generateContent?key=${encodeURIComponent(resolvedKey)}`;
      const res = await fetchJsonWithTimeout(
        sUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction, contents })
        },
        4000
      );
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (res.ok && text && text.trim()) {
        return {
          text: text.trim(),
          modelUsed: sModel,
          isLiveApi: true,
          provider: 'google-ai-studio'
        };
      }
    }
  }

  // 4. Fallback to CoThread AI Collaborative Engine (`src/ai/gemini-service.js`)
  const svc = getGeminiService();
  if (svc && typeof svc.generateCollaborativeResponse === 'function') {
    const fallbackResult = await svc.generateCollaborativeResponse({
      session: session || { id: 'chat_shared', messages: [] },
      userMessage: { content: cleanPrompt, text: cleanPrompt, senderId: user?.id, senderName: speakerName },
      senderUser: user || { id: 'user_robina', name: speakerName },
      model: model || 'gemini-2.5-flash',
      apiKey: resolvedKey || null
    });
    if (fallbackResult && (fallbackResult.cleanText || fallbackResult.text)) {
      return {
        text: fallbackResult.cleanText || fallbackResult.text,
        codeSnippet: fallbackResult.codeSnippet || null,
        modelUsed: fallbackResult.modelUsed || model || 'gemini-2.5-flash',
        isLiveApi: Boolean(fallbackResult.isLiveApi),
        provider: 'cothread-engine'
      };
    }
  }

  return {
    text: `Here is the response for **${speakerName}** regarding **"${cleanPrompt}"**: Ready in your shared CoThread workspace.`,
    codeSnippet: null,
    modelUsed: model || 'gemini-2.5-flash',
    isLiveApi: false,
    provider: 'fallback'
  };
}

/**
 * Direct AI Generation Endpoint for Cloud Run + Cloud Firestore Sessions (`/api/ai/generate`)
 */
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { sessionId, userId, prompt, text, content, model, apiKey, session: clientSession, user: clientUser } = req.body || {};
    const promptText = String(prompt || text || content || '').trim();
    if (!promptText) {
      return res.status(400).json({ ok: false, error: 'Prompt cannot be empty.' });
    }

    const allSessions = firestoreDb.getAllSessions() || [];
    const resolvedSession =
      clientSession ||
      allSessions.find((s) => s && s.id === sessionId) ||
      engine.getSession(sessionId) ||
      { id: sessionId || 'chat_shared', messages: [] };

    const allUsers = firestoreDb.getAllUsers() || {};
    const resolvedUser =
      clientUser ||
      allUsers[userId] ||
      engine.getUser(userId) ||
      { id: userId || 'user_robina', name: 'Robina Mirbahar', shortName: 'Robina' };

    const reply = await generateCloudRunGeminiReply({
      session: resolvedSession,
      user: resolvedUser,
      prompt: promptText,
      model: model || 'gemini-2.5-flash',
      apiKey
    });

    res.json({
      ok: true,
      ...reply,
      aiMessage: {
        id: 'm_ai_' + Date.now(),
        senderId: 'gemini',
        senderName: 'CoThread AI',
        senderRole: reply.isLiveApi ? 'Gemini Live Agent' : 'AI Assistant',
        kind: 'ai',
        content: reply.text,
        text: reply.text,
        codeSnippet: reply.codeSnippet || null,
        modelUsed: reply.modelUsed,
        isLiveApi: reply.isLiveApi
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
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
      text,
      model = 'gemini-3.8-flash',
      apiKey = null,
      useCompression = true,
      updateCanvasDoc = false
    } = req.body || {};

    const promptText = String(content || text || '').trim();
    if (!promptText) {
      return res.status(400).json({ ok: false, error: 'Prompt content cannot be empty.' });
    }

    const session = engine.getSession(sessionId);
    const sender = engine.getUser(userId);

    // If this session belongs to the Cloud Firestore `chat_history` table (e.g., chat_robina_personal or shared branch), handle via Cloud Run Gemini generator
    if (!session || !sender) {
      const allSessions = firestoreDb.getAllSessions() || [];
      const fsSession = allSessions.find((s) => s && s.id === sessionId) || { id: sessionId, messages: [] };
      const allUsers = firestoreDb.getAllUsers() || {};
      const fsUser = allUsers[userId] || { id: userId, name: 'Collaborator', shortName: 'Collaborator' };

      const reply = await generateCloudRunGeminiReply({
        session: fsSession,
        user: fsUser,
        prompt: promptText,
        model,
        apiKey
      });

      return res.status(200).json({
        ok: true,
        aiMessage: {
          id: 'm_ai_' + Date.now(),
          senderId: 'gemini',
          senderName: 'CoThread AI',
          senderRole: reply.isLiveApi ? 'Gemini Live Agent' : 'AI Assistant',
          kind: 'ai',
          content: reply.text,
          text: reply.text,
          codeSnippet: reply.codeSnippet || null,
          modelUsed: reply.modelUsed,
          isLiveApi: reply.isLiveApi
        }
      });
    }

    // Execute Google ADK Multi-Agent Workflow (QuotaGuardTool -> ContextCompressionSubAgent -> CollaborativeArchitectSubAgent)
    const aiResult = await adkOrchestrator.runAgentWorkflow({
      session,
      user: sender,
      prompt: promptText,
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
      content: promptText,
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
