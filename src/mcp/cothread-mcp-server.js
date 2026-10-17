#!/usr/bin/env node
/**
 * CoThread — Model Context Protocol (MCP) Server
 * Supports both:
 * 1. Standard MCP JSON-RPC 2.0 over stdio (for Firebase Studio `.idx/mcp.json`, Gemini CLI, Claude Desktop)
 * 2. Express HTTP JSON-RPC 2.0 endpoint (`/api/mcp`) mounted in `server.js`
 *
 * Exposes CoThread's core capabilities as standard MCP Tools & Resources:
 * - `cothread_create_shared_session`: Create a Host-Sponsored `/s/:shareCode` room
 * - `cothread_resolve_sublink`: Inspect or join a `/s/:shareCode` shared session
 * - `cothread_prompt_adk_agent`: Prompt the Google ADK + Gemini 3.8/4 Argon agent in a session
 * - `cothread_fork_to_personal_chat`: Copy a shared session into a private `/app` chat on personal quota
 * - `cothread_get_quota_ledger`: Inspect software-assigned token quotas and ledger entries
 */

const readline = require('readline');

const MCP_TOOLS = [
  {
    name: 'cothread_create_shared_session',
    description: 'Creates a new Host-Sponsored Shared Session (/s/:shareCode) backed by the Host user software token quota.',
    inputSchema: {
      type: 'object',
      properties: {
        ownerId: { type: 'string', description: 'Host user ID who sponsors the session token quota' },
        title: { type: 'string', description: 'Title of the collaborative AI session' },
        tokenCap: { type: 'number', description: 'Maximum tokens allocated from Host quota for this session' },
        permission: { type: 'string', enum: ['collaborator', 'viewer'], description: 'Participant permission mode' }
      },
      required: ['ownerId', 'title']
    }
  },
  {
    name: 'cothread_resolve_sublink',
    description: 'Resolves a CoThread /s/:shareCode sublink and returns session metadata, participants, and Host quota status.',
    inputSchema: {
      type: 'object',
      properties: {
        shareCode: { type: 'string', description: 'Share code from /s/:shareCode' },
        userId: { type: 'string', description: 'Optional userId joining the sublink' }
      },
      required: ['shareCode']
    }
  },
  {
    name: 'cothread_prompt_adk_agent',
    description: 'Sends a collaborative prompt to the CoThread Google ADK Agent (Gemini 3.8 Flash / Gemini 4 Argon) with automatic Gemini 3.5 Flash-Lite context compression.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Target session ID (shared or personal)' },
        userId: { type: 'string', description: 'Sender user ID' },
        prompt: { type: 'string', description: 'Prompt message for Gemini' },
        model: { type: 'string', enum: ['gemini-3.8-flash', 'gemini-4-argon'], description: 'Gemini model' }
      },
      required: ['sessionId', 'userId', 'prompt']
    }
  },
  {
    name: 'cothread_fork_to_personal_chat',
    description: 'Copies a Shared Session into an independent Personal Chat (/app) where all subsequent prompts charge the user own personal software token quota.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Source shared session ID' },
        userId: { type: 'string', description: 'User ID creating the independent personal copy' }
      },
      required: ['sessionId', 'userId']
    }
  },
  {
    name: 'cothread_get_quota_ledger',
    description: 'Returns software-assigned account token quotas (Starter 25k, Pro 250k, Enterprise 1M) and recent quota attribution ledger entries.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Optional user ID filter' }
      }
    }
  }
];

