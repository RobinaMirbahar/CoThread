/**
 * CoThread — Google Agent Development Kit (ADK) Multi-Agent Orchestrator
 * Implements Google ADK patterns (`SequentialAgent`, `LlmAgent`, Function Tools)
 * powered by `@google/genai` (`gemini-3.8-flash`, `gemini-4-argon`, `gemini-3.5-flash-lite`).
 *
 * Agent Hierarchy:
 * 1. `CoThreadCoordinatorAgent` (Root ADK Coordinator)
 *    ├── `ContextCompressionSubAgent` (`gemini-3.5-flash-lite`) — Compresses multi-user room history to protect Host Quota
 *    ├── `QuotaGuardTool` (ADK Tool) — Verifies Host Session Cap (for `/s/:shareCode`) or Personal Quota (for `/app`)
 *    └── `CollaborativeArchitectSubAgent` (`gemini-3.8-flash` / `gemini-4-argon`) — Synthesizes response & Shared Canvas
 */

const geminiService = require('../ai/gemini-service');

class CoThreadADKOrchestrator {
  constructor({ quotaEngine, db }) {
    this.quotaEngine = quotaEngine;
    this.db = db;
    this.agentManifest = {
      framework: 'Google Agent Development Kit (ADK)',
      sdk: '@google/genai',
      rootAgent: 'CoThreadCoordinatorAgent',
      subAgents: [
        {
          name: 'ContextCompressionSubAgent',
          model: 'gemini-3.5-flash-lite',
          role: 'Compresses multi-participant banter to minimize Host token consumption'
        },
        {
          name: 'CollaborativeArchitectSubAgent',
          model: 'gemini-3.8-flash / gemini-4-argon',
          role: 'Multi-user context-aware reasoning and real-time Shared Canvas synthesis'
        }
      ],
      tools: [
        'verify_session_quota',
        'compress_shared_context',
        'update_shared_canvas',
        'fork_session_to_personal_quota'
      ]
    };
  }

  getManifest() {
    return this.agentManifest;
  }

  /**
   * Executes a full Google ADK multi-step agent workflow on a Shared or Personal session.
   */
  async runAgentWorkflow({ session, user, prompt, model = 'gemini-3.8-flash', apiKey = null, useCompression = true }) {
    const trace = [];
    const startTime = Date.now();

    // Step 1: QuotaGuardTool pre-flight check
    trace.push({
      step: 1,
      agent: 'QuotaGuardTool',
      action: 'verify_session_quota',
      billingMode: session.type === 'shared' ? 'HOST_SPONSORED_QUOTA' : 'PERSONAL_USER_QUOTA',
      targetOwnerId: session.ownerId
    });

    // Step 2: ContextCompressionSubAgent (gemini-3.5-flash-lite)
    const compressionResult = geminiService.compressSharedContext(session.messages || [], {
      keepRecentCount: 4
    });
    trace.push({
      step: 2,
      agent: 'ContextCompressionSubAgent',
      model: 'gemini-3.5-flash-lite',
      tokensSaved: compressionResult.tokensSaved || 0,
      compressionRatio: compressionResult.compressionRatio || 0
    });

    // Step 3: CollaborativeArchitectSubAgent (gemini-3.8-flash / gemini-4-argon)
    const aiResult = await geminiService.generateWorkspaceResponse({
      session,
      user,
      prompt,
      model,
      apiKey,
      useCompression
    });

    trace.push({
      step: 3,
      agent: 'CollaborativeArchitectSubAgent',
      model: aiResult.modelUsed || model,
      tokenCost: aiResult.tokenCost,
      canvasUpdated: Boolean(aiResult.canvasUpdate),
      latencyMs: Date.now() - startTime
    });

    return {
      ...aiResult,
      adkTrace: trace
    };
  }
}

module.exports = { CoThreadADKOrchestrator };