async function handleMcpJsonRpcRequest(rpcRequest, { engine, adkOrchestrator, db }) {
  const { jsonrpc = '2.0', id = null, method, params = {} } = rpcRequest || {};

  try {
    if (method === 'initialize') {
      return {
        jsonrpc,
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'cothread-mcp-server',
            version: '2.0.0'
          },
          capabilities: {
            tools: {},
            resources: {}
          }
        }
      };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc,
        id,
        result: {
          tools: MCP_TOOLS
        }
      };
    }

    if (method === 'resources/list') {
      const state = engine.getState();
      return {
        jsonrpc,
        id,
        result: {
          resources: (state.sessions || []).map((s) => ({
            uri: `cothread://sessions/${s.id}`,
            name: s.title,
            mimeType: 'application/json',
            description: `${s.type.toUpperCase()} Session • ${s.messages.length} messages`
          }))
        }
      };
    }

    if (method === 'tools/call') {
      const toolName = params.name;
      const args = params.arguments || {};

      if (toolName === 'cothread_create_shared_session') {
        const session = engine.createSession({
          ownerId: args.ownerId || 'user_a',
          title: args.title || 'New Shared Session',
          type: 'shared',
          tokenCap: args.tokenCap || 25000,
          permission: args.permission || 'collaborator'
        });
        if (db) db.saveSnapshot(engine.state);
        return {
          jsonrpc,
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify({ ok: true, session }, null, 2) }]
          }
        };
      }

      if (toolName === 'cothread_resolve_sublink') {
        const session = args.userId
          ? engine.joinSessionByShareId(args.shareCode, args.userId)
          : engine.getSessionByShareId(args.shareCode);
        if (db) db.saveSnapshot(engine.state);
        return {
          jsonrpc,
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify({ ok: Boolean(session), session }, null, 2) }]
          }
        };
      }

      if (toolName === 'cothread_fork_to_personal_chat') {
        const newSession = engine.copySessionToPersonal(args.sessionId, args.userId);
        if (db) db.saveSnapshot(engine.state);
        return {
          jsonrpc,
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify({ ok: true, newSession }, null, 2) }]
          }
        };
      }

      if (toolName === 'cothread_get_quota_ledger') {
        const state = engine.getState();
        return {
          jsonrpc,
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    users: state.users,
                    quotaLedger: (state.quotaLedger || []).slice(0, 15)
                  },
                  null,
                  2
                )
              }
            ]
          }
        };
      }

      if (toolName === 'cothread_prompt_adk_agent') {
        const session = engine.getSession(args.sessionId);
        const user = engine.getUser(args.userId);
        if (!session || !user) {
          throw new Error('Session or User not found.');
        }
        const aiResult = await adkOrchestrator.runAgentWorkflow({
          session,
          user,
          prompt: args.prompt,
          model: args.model || 'gemini-3.8-flash',
          useCompression: true
        });
        const charge = engine.validateAndChargeQuota(
          session.id,
          user.id,
          aiResult.tokenCost,
          aiResult.tokensSaved
        );
        if (db) db.saveSnapshot(engine.state);
        return {
          jsonrpc,
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ ok: charge.allowed, aiResult, charge }, null, 2)
              }
            ]
          }
        };
      }

      throw new Error(`Unknown MCP tool: ${toolName}`);
    }

    return {
      jsonrpc,
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    };
  } catch (err) {
    return {
      jsonrpc,
      id,
      error: { code: -32000, message: err.message }
    };
  }
}

// Allow standalone stdio execution for Firebase Studio / Gemini CLI / Claude Desktop
if (require.main === module) {
  const { QuotaEngine } = require('../core/quota-engine');
  const { CoThreadFirestoreDB } = require('../db/firestore-db');
  const { CoThreadADKOrchestrator } = require('../adk/cothread-adk-agent');

  const db = new CoThreadFirestoreDB();
  const engine = new QuotaEngine();
  engine.state = db.loadSnapshot(() => engine.getState());
  const adkOrchestrator = new CoThreadADKOrchestrator({ quotaEngine: engine, db });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const req = JSON.parse(trimmed);
      const res = await handleMcpJsonRpcRequest(req, { engine, adkOrchestrator, db });
      process.stdout.write(JSON.stringify(res) + '\n');
    } catch (e) {
      process.stdout.write(
        JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'
      );
    }
  });
}

module.exports = { MCP_TOOLS, handleMcpJsonRpcRequest };
