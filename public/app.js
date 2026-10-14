/**
 * CoThread — Collaborative AI Platform (Claude.com + Gemini.google + OpenAI.com Fusion)
 * Features:
 * 1. Flagship Editorial Company Website at `/` with Claude.com-style Hero Onboarding + Gemini Aurora Stage + Pricing Plans
 * 2. Warm Editorial Daylight Theme (default) + 1-Click Obsidian Dark Mode Toggle
 * 3. Managed Software Token Quotas per Account Tier (Starter: 25k, Pro: 250k, Enterprise: 1M) — Zero API keys in UI
 * 4. Sublink Routing (`/`, `/app`, `/s/:shareCode`, `?s=cothread-...`)
 * 5. Host-Sponsored Shared Sessions + 1-Click "Continue Independently (Copy to My Chats)" (Strictly no merge-back UI)
 * 6. Cross-Tab Real-Time Sync via BroadcastChannel + Optional Side-by-Side Colleague Preview
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cothread_editorial_state_v3';
  const TAB_AUTH_KEY = 'cothread_tab_auth_user_v3';
  const THEME_KEY = 'cothread_theme_v3';
  const CHANNEL_NAME = 'cothread_realtime';

  const PLAN_TIERS = {
    starter: {
      id: 'starter',
      name: 'CoThread Starter',
      badge: 'STARTER',
      quota: 25000,
      desc: '25,000 monthly software tokens • Join unlimited Shared Sessions'
    },
    pro: {
      id: 'pro',
      name: 'CoThread Pro',
      badge: 'PRO',
      quota: 250000,
      desc: '250,000 monthly software tokens • Host Shared Sessions up to 100k cap'
    },
    enterprise: {
      id: 'enterprise',
      name: 'CoThread Enterprise',
      badge: 'ENTERPRISE',
      quota: 1000000,
      desc: '1,000,000 monthly software tokens • Unlimited Shared Rooms & Org Governance'
    }
  };

  function createDefaultState() {
    return {
      primaryModel: 'gemini-3.8-flash',
      compressionModel: 'gemini-3.5-flash-lite',
      sideBySideMode: false,
      typingStatus: null,
      accounts: {
        alex: {
          id: 'alex',
          name: 'Alex Rivera',
          shortName: 'Alex',
          email: 'alex@company.com',
          initials: 'AR',
          planTier: 'pro',
          quotaTotal: 250000,
          quotaUsed: 14820,
          colorClass: 'alex'
        },
        hasnain: {
          id: 'hasnain',
          name: 'Hasnain Khan',
          shortName: 'Hasnain',
          email: 'hasnain@company.com',
          initials: 'HK',
          planTier: 'starter',
          quotaTotal: 25000,
          quotaUsed: 3420,
          colorClass: 'hasnain'
        },
        sarah: {
          id: 'sarah',
          name: 'Sarah Chen',
          shortName: 'Sarah',
          email: 'sarah@company.com',
          initials: 'SC',
          planTier: 'pro',
          quotaTotal: 250000,
          quotaUsed: 6150,
          colorClass: 'sarah'
        }
      },
      paneState: {
        alex: {
          activeSessionId: 'shared_arch_room',
          composerMode: 'ai',
          canvasOpen: true,
          draftText: ''
        },
        hasnain: {
          activeSessionId: 'shared_arch_room',
          composerMode: 'ai',
          canvasOpen: false,
          draftText: ''
        }
      },
      sessions: [
        {
          id: 'shared_arch_room',
          type: 'shared',
          title: 'Cloud Run Multiplayer Architecture & Quota Router',
          hostId: 'alex',
          hostName: 'Alex Rivera',
          hostShortName: 'Alex',
          shareCode: 'cothread-arch-9x2k',
          linkActive: true,
          permissionMode: 'can_prompt',
          tokenCap: 25000,
          tokensUsed: 4820,
          tokensSavedByCompression: 1940,
          participantUsage: {
            alex: 2190,
            hasnain: 1840,
            sarah: 790
          },
          participants: ['alex', 'hasnain', 'sarah'],
          canvasTitle: 'cothread_quota_router.ts',
          canvasLastEditedBy: 'Alex & Gemini 3.8 Flash',
          canvasContent:
`// CoThread Shared Architecture Artifact (/s/cothread-arch-9x2k)
// Sponsored by Host Quota: Alex Rivera (Pro Plan • 25,000 Session Cap)

export interface CoThreadSessionLedger {
  sessionId: string;
  shareSublink: string; // "/s/cothread-arch-9x2k"
  hostAccountId: string;
  sessionTokenCap: number;
  sessionTokensUsed: number;
  guestPermission: 'can_prompt' | 'view_only';
}

export async function routeCoThreadQuota(ctx: {
  sessionType: 'shared' | 'personal';
  hostAccountId: string;
  activeAccountId: string;
  tokens: number;
}) {
  // Shared Session prompts deduct from the Host's software-assigned quota
  if (ctx.sessionType === 'shared') {
    return debitAccountQuota(ctx.hostAccountId, ctx.tokens, 'HOST_SPONSORED_SESSION');
  }
  // Personal Chats (including copied threads) deduct from the user's own account quota
  return debitAccountQuota(ctx.activeAccountId, ctx.tokens, 'PERSONAL_ACCOUNT_QUOTA');
}`,
          messages: [
            {
              id: 'm_1',
              senderId: 'alex',
              senderName: 'Alex Rivera',
              senderRole: 'Host',
              kind: 'chat',
              timestamp: '10:14 AM',
              text: "Hey @Hasnain and @Sarah! I shared this live CoThread session (/s/cothread-arch-9x2k) and allocated a 25,000 token allowance from my CoThread Pro quota. Prompt @Gemini directly in here so we can finalize the architecture together."
            },
            {
              id: 'm_2',
              senderId: 'hasnain',
              senderName: 'Hasnain Khan',
              senderRole: 'Colleague',
              kind: 'prompt',
              timestamp: '10:15 AM',
              text: "@Gemini Design a real-time token metering pipeline for CoThread that charges shared session prompts to Alex's Host Quota while compressing context via gemini-3.5-flash-lite."
            },
            {
              id: 'm_3',
              senderId: 'gemini',
              senderName: 'Gemini 3.8 Flash',
              senderRole: 'CoThread AI',
              kind: 'ai',
              modelUsed: 'gemini-3.8-flash',
              timestamp: '10:15 AM',
              triggeredBy: 'Hasnain',
              quotaChargedTo: 'Host (Alex Rivera • Pro Quota)',
              quotaType: 'host',
              tokensCharged: 410,
              tokensSaved: 185,
              text: "Here is the **CoThread Host-Sponsored Quota Metering Pipeline** for `/s/cothread-arch-9x2k`:\n\n1. **Zero API Key SaaS Provisioning**: CoThread assigns a managed software token quota to each user account (`Starter: 25k`, `Pro: 250k`, `Enterprise: 1M`).\n2. **Host-Sponsored Shared Sublinks**: While inside `/s/cothread-arch-9x2k`, prompts from any permitted colleague (`Hasnain`, `Sarah`) are debited against **Alex's 25,000 session cap**.\n3. **1-Click Independent Copy**: Clicking **Continue Independently (Copy to My Chats)** clones the history into the colleague's private `/app` workspace where future prompts debit their own software quota.",
              codeSnippet:
`// CoThread Quota Enforcement Middleware
if (session.tokensUsed + estimatedTokens > session.tokenCap) {
  throw new CoThreadQuotaError('Host session allowance reached');
}
const distilled = await flashLiteCompressor.compress(session.messages);
const reply = await gemini38Flash.generate({ context: distilled, prompt });
await ledger.debitHostSession(session.hostId, session.id, reply.tokens);`
            },
            {
              id: 'm_4',
              senderId: 'sarah',
              senderName: 'Sarah Chen',
              senderRole: 'Colleague',
              kind: 'chat',
              timestamp: '10:17 AM',
              text: "This is so much cleaner than pasting screenshots in Slack. And whenever I want to test my own microservice edge-cases privately, I just click 'Continue Independently (Copy to My Chats)'."
            }
          ]
        },
        {
          id: 'shared_launch_room',
          type: 'shared',
          title: 'Product Launch & Enterprise Security Review',
          hostId: 'alex',
          hostName: 'Alex Rivera',
          hostShortName: 'Alex',
          shareCode: 'cothread-sec-4m8p',
          linkActive: true,
          permissionMode: 'can_prompt',
          tokenCap: 15000,
          tokensUsed: 2150,
          tokensSavedByCompression: 820,
          participantUsage: {
            alex: 1250,
            hasnain: 900
          },
          participants: ['alex', 'hasnain'],
          canvasTitle: 'security_checklist.md',
          canvasLastEditedBy: 'Hasnain',
          canvasContent:
`# CoThread Enterprise Security & Quota Governance
- Google Workspace OAuth 2.0 SSO
- Per-session Host Token Cap slider (5,000 to 100,000 tokens)
- Instant sublink revocation (/s/cothread-sec-4m8p)
- Independent Personal Chat isolation (/app)`,
          messages: [
            {
              id: 'm_p1',
              senderId: 'alex',
              senderName: 'Alex Rivera',
              senderRole: 'Host',
              kind: 'chat',
              timestamp: '09:45 AM',
              text: "Hasnain, I opened `/s/cothread-sec-4m8p` for our security review. Feel free to prompt @Gemini here."
            },
            {
              id: 'm_p2',
              senderId: 'hasnain',
              senderName: 'Hasnain Khan',
              senderRole: 'Colleague',
              kind: 'prompt',
              timestamp: '09:46 AM',
              text: "@Gemini Summarize how CoThread isolates Shared Sessions (/s/:code) from Personal Chats (/app)."
            },
            {
              id: 'm_p3',
              senderId: 'gemini',
              senderName: 'Gemini 3.8 Flash',
              senderRole: 'CoThread AI',
              kind: 'ai',
              modelUsed: 'gemini-3.8-flash',
              timestamp: '09:46 AM',
              triggeredBy: 'Hasnain',
              quotaChargedTo: 'Host (Alex Rivera • Pro Quota)',
              quotaType: 'host',
              tokensCharged: 320,
              tokensSaved: 140,
              text: "• **Shared Sessions (`/s/:shareCode`)**: Live multi-participant rooms where the Host sponsors the token allowance and controls permissions (`Can Prompt AI` vs `View Only`).\n• **Personal Chats (`/app`)**: Private conversations billed strictly to the logged-in user's own CoThread software token quota.\n• **Continue Independently (Copy to My Chats)**: Creates a clean one-way copy into `/app` so colleagues can explore tangents on their own quota without affecting the shared room."
            }
          ]
        },
        {
          id: 'personal_alex_1',
          type: 'personal',
          ownerId: 'alex',
          ownerName: 'Alex',
          forkedFromSessionId: null,
          forkedFromTitle: null,
          title: 'Q4 Cloud Run Autoscaling & Token Economics',
          tokensUsed: 1240,
          canvasTitle: 'q4_token_economics.md',
          canvasLastEditedBy: 'Alex (Private)',
          canvasContent:
`# Alex's Private Cost & Quota Notes (/app)
- Billed 100% to Alex Rivera's CoThread Pro Quota (250,000 tokens)`,
          messages: [
            {
              id: 'm_pa1',
              senderId: 'alex',
              senderName: 'Alex Rivera',
              senderRole: 'Personal Owner',
              kind: 'prompt',
              timestamp: 'Yesterday',
              text: "@Gemini Estimate monthly token savings for a 40-engineer org using Gemini 3.5 Flash-Lite compression."
            },
            {
              id: 'm_pa2',
              senderId: 'gemini',
              senderName: 'Gemini 3.8 Flash',
              senderRole: 'CoThread AI',
              kind: 'ai',
              modelUsed: 'gemini-3.8-flash',
              timestamp: 'Yesterday',
              triggeredBy: 'Alex',
              quotaChargedTo: 'Alex Rivera (My Pro Quota)',
              quotaType: 'personal',
              tokensCharged: 360,
              tokensSaved: 110,
              text: "With **Gemini 3.5 Flash-Lite** compressing rolling thread history by ~38%, a 40-engineer organization saves approximately **1.4M tokens per month** while maintaining full architectural fidelity."
            }
          ]
        },
        {
          id: 'personal_hasnain_1',
          type: 'personal',
          ownerId: 'hasnain',
          ownerName: 'Hasnain',
          forkedFromSessionId: null,
          forkedFromTitle: null,
          title: 'WebSocket Reconnection & Sublink Router Notes',
          tokensUsed: 980,
          canvasTitle: 'sublink_router.ts',
          canvasLastEditedBy: 'Hasnain (Private)',
          canvasContent:
`// Hasnain's Private Workspace (/app)
// Billed to Hasnain Khan's Starter Quota (25,000 tokens)
const parseSublink = (path: string) => path.match(/\\/s\\/(cothread-[a-z0-9-]+)/i);`,
          messages: [
            {
              id: 'm_ph1',
              senderId: 'hasnain',
              senderName: 'Hasnain Khan',
              senderRole: 'Personal Owner',
              kind: 'prompt',
              timestamp: 'Yesterday',
              text: "@Gemini Write a clean regex parser to detect CoThread share sublinks (/s/cothread-...) and route users after Google Sign-In."
            },
            {
              id: 'm_ph2',
              senderId: 'gemini',
              senderName: 'Gemini 3.8 Flash',
              senderRole: 'CoThread AI',
              kind: 'ai',
              modelUsed: 'gemini-3.8-flash',
              timestamp: 'Yesterday',
              triggeredBy: 'Hasnain',
              quotaChargedTo: 'Hasnain Khan (My Starter Quota)',
              quotaType: 'personal',
              tokensCharged: 340,
              tokensSaved: 95,
              text: "You can match `/s/(cothread-[a-z0-9-]+)` in `location.pathname`, `location.hash`, or `?s=` query parameters, store the pending invite token, and immediately join the room once Google OAuth completes."
            }
          ]
        }
      ]
    };
  }

  let state = loadState();
  let currentUserId = loadTabUser();
  let pendingInviteShareCode = detectSublinkShareCode();
  let activeShareModalSessionId = 'shared_arch_room';
  let activeQuotaModalUserId = null;

  // Initialize Theme (Default: Warm Editorial Light like claude.com & gemini.google)
  function initTheme() {
    let savedTheme = 'light';
    try {
      savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) {
      savedTheme = 'light';
    }
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    const clean = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', clean);
    try {
      localStorage.setItem(THEME_KEY, clean);
    } catch (e) {
      // ignore
    }
    const webIcon = document.getElementById('websiteThemeIcon');
    const webLbl = document.getElementById('websiteThemeLabel');
    const appIcon = document.getElementById('appThemeIcon');
    if (webIcon) webIcon.textContent = clean === 'light' ? '☀️' : '🌙';
    if (webLbl) webLbl.textContent = clean === 'light' ? 'Editorial Light' : 'Obsidian Dark';
    if (appIcon) appIcon.textContent = clean === 'light' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(cur === 'light' ? 'dark' : 'light');
  }

  // BroadcastChannel for cross-tab real-time sync
  let bc = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'STATE_SYNC' && ev.data.state) {
          const localSplit = state.sideBySideMode;
          state = ev.data.state;
          state.sideBySideMode = localSplit;
          renderApp();
          pulseSyncBadge('Synced Live');
        } else if (ev.data && ev.data.type === 'TOAST') {
          showToast(ev.data.message, ev.data.variant);
        }
      };
    }
  } catch (e) {
    // fallback
  }

  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY && ev.newValue) {
      try {
        const incoming = JSON.parse(ev.newValue);
        const localSplit = state.sideBySideMode;
        state = incoming;
        state.sideBySideMode = localSplit;
        renderApp();
      } catch (err) {
        // ignore
      }
    }
  });

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.accounts && Array.isArray(parsed.sessions)) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return createDefaultState();
  }

  function loadTabUser() {
    try {
      const saved = sessionStorage.getItem(TAB_AUTH_KEY);
      if (saved && state.accounts[saved]) {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  function setTabUser(userId) {
    currentUserId = userId;
    try {
      if (userId) {
        sessionStorage.setItem(TAB_AUTH_KEY, userId);
      } else {
        sessionStorage.removeItem(TAB_AUTH_KEY);
      }
    } catch (e) {
      // ignore
    }
  }

  function saveAndBroadcastState(toastMsg, toastVariant) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
    if (bc) {
      try {
        bc.postMessage({ type: 'STATE_SYNC', state });
        if (toastMsg) {
          bc.postMessage({ type: 'TOAST', message: toastMsg, variant: toastVariant || 'shared' });
        }
      } catch (e) {
        // ignore
      }
    }
  }

  function detectSublinkShareCode() {
    try {
      const params = new URLSearchParams(window.location.search);
      const qCode = params.get('s') || params.get('join');
      if (qCode) return qCode.trim();

      const hash = window.location.hash || '';
      const hashMatch = hash.match(/\/s\/([a-zA-Z0-9_-]+)/);
      if (hashMatch) return hashMatch[1];

      const path = window.location.pathname || '';
      const pathMatch = path.match(/\/s\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) return pathMatch[1];
    } catch (e) {
      // ignore
    }
    return null;
  }

  function findSessionByShareCode(code) {
    if (!code) return null;
    return state.sessions.find(
      (s) => s.type === 'shared' && (s.shareCode === code || s.id === code)
    );
  }

  function getSessionById(sessionId) {
    return state.sessions.find((s) => s.id === sessionId) || state.sessions[0];
  }

  function ensurePaneStateForUser(userId) {
    if (!state.paneState[userId]) {
      state.paneState[userId] = {
        activeSessionId: 'shared_arch_room',
        composerMode: 'ai',
        canvasOpen: false,
        draftText: ''
      };
    }
    return state.paneState[userId];
  }

  function fmtNum(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMessageText(rawText) {
    let safe = escapeHtml(rawText);
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
    safe = safe.replace(/@(Gemini|Hasnain|Alex|Sarah)/gi, '<strong style="color:var(--accent-terracotta)">@$1</strong>');
    return safe;
  }

  function nowTimeLabel() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function pulseSyncBadge(text) {
    const el = document.getElementById('syncStatusText');
    if (!el) return;
    el.textContent = text || 'Live Sync';
    setTimeout(() => {
      if (el) el.textContent = 'Live Sync';
    }, 2200);
  }

  // =========================================================
  // AUTHENTICATION & WORKSPACE LAUNCH
  // =========================================================

  function completeLoginAsUser(userId, isNewSignup) {
    const account = state.accounts[userId];
    if (!account) return;

    ensurePaneStateForUser(userId);

    const invitedSession = findSessionByShareCode(pendingInviteShareCode);
    if (invitedSession) {
      if (!invitedSession.participants.includes(userId)) {
        invitedSession.participants.push(userId);
      }
      if (invitedSession.participantUsage[userId] === undefined) {
        invitedSession.participantUsage[userId] = 0;
      }
      state.paneState[userId].activeSessionId = invitedSession.id;
      pendingInviteShareCode = null;
      showToast(
        `Signed in as ${account.name} (${account.email}) and joined "${invitedSession.title}" sponsored by ${invitedSession.hostShortName}'s Quota!`,
        'shared'
      );
    } else {
      showToast(
        isNewSignup
          ? `Welcome to CoThread, ${account.name}! Provisioned ${fmtNum(account.quotaTotal)} software tokens (${PLAN_TIERS[account.planTier]?.name}).`
          : `Signed in as ${account.name} (${account.email}) • ${fmtNum(account.quotaTotal - account.quotaUsed)} software tokens available.`,
        'shared'
      );
    }

    setTabUser(userId);
    saveAndBroadcastState();
    closeGoogleChooserModal();
    renderApp();
  }

  function registerOrSignInWithDetails(name, email, planTierKey) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) return;

    const existingEntry = Object.values(state.accounts).find(
      (a) => a.email.toLowerCase() === cleanEmail
    );
    if (existingEntry) {
      if (planTierKey && PLAN_TIERS[planTierKey]) {
        existingEntry.planTier = planTierKey;
        existingEntry.quotaTotal = PLAN_TIERS[planTierKey].quota;
      }
      completeLoginAsUser(existingEntry.id, false);
      return;
    }

    const tier = PLAN_TIERS[planTierKey] || PLAN_TIERS.pro;
    const cleanName = String(name || cleanEmail.split('@')[0]).trim();
    const parts = cleanName.split(/\s+/);
    const shortName = parts[0] || 'User';
    const initials = parts
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newId = 'user_' + cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 12) + '_' + Date.now().toString(36).slice(-3);

    state.accounts[newId] = {
      id: newId,
      name: cleanName,
      shortName,
      email: cleanEmail,
      initials: initials || 'CT',
      planTier: tier.id,
      quotaTotal: tier.quota,
      quotaUsed: 0,
      colorClass: 'custom'
    };

    state.sessions.push({
      id: 'personal_welcome_' + newId,
      type: 'personal',
      ownerId: newId,
      ownerName: shortName,
      forkedFromSessionId: null,
      forkedFromTitle: null,
      title: `${shortName}'s Personal AI Workspace`,
      tokensUsed: 0,
      canvasTitle: 'workspace_notes.md',
      canvasLastEditedBy: shortName,
      canvasContent: `# ${cleanName}'s Private CoThread Canvas (/app)\nProvisioned Software Token Quota: ${fmtNum(tier.quota)} tokens (${tier.name})\n`,
      messages: [
        {
          id: 'm_w_' + Date.now(),
          senderId: 'gemini',
          senderName: 'Gemini 3.8 Flash',
          senderRole: 'CoThread AI',
          kind: 'ai',
          modelUsed: 'gemini-3.8-flash',
          timestamp: nowTimeLabel(),
          triggeredBy: shortName,
          quotaChargedTo: `${cleanName} (My ${tier.badge} Quota)`,
          quotaType: 'personal',
          tokensCharged: 0,
          tokensSaved: 0,
          text: `Welcome to **CoThread**, **${cleanName}**! Your account (\`${cleanEmail}\`) has been provisioned with **${fmtNum(tier.quota)} monthly software tokens** on the **${tier.name}** plan.\n\n• Open **Shared Sessions (\`/s/:code\`)** in the left sidebar to collaborate with colleagues using the Host's sponsored quota.\n• Click **Continue Independently (Copy to My Chats)** in any shared session to copy the conversation into your private **Personal Chats (\`/app\`)**.`
        }
      ]
    });

    ensurePaneStateForUser(newId);
    completeLoginAsUser(newId, true);
  }

  function returnToCompanyWebsite() {
    setTabUser(null);
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================
  // CORE WORKSPACE ACTIONS: SEND, PROMPT AI, COPY TO MY CHATS
  // =========================================================

  function continueIndependentlyToMyChats(userId, sourceSessionId) {
    const sourceSession = getSessionById(sourceSessionId);
    const account = state.accounts[userId];
    if (!sourceSession || !account) return;

    const newPersonalId = 'personal_copy_' + userId + '_' + Date.now();
    const copiedMessages = sourceSession.messages.map((m, idx) => ({
      ...m,
      id: m.id + '_copy_' + idx
    }));

    copiedMessages.push({
      id: 'm_fork_notice_' + Date.now(),
      senderId: userId,
      senderName: account.name,
      senderRole: 'Personal Account',
      kind: 'chat',
      timestamp: nowTimeLabel(),
      text: `🔀 Copied from Shared Session "${sourceSession.title}" (/s/${sourceSession.shareCode}) into ${account.shortName}'s Personal Chats (/app). All new @Gemini prompts here deduct from ${account.shortName}'s software-assigned token quota (${fmtNum(account.quotaTotal)} plan), leaving ${sourceSession.hostShortName}'s Host Quota untouched.`
    });

    const newPersonalSession = {
      id: newPersonalId,
      type: 'personal',
      ownerId: userId,
      ownerName: account.shortName,
      forkedFromSessionId: sourceSession.id,
      forkedFromTitle: sourceSession.title,
      forkedFromShareCode: sourceSession.shareCode,
      title: `${sourceSession.title} (${account.shortName}'s Copy)`,
      tokensUsed: 0,
      canvasTitle: sourceSession.canvasTitle.replace(/\.([a-z]+)$/i, `.${account.shortName.toLowerCase()}.$1`),
      canvasLastEditedBy: `${account.shortName} (Personal Copy)`,
      canvasContent:
        `// 🔀 INDEPENDENT PERSONAL COPY (/app) — Owned by ${account.name} (${account.email})\n` +
        `// Copied from Shared Session: /s/${sourceSession.shareCode}\n\n` +
        sourceSession.canvasContent,
      messages: copiedMessages
    };

    state.sessions.push(newPersonalSession);
    ensurePaneStateForUser(userId).activeSessionId = newPersonalId;
    ensurePaneStateForUser(userId).composerMode = 'ai';

    const msg = `Copied "${sourceSession.title}" to ${account.shortName}'s Personal Chats (/app)! Future prompts use ${account.shortName}'s software quota.`;
    saveAndBroadcastState(msg, 'personal');
    renderApp();
    showToast(msg, 'personal');
  }

  async function handleSendMessage(userId, sessionId, rawInputText, forcedMode) {
    const session = getSessionById(sessionId);
    const account = state.accounts[userId];
    if (!session || !account) return;

    const pane = ensurePaneStateForUser(userId);
    const text = (rawInputText !== undefined ? rawInputText : pane.draftText || '').trim();
    if (!text) return;

    const mode = forcedMode || (text.toLowerCase().includes('@gemini') ? 'ai' : pane.composerMode);
    pane.draftText = '';

    if (session.type === 'shared') {
      if (!session.linkActive && userId !== session.hostId) {
        showToast(`Host (${session.hostShortName}) revoked this sublink (/s/${session.shareCode}).`, 'personal');
        renderApp();
        return;
      }
      if (mode === 'ai' && session.permissionMode === 'view_only' && userId !== session.hostId) {
        showToast(
          `Host (${session.hostShortName}) set this session to "View & Team Chat Only". Click "Continue Independently (Copy to My Chats)" to prompt Gemini using your own quota!`,
          'personal'
        );
        renderApp();
        return;
      }
      if (mode === 'ai' && session.tokensUsed >= session.tokenCap) {
        showToast(
          `Shared Session Token Cap (${fmtNum(session.tokenCap)} tokens) reached! Host can raise the cap, or you can click "Continue Independently (Copy to My Chats)".`,
          'personal'
        );
        renderApp();
        return;
      }
    } else {
      if (mode === 'ai' && account.quotaUsed >= account.quotaTotal) {
        showToast(
          `You have reached your ${fmtNum(account.quotaTotal)} software token quota! Click "Manage Plan & Quota" in the sidebar to upgrade your tier.`,
          'personal'
        );
        renderApp();
        return;
      }
    }

    const humanMsg = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      senderId: userId,
      senderName: account.name,
      senderRole:
        session.type === 'shared'
          ? userId === session.hostId
            ? 'Host'
            : 'Colleague'
          : 'Personal Account',
      kind: mode === 'ai' ? 'prompt' : 'chat',
      timestamp: nowTimeLabel(),
      text: mode === 'ai' && !text.toLowerCase().includes('@gemini') ? `@Gemini ${text}` : text
    };

    session.messages.push(humanMsg);

    if (mode === 'chat') {
      saveAndBroadcastState();
      renderApp();
      scrollChatToBottom(sessionId);
      return;
    }

    state.typingStatus = {
      sessionId: session.id,
      text: `CoThread (${state.primaryModel}) is compressing context via ${state.compressionModel} & generating response for ${account.shortName}...`
    };
    saveAndBroadcastState();
    renderApp();
    scrollChatToBottom(sessionId);

    const aiReply = await synthesizeCoThreadAIResponse(session, account, text);

    state.typingStatus = null;

    const tokensCharged = aiReply.tokensCharged;
    const tokensSaved = aiReply.tokensSaved;

    if (session.type === 'shared') {
      session.tokensUsed = Math.min(session.tokenCap, (session.tokensUsed || 0) + tokensCharged);
      session.tokensSavedByCompression = (session.tokensSavedByCompression || 0) + tokensSaved;
      session.participantUsage[userId] = (session.participantUsage[userId] || 0) + tokensCharged;
      const hostAcct = state.accounts[session.hostId];
      if (hostAcct) {
        hostAcct.quotaUsed = Math.min(hostAcct.quotaTotal, (hostAcct.quotaUsed || 0) + tokensCharged);
      }
    } else {
      session.tokensUsed = (session.tokensUsed || 0) + tokensCharged;
      account.quotaUsed = Math.min(account.quotaTotal, (account.quotaUsed || 0) + tokensCharged);
    }

    const hostAccount = state.accounts[session.hostId] || state.accounts.alex;
    const aiMsg = {
      id: 'm_ai_' + Date.now(),
      senderId: 'gemini',
      senderName: state.primaryModel === 'gemini-4-argon' ? 'Gemini 4 Argon' : 'Gemini 3.8 Flash',
      senderRole: 'CoThread AI',
      kind: 'ai',
      modelUsed: state.primaryModel,
      timestamp: nowTimeLabel(),
      triggeredBy: account.shortName,
      quotaChargedTo:
        session.type === 'shared'
          ? `Host (${hostAccount.name} • ${PLAN_TIERS[hostAccount.planTier]?.badge || 'PRO'} Quota)`
          : `${account.name} (My ${PLAN_TIERS[account.planTier]?.badge || 'PERSONAL'} Quota)`,
      quotaType: session.type === 'shared' ? 'host' : 'personal',
      tokensCharged,
      tokensSaved,
      text: aiReply.text,
      codeSnippet: aiReply.codeSnippet || null
    };

    session.messages.push(aiMsg);
    saveAndBroadcastState();
    renderApp();
    scrollChatToBottom(sessionId);
  }

  async function synthesizeCoThreadAIResponse(session, triggeringAccount, promptText) {
    const cleanPrompt = promptText.replace(/^@gemini\s*/i, '').trim();
    const estimatedCharged = Math.floor(280 + Math.min(cleanPrompt.length * 1.7, 230));
    const estimatedSaved = Math.floor(estimatedCharged * 0.41);

    if (window.location.protocol.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3200);
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            sessionType: session.type,
            model: state.primaryModel,
            compressionModel: state.compressionModel,
            userId: triggeringAccount.id,
            userName: triggeringAccount.name,
            prompt: cleanPrompt
          }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.reply || data.text)) {
            return {
              text: data.reply || data.text,
              codeSnippet: data.codeSnippet || null,
              tokensCharged: data.tokensCharged || estimatedCharged,
              tokensSaved: data.tokensSaved || estimatedSaved
            };
          }
        }
      } catch (e) {
        // Fallback to built-in CoThread synthesis
      }
    }

    await new Promise((r) => setTimeout(r, 460));

    const isShared = session.type === 'shared';
    const quotaSummary = isShared
      ? `Sponsored by **${session.hostName}'s Host Quota** (\`/s/${session.shareCode}\` • ${fmtNum(session.tokensUsed + estimatedCharged)} / ${fmtNum(session.tokenCap)} session tokens)`
      : `Deducted from **${triggeringAccount.name}'s Software Token Quota** (\`/app\` Personal Chat • Host Quota untouched)`;

    return {
      text:
        `**CoThread Synthesis for @${triggeringAccount.shortName} (${state.primaryModel})**\n` +
        `Here is the architectural response for *"${cleanPrompt}"* inside **"${session.title}"**:\n\n` +
        `• **Context Compression (\`${state.compressionModel}\`)**: Distilled ${session.messages.length} messages in this thread, saving **${estimatedSaved} software tokens**.\n` +
        `• **Quota Ledger Attribution**: ${quotaSummary}.\n` +
        `• **Next Step**: Co-edit the specification in the **Artifacts / Canvas** drawer${isShared ? ` or click **Continue Independently (Copy to My Chats)** to branch privately on your own quota` : ''}.`,
      codeSnippet:
`// CoThread Managed Quota Execution (${state.primaryModel})
export async function executeCoThreadTurn() {
  return {
    route: "${isShared ? '/s/' + session.shareCode : '/app'}",
    triggeredBy: "${triggeringAccount.email}",
    billedAccount: "${isShared ? session.hostName + ' (Host Quota)' : triggeringAccount.name + ' (Personal Quota)'}",
    tokensCharged: ${estimatedCharged},
    tokensSavedByFlashLite: ${estimatedSaved}
  };
}`,
      tokensCharged: estimatedCharged,
      tokensSaved: estimatedSaved
    };
  }

  // =========================================================
  // RENDERING: WEBSITE (/) vs WORKSPACE (/app & /s/:code)
  // =========================================================

  function renderApp() {
    const websiteRoot = document.getElementById('websiteRoot');
    const appShell = document.getElementById('appShell');

    if (!currentUserId || !state.accounts[currentUserId]) {
      if (websiteRoot) websiteRoot.classList.remove('hidden');
      if (appShell) appShell.classList.add('hidden');
      renderWebsiteInviteBanner();
      updateBrowserRouteDisplay('/');
      return;
    }

    if (websiteRoot) websiteRoot.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');

    renderTopWorkspaceHeader();
    renderWorkspaceStage();

    if (!document.getElementById('shareQuotaModalBackdrop').classList.contains('hidden')) {
      renderShareModalContent(activeShareModalSessionId);
    }
    if (
      !document.getElementById('accountQuotaModalBackdrop').classList.contains('hidden') &&
      activeQuotaModalUserId
    ) {
      renderAccountQuotaModalContent(activeQuotaModalUserId);
    }
  }

  function renderWebsiteInviteBanner() {
    const banner = document.getElementById('inviteAuthBanner');
    const titleEl = document.getElementById('inviteBannerTitle');
    const descEl = document.getElementById('inviteBannerDesc');
    if (!banner) return;

    const invitedSession = findSessionByShareCode(pendingInviteShareCode);
    if (invitedSession) {
      banner.classList.remove('hidden');
      if (titleEl) {
        titleEl.textContent = `Invited to join "${invitedSession.title}" (/s/${invitedSession.shareCode})`;
      }
      if (descEl) {
        descEl.textContent = `Sponsored by ${invitedSession.hostName}'s Host Quota (${fmtNum(invitedSession.tokenCap)} token allowance). Sign in with Google or email to join immediately.`;
      }
    } else {
      banner.classList.add('hidden');
    }
  }

  function updateBrowserRouteDisplay(routeStr) {
    try {
      if (window.location.protocol !== 'file:') {
        window.history.replaceState(null, '', '#' + routeStr);
      } else {
        window.location.hash = routeStr;
      }
    } catch (e) {
      // ignore
    }
  }

  function renderTopWorkspaceHeader() {
    const modelSel = document.getElementById('headerModelSelect');
    if (modelSel) modelSel.value = state.primaryModel;

    const splitBtn = document.getElementById('toggleSideBySideBtn');
    if (splitBtn) {
      splitBtn.classList.toggle('active-split', Boolean(state.sideBySideMode));
    }

    const pane = ensurePaneStateForUser(currentUserId);
    const activeSession = getSessionById(pane.activeSessionId);
    const routeIcon = document.getElementById('routeIcon');
    const routePathText = document.getElementById('routePathText');

    if (activeSession && routePathText && routeIcon) {
      if (activeSession.type === 'shared') {
        const sublinkPath = `/s/${activeSession.shareCode}`;
        routeIcon.textContent = '🟢';
        routePathText.textContent = sublinkPath;
        routePathText.classList.remove('personal-route');
        updateBrowserRouteDisplay(sublinkPath);
      } else {
        const appPath = `/app/c/${activeSession.id.slice(0, 12)}`;
        routeIcon.textContent = '🔒';
        routePathText.textContent = appPath;
        routePathText.classList.add('personal-route');
        updateBrowserRouteDisplay('/app');
      }
    }
  }

  function renderWorkspaceStage() {
    const stage = document.getElementById('workspaceStage');
    if (!stage) return;

    const isSplit = Boolean(state.sideBySideMode);
    stage.classList.toggle('split-mode', isSplit);

    let paneUsers = [currentUserId];
    if (isSplit) {
      const secondUser = currentUserId === 'alex' ? 'hasnain' : 'alex';
      paneUsers = [currentUserId, secondUser];
    }

    stage.innerHTML = paneUsers
      .map((uid, idx) => renderWorkspacePaneHTML(uid, idx, isSplit))
      .join('');

    paneUsers.forEach((uid) => bindPaneEvents(uid));
  }

  function renderWorkspacePaneHTML(userId, paneIdx, isSplit) {
    const account = state.accounts[userId] || state.accounts.alex;
    const pane = ensurePaneStateForUser(userId);
    const activeSession = getSessionById(pane.activeSessionId);
    const planObj = PLAN_TIERS[account.planTier] || PLAN_TIERS.pro;

    const sharedSessions = state.sessions.filter((s) => s.type === 'shared');
    const personalSessions = state.sessions.filter(
      (s) => s.type === 'personal' && s.ownerId === userId
    );

    const accountPct = Math.min(100, Math.round((account.quotaUsed / account.quotaTotal) * 100));
    const isSharedActive = activeSession.type === 'shared';
    const isHostOfActive = isSharedActive && activeSession.hostId === userId;
    const sessionPct = isSharedActive
      ? Math.min(100, Math.round((activeSession.tokensUsed / activeSession.tokenCap) * 100))
      : Math.min(100, Math.round(((activeSession.tokensUsed || 350) / 10000) * 100));

    return `
      <section class="workspace-pane" data-pane-user="${userId}">
        ${
          isSplit
            ? `
              <div class="pane-identity-strip">
                <span>
                  <strong>${paneIdx === 0 ? 'SCREEN 1 (HOST)' : 'SCREEN 2 (COLLEAGUE)'}:</strong>
                  ${escapeHtml(account.name)} (${escapeHtml(account.email)})
                </span>
                <span>
                  ${escapeHtml(planObj.name)} • ${fmtNum(account.quotaUsed)} / ${fmtNum(account.quotaTotal)} Tokens
                </span>
              </div>
            `
            : ''
        }

        <div class="pane-body-grid">
          <!-- LEFT SIDEBAR -->
          <aside class="pane-sidebar" aria-label="${escapeHtml(account.name)} Sidebar">
            <div class="sidebar-new-chat-wrap">
              <button
                type="button"
                class="new-chat-primary-btn"
                data-action="new-personal-chat"
                data-user="${userId}"
                title="Start a private Personal Thread (/app) using your own software token quota"
              >
                + New Personal Thread
              </button>
              <button
                type="button"
                class="new-shared-btn"
                data-action="new-shared-session"
                data-user="${userId}"
                title="Create a new Host-Sponsored Shared Room (/s/:code)"
              >
                + Shared
              </button>
            </div>

            <div class="sidebar-scroll-area">
              <!-- SHARED SESSIONS (HOST QUOTA) -->
              <div class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-section-title">
                    <span class="live-pulse-dot"></span>
                    Shared Sessions (Host Quota)
                  </span>
                </div>

                ${sharedSessions
                  .map((s) => {
                    const isSelected = s.id === activeSession.id;
                    return `
                      <button
                        type="button"
                        class="session-nav-item ${isSelected ? 'active-shared' : ''}"
                        data-action="select-session"
                        data-user="${userId}"
                        data-session-id="${s.id}"
                      >
                        <div class="nav-item-top">
                          <span class="nav-item-title">${escapeHtml(s.title)}</span>
                          <span class="nav-item-count">${s.participants.length} live</span>
                        </div>
                        <div class="nav-item-sublink">/s/${escapeHtml(s.shareCode)}</div>
                        <div>
                          <span class="quota-sponsor-badge host-sponsored">
                            Sponsored by ${escapeHtml(s.hostShortName)}'s Quota
                          </span>
                        </div>
                      </button>
                    `;
                  })
                  .join('')}
              </div>

              <!-- PERSONAL CHATS (MY QUOTA) -->
              <div class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-section-title">
                    Personal Chats (My Quota)
                  </span>
                </div>

                ${personalSessions
                  .map((s) => {
                    const isSelected = s.id === activeSession.id;
                    const isForked = Boolean(s.forkedFromSessionId);
                    return `
                      <button
                        type="button"
                        class="session-nav-item ${isSelected ? 'active-personal' : ''}"
                        data-action="select-session"
                        data-user="${userId}"
                        data-session-id="${s.id}"
                      >
                        <div class="nav-item-top">
                          <span class="nav-item-title">${escapeHtml(s.title)}</span>
                        </div>
                        <div>
                          <span class="quota-sponsor-badge ${isForked ? 'forked-personal' : 'personal-owned'}">
                            ${
                              isForked
                                ? 'Copied from Shared • My Quota'
                                : `Uses ${escapeHtml(account.shortName)}'s Quota`
                            }
                          </span>
                        </div>
                      </button>
                    `;
                  })
                  .join('')}
              </div>
            </div>

            <!-- BOTTOM PROFILE PILL -->
            <div class="sidebar-account-footer">
              <div class="account-footer-top">
                <div class="account-user-cluster">
                  <div class="avatar-circle ${account.colorClass}">
                    ${escapeHtml(account.initials)}
                    <span class="online-dot"></span>
                  </div>
                  <div class="account-user-meta">
                    <span class="account-user-name">${escapeHtml(account.name)}</span>
                    <span class="account-user-email">${escapeHtml(account.email)}</span>
                  </div>
                </div>
                <span class="plan-tier-badge">${escapeHtml(planObj.badge)}</span>
              </div>

              <div class="mini-progress-track">
                <div class="mini-progress-fill" style="width: ${accountPct}%"></div>
              </div>

              <div class="quota-card-stats">
                <span>Software Quota</span>
                <span>${fmtNum(account.quotaUsed)} / ${fmtNum(account.quotaTotal)}</span>
              </div>

              <div class="account-footer-buttons">
                <button
                  type="button"
                  class="acct-btn"
                  data-action="open-account-quota-modal"
                  data-user="${userId}"
                >Plan &amp; Quota</button>
                <button
                  type="button"
                  class="acct-btn"
                  data-action="switch-account"
                  data-user="${userId}"
                >Website / Sign Out</button>
              </div>
            </div>
          </aside>

          <!-- CENTER SESSION COLUMN -->
          <div class="pane-main-column">
            <header class="session-docs-header">
              <div class="session-header-top-row">
                <div class="session-title-cluster">
                  <span class="session-mode-badge ${isSharedActive ? 'shared-mode' : 'personal-mode'}">
                    ${
                      isSharedActive
                        ? `Shared Session • /s/${escapeHtml(activeSession.shareCode)}`
                        : `Personal Chat • /app (${escapeHtml(account.shortName)}'s Quota)`
                    }
                  </span>
                  <h1 class="session-title-heading" title="${escapeHtml(activeSession.title)}">
                    ${escapeHtml(activeSession.title)}
                  </h1>
                </div>

                <div class="session-header-actions">
                  ${
                    isSharedActive
                      ? `
                        <div class="presence-avatar-stack">
                          ${activeSession.participants
                            .map((pid) => {
                              const pAcct = state.accounts[pid] || state.accounts.alex;
                              return `
                                <span class="presence-pill">
                                  <span class="avatar-circle ${pAcct.colorClass}">
                                    ${escapeHtml(pAcct.initials)}
                                  </span>
                                  <span>${escapeHtml(pAcct.shortName)}${pid === activeSession.hostId ? ' (Host)' : ''}</span>
                                </span>
                              `;
                            })
                            .join('')}
                        </div>

                        <button
                          type="button"
                          class="hdr-btn"
                          data-action="open-share-modal"
                          data-session-id="${activeSession.id}"
                        >
                          <span>🔗 Share${isHostOfActive ? ' & Quota' : ''}</span>
                        </button>

                        <button
                          type="button"
                          class="hdr-btn continue-independently-btn"
                          data-action="continue-independently"
                          data-user="${userId}"
                          data-session-id="${activeSession.id}"
                          title="Copy this shared conversation into your Personal Chats (/app) where subsequent prompts deduct from your own software token quota"
                        >
                          <span>🔀 Continue Independently (Copy to My Chats)</span>
                        </button>
                      `
                      : `
                        <span class="presence-pill">
                          <span class="avatar-circle ${account.colorClass}">${escapeHtml(account.initials)}</span>
                          <span>Private (${escapeHtml(account.email)})</span>
                        </span>
                      `
                  }

                  <button
                    type="button"
                    class="hdr-btn canvas-toggle-btn ${pane.canvasOpen ? 'active' : ''}"
                    data-action="toggle-canvas"
                    data-user="${userId}"
                  >
                    <span>📄 ${isSharedActive ? 'Artifacts / Canvas' : 'Canvas'}</span>
                  </button>
                </div>
              </div>

              <!-- QUOTA PROGRESS STRIP -->
              <div class="session-quota-bar-row">
                ${
                  isSharedActive
                    ? `
                      <div class="quota-bar-info">
                        <span class="quota-bar-title">Sponsored by ${escapeHtml(activeSession.hostName)}'s Host Quota:</span>
                        <span class="quota-bar-numbers">
                          ${fmtNum(activeSession.tokensUsed)} / ${fmtNum(activeSession.tokenCap)} session tokens used
                        </span>
                        <span class="compression-saved-pill">
                          ✦ ${fmtNum(activeSession.tokensSavedByCompression)} saved by Flash-Lite
                        </span>
                      </div>
                      <div class="quota-bar-visual">
                        <div class="quota-track-lg">
                          <div class="quota-fill-lg" style="width: ${sessionPct}%"></div>
                        </div>
                        <span class="quota-bar-numbers">${sessionPct}%</span>
                      </div>
                    `
                    : `
                      <div class="quota-bar-info">
                        <span class="quota-bar-title">Personal Software Token Quota (${escapeHtml(account.email)}):</span>
                        <span class="quota-bar-numbers">
                          ${fmtNum(activeSession.tokensUsed)} tokens in this thread • Billed to ${escapeHtml(account.shortName)}'s ${escapeHtml(planObj.name)} (${fmtNum(account.quotaUsed)} / ${fmtNum(account.quotaTotal)})
                        </span>
                      </div>
                      <div class="quota-bar-visual">
                        <div class="quota-track-lg">
                          <div class="quota-fill-lg personal" style="width: ${accountPct}%"></div>
                        </div>
                      </div>
                    `
                }
              </div>
            </header>

            <div class="chat-and-canvas-split">
              <div class="chat-stream-column">
                <div class="messages-scroll-container" id="msgScroll_${userId}">
                  ${renderStreamBannerHTML(activeSession, account)}
                  ${activeSession.messages
                    .map((msg) => renderMessageRowHTML(msg, userId, activeSession))
                    .join('')}
                </div>

                <div class="live-typing-bar">
                  ${
                    state.typingStatus && state.typingStatus.sessionId === activeSession.id
                      ? `<span>✦ ${escapeHtml(state.typingStatus.text)}</span>`
                      : `
                        <span>
                          ${
                            isSharedActive
                              ? `Live Room /s/${escapeHtml(activeSession.shareCode)} • ${
                                  activeSession.permissionMode === 'can_prompt'
                                    ? `All participants can prompt @Gemini (Uses ${escapeHtml(activeSession.hostShortName)}'s Host Quota)`
                                    : 'View & Team Chat Only (AI prompting paused for guests)'
                                }`
                              : `Personal Workspace (/app) • Prompts deduct from ${escapeHtml(account.name)}'s Software Token Quota`
                          }
                        </span>
                      `
                  }
                </div>

                <!-- FLOATING PILL COMPOSER -->
                <div class="composer-dock">
                  <div class="composer-top-controls">
                    <div class="composer-mode-switch">
                      <button
                        type="button"
                        class="mode-pill-btn ${pane.composerMode === 'ai' ? 'active-ai-mode' : ''}"
                        data-action="set-composer-mode"
                        data-user="${userId}"
                        data-mode="ai"
                      >
                        ✦ Ask CoThread AI (${isSharedActive ? `Host Quota` : `My Quota`})
                      </button>
                      <button
                        type="button"
                        class="mode-pill-btn ${pane.composerMode === 'chat' ? 'active-chat-mode' : ''}"
                        data-action="set-composer-mode"
                        data-user="${userId}"
                        data-mode="chat"
                      >
                        💬 Team Message (0 Tokens)
                      </button>
                    </div>

                    <div class="quick-prompt-chips">
                      ${
                        isSharedActive
                          ? `
                            <button
                              type="button"
                              class="quick-chip"
                              data-action="quick-prompt"
                              data-user="${userId}"
                              data-mode="ai"
                              data-text="@Gemini Propose a Cloud Run WebSocket + Redis pub/sub schema for our shared room."
                            >✦ Ask AI: Cloud Run Schema</button>
                            <button
                              type="button"
                              class="quick-chip"
                              data-action="quick-prompt"
                              data-user="${userId}"
                              data-mode="chat"
                              data-text="Looks great! I'll copy this thread to my Personal Chats if I need to test custom configs."
                            >💬 Team Chat: "Looks great!"</button>
                          `
                          : `
                            <button
                              type="button"
                              class="quick-chip"
                              data-action="quick-prompt"
                              data-user="${userId}"
                              data-mode="ai"
                              data-text="@Gemini Extend this copied architecture with a private benchmark suite using my own quota."
                            >🔒 Ask AI (My Personal Quota)</button>
                          `
                      }
                    </div>
                  </div>

                  <div class="composer-input-row">
                    <input
                      type="text"
                      class="composer-input"
                      id="composerInput_${userId}"
                      data-user="${userId}"
                      value="${escapeHtml(pane.draftText || '')}"
                      placeholder="${
                        pane.composerMode === 'ai'
                          ? isSharedActive
                            ? `Reply or ask @Gemini in /s/${activeSession.shareCode} (Sponsored by ${activeSession.hostShortName}'s Host Quota)...`
                            : `Ask CoThread AI privately in /app (Uses ${account.shortName}'s ${planObj.badge} Quota)...`
                          : `Message colleagues in real time as ${account.shortName} (0 AI tokens)...`
                      }"
                    />
                    <button
                      type="button"
                      class="composer-send-btn"
                      data-action="send-message"
                      data-user="${userId}"
                      data-session-id="${activeSession.id}"
                    >
                      ${
                        pane.composerMode === 'ai'
                          ? isSharedActive
                            ? 'Ask AI (Host Quota) ↑'
                            : 'Ask AI (My Quota) ↑'
                          : 'Send Message ↑'
                      }
                    </button>
                  </div>
                </div>
              </div>

              <!-- ARTIFACTS / COLLABORATIVE CANVAS DRAWER -->
              <aside class="shared-canvas-drawer ${pane.canvasOpen ? '' : 'collapsed'}">
                <div class="canvas-header">
                  <div>
                    <div class="canvas-title">📄 ${escapeHtml(activeSession.canvasTitle || 'spec.md')}</div>
                    <div class="canvas-subtitle">Edited by ${escapeHtml(activeSession.canvasLastEditedBy || 'Team')}</div>
                  </div>
                  <button
                    type="button"
                    class="acct-btn"
                    data-action="toggle-canvas"
                    data-user="${userId}"
                  >✕</button>
                </div>

                <textarea
                  class="canvas-editor"
                  data-action="edit-canvas"
                  data-user="${userId}"
                  data-session-id="${activeSession.id}"
                  spellcheck="false"
                >${escapeHtml(activeSession.canvasContent || '')}</textarea>

                <div class="canvas-footer">
                  <span>Live CoThread Artifact</span>
                  <span>${isSharedActive ? `/s/${escapeHtml(activeSession.shareCode)}` : '/app (Private)'}</span>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderStreamBannerHTML(session, account) {
    if (session.type === 'shared') {
      return `
        <div class="stream-context-banner">
          <div>
            <strong>Shared CoThread Session (<code>/s/${escapeHtml(session.shareCode)}</code>):</strong>
            Participants (${session.participants.map((p) => state.accounts[p]?.shortName || p).join(', ')}) share one real-time AI context.
            AI prompts are sponsored by <strong>${escapeHtml(session.hostName)}'s Host Quota</strong>.
          </div>
          <div>
            <span>Want to branch privately? Click <strong>"Continue Independently (Copy to My Chats)"</strong>.</span>
          </div>
        </div>
      `;
    }

    if (session.forkedFromSessionId) {
      return `
        <div class="stream-context-banner">
          <div>
            <strong>🔀 Independent Personal Thread (<code>/app</code> • Copied from <code>/s/${escapeHtml(session.forkedFromShareCode || 'shared')}</code>):</strong>
            Owned by <strong>${escapeHtml(account.name)} (${escapeHtml(account.email)})</strong>.
            All new prompts deduct from your own <strong>Software Token Quota</strong> while the original shared session stays intact.
          </div>
        </div>
      `;
    }

    return `
      <div class="stream-context-banner">
        <div>
          <strong>Private Personal Thread (<code>/app</code> • ${escapeHtml(account.email)}):</strong>
          Visible only to you. Prompts deduct from your software-assigned <strong>${escapeHtml(PLAN_TIERS[account.planTier]?.name || 'CoThread')}</strong> quota.
        </div>
      </div>
    `;
  }

  function renderMessageRowHTML(msg, viewingUserId, session) {
    const isAI = msg.kind === 'ai' || msg.senderId === 'gemini';
    const isOwn = !isAI && msg.senderId === viewingUserId;
    const senderAcct = state.accounts[msg.senderId] || {
      initials: isAI ? '✦' : 'CT',
      colorClass: isAI ? 'gemini' : 'custom'
    };

    const rowClass = isAI
      ? 'msg-row ai-message'
      : isOwn
      ? 'msg-row own-message'
      : 'msg-row colleague-message';

    return `
      <div class="${rowClass}">
        <div class="avatar-circle ${senderAcct.colorClass}">
          ${escapeHtml(senderAcct.initials)}
        </div>
        <div class="msg-bubble">
          <div class="msg-meta-header">
            <div class="msg-author-cluster">
              <span class="msg-author-name">${escapeHtml(msg.senderName)}</span>
              <span class="msg-role-pill">${escapeHtml(msg.senderRole || 'Member')}</span>
              <span class="msg-intent-tag">
                ${
                  msg.kind === 'prompt'
                    ? '✦ Prompted AI'
                    : msg.kind === 'chat'
                    ? '💬 Team Message (0 Tokens)'
                    : `Replying to ${escapeHtml(msg.triggeredBy || 'Team')}`
                }
              </span>
            </div>
            <span class="msg-timestamp">${escapeHtml(msg.timestamp || '')}</span>
          </div>

          <div class="msg-content-body">${formatMessageText(msg.text)}</div>

          ${
            msg.codeSnippet
              ? `<pre class="msg-code-block">${escapeHtml(msg.codeSnippet)}</pre>`
              : ''
          }

          ${
            isAI
              ? `
                <div class="msg-quota-footer">
                  <span class="quota-attribution-pill ${msg.quotaType === 'host' ? 'charged-host' : ''}">
                    ${
                      msg.quotaType === 'host'
                        ? `⚡ ${escapeHtml(msg.modelUsed || 'gemini-3.8-flash')} • ${fmtNum(msg.tokensCharged)} tokens charged to ${escapeHtml(msg.quotaChargedTo)} • ${fmtNum(msg.tokensSaved || 140)} saved via Flash-Lite`
                        : `🔒 ${escapeHtml(msg.modelUsed || 'gemini-3.8-flash')} • ${fmtNum(msg.tokensCharged)} tokens charged to ${escapeHtml(msg.quotaChargedTo)}`
                    }
                  </span>
                  ${
                    msg.codeSnippet
                      ? `
                        <button
                          type="button"
                          class="sync-to-canvas-btn"
                          data-action="append-snippet-to-canvas"
                          data-user="${viewingUserId}"
                          data-session-id="${session.id}"
                          data-msg-id="${msg.id}"
                        >📄 Open in Artifact Canvas</button>
                      `
                      : ''
                  }
                </div>
              `
              : ''
          }
        </div>
      </div>
    `;
  }

  function scrollChatToBottom(sessionId) {
    Object.keys(state.paneState).forEach((uid) => {
      const pane = state.paneState[uid];
      if (pane && pane.activeSessionId === sessionId) {
        const el = document.getElementById(`msgScroll_${uid}`);
        if (el) el.scrollTop = el.scrollHeight;
      }
    });
  }

  // =========================================================
  // PANE EVENT DELEGATION
  // =========================================================

  function bindPaneEvents(userId) {
    const paneEl = document.querySelector(`.workspace-pane[data-pane-user="${userId}"]`);
    if (!paneEl) return;

    const inputEl = paneEl.querySelector(`#composerInput_${userId}`);
    if (inputEl) {
      inputEl.addEventListener('input', (e) => {
        ensurePaneStateForUser(userId).draftText = e.target.value;
      });
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const sId = ensurePaneStateForUser(userId).activeSessionId;
          handleSendMessage(userId, sId, inputEl.value);
        }
      });
    }

    const canvasEl = paneEl.querySelector('[data-action="edit-canvas"]');
    if (canvasEl) {
      canvasEl.addEventListener('input', (e) => {
        const sId = canvasEl.getAttribute('data-session-id');
        const session = getSessionById(sId);
        if (session) {
          session.canvasContent = e.target.value;
          session.canvasLastEditedBy = state.accounts[userId]?.shortName || 'User';
          saveAndBroadcastState();
          document
            .querySelectorAll(`[data-action="edit-canvas"][data-session-id="${sId}"]`)
            .forEach((other) => {
              if (other !== canvasEl) other.value = session.canvasContent;
            });
        }
      });
    }

    paneEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const targetUser = btn.getAttribute('data-user') || userId;

      if (action === 'select-session') {
        const sId = btn.getAttribute('data-session-id');
        ensurePaneStateForUser(targetUser).activeSessionId = sId;
        saveAndBroadcastState();
        renderApp();
        scrollChatToBottom(sId);
      } else if (action === 'set-composer-mode') {
        ensurePaneStateForUser(targetUser).composerMode = btn.getAttribute('data-mode');
        renderApp();
        const inp = document.getElementById(`composerInput_${targetUser}`);
        if (inp) inp.focus();
      } else if (action === 'quick-prompt') {
        const mode = btn.getAttribute('data-mode');
        const text = btn.getAttribute('data-text');
        ensurePaneStateForUser(targetUser).composerMode = mode;
        const sId = ensurePaneStateForUser(targetUser).activeSessionId;
        handleSendMessage(targetUser, sId, text, mode);
      } else if (action === 'send-message') {
        const sId = btn.getAttribute('data-session-id');
        const inp = document.getElementById(`composerInput_${targetUser}`);
        handleSendMessage(targetUser, sId, inp ? inp.value : '');
      } else if (action === 'toggle-canvas') {
        const p = ensurePaneStateForUser(targetUser);
        p.canvasOpen = !p.canvasOpen;
        saveAndBroadcastState();
        renderApp();
      } else if (action === 'open-share-modal') {
        openShareModal(btn.getAttribute('data-session-id'));
      } else if (action === 'continue-independently') {
        continueIndependentlyToMyChats(targetUser, btn.getAttribute('data-session-id'));
      } else if (action === 'new-shared-session') {
        createNewSharedSession(targetUser);
      } else if (action === 'new-personal-chat') {
        createNewPersonalChat(targetUser);
      } else if (action === 'open-account-quota-modal') {
        openAccountQuotaModal(targetUser);
      } else if (action === 'switch-account') {
        returnToCompanyWebsite();
      } else if (action === 'append-snippet-to-canvas') {
        const sId = btn.getAttribute('data-session-id');
        const msgId = btn.getAttribute('data-msg-id');
        const session = getSessionById(sId);
        const msg = session && session.messages.find((m) => m.id === msgId);
        if (session && msg && msg.codeSnippet) {
          session.canvasContent =
            (session.canvasContent || '') +
            `\n\n// Appended from ${msg.senderName} (${nowTimeLabel()})\n` +
            msg.codeSnippet;
          ensurePaneStateForUser(targetUser).canvasOpen = true;
          saveAndBroadcastState('Code snippet appended to Artifact Canvas!', 'shared');
          renderApp();
          showToast('Code snippet opened in Artifact Canvas!', 'shared');
        }
      }
    });
  }

  function createNewSharedSession(hostUserId) {
    const host = state.accounts[hostUserId] || state.accounts.alex;
    const newId = 'shared_' + Date.now();
    const shareCode = 'cothread-' + Math.random().toString(36).slice(2, 6) + '-' + Math.random().toString(36).slice(2, 5);

    const newSession = {
      id: newId,
      type: 'shared',
      title: `${host.shortName}'s Collaborative AI Room`,
      hostId: hostUserId,
      hostName: host.name,
      hostShortName: host.shortName,
      shareCode,
      linkActive: true,
      permissionMode: 'can_prompt',
      tokenCap: 20000,
      tokensUsed: 0,
      tokensSavedByCompression: 0,
      participantUsage: { [hostUserId]: 0 },
      participants: [hostUserId],
      canvasTitle: 'shared_artifact.md',
      canvasLastEditedBy: host.shortName,
      canvasContent: `# ${host.name}'s Shared CoThread Artifact (/s/${shareCode})\nSponsored by ${host.name}'s Software Token Quota.\n`,
      messages: [
        {
          id: 'm_init_' + Date.now(),
          senderId: hostUserId,
          senderName: host.name,
          senderRole: 'Host',
          kind: 'chat',
          timestamp: nowTimeLabel(),
          text: `Created shared session /s/${shareCode} with a 20,000 token cap from my CoThread quota. Share the sublink so colleagues can join!`
        }
      ]
    };

    state.sessions.unshift(newSession);
    ensurePaneStateForUser(hostUserId).activeSessionId = newId;
    saveAndBroadcastState();
    renderApp();
    showToast(`Created Shared Session /s/${shareCode}!`, 'shared');
  }

  function createNewPersonalChat(userId) {
    const account = state.accounts[userId] || state.accounts.alex;
    const newId = 'personal_' + userId + '_' + Date.now();
    const newPersonal = {
      id: newId,
      type: 'personal',
      ownerId: userId,
      ownerName: account.shortName,
      forkedFromSessionId: null,
      forkedFromTitle: null,
      title: `Personal Thread (${nowTimeLabel()})`,
      tokensUsed: 0,
      canvasTitle: 'personal_notes.md',
      canvasLastEditedBy: account.shortName,
      canvasContent: `# ${account.name} — Private Personal Artifact (/app)\nBilled to ${account.email}'s Software Token Quota.\n`,
      messages: [
        {
          id: 'm_p_' + Date.now(),
          senderId: userId,
          senderName: account.name,
          senderRole: 'Personal Account',
          kind: 'chat',
          timestamp: nowTimeLabel(),
          text: `Started a new private Personal Thread (/app). Prompts here use my own software token quota.`
        }
      ]
    };

    state.sessions.push(newPersonal);
    ensurePaneStateForUser(userId).activeSessionId = newId;
    saveAndBroadcastState();
    renderApp();
    showToast(`Started new Personal Thread (/app) on ${account.shortName}'s quota.`, 'personal');
  }

  // =========================================================
  // MODALS: GOOGLE CHOOSER, SHARE SUBLINK, ACCOUNT QUOTA
  // =========================================================

  function openGoogleChooserModal() {
    const backdrop = document.getElementById('googleChooserBackdrop');
    const listEl = document.getElementById('googleAccountList');
    const customForm = document.getElementById('googleCustomAccountForm');
    if (!backdrop || !listEl) return;

    customForm.classList.add('hidden');
    listEl.classList.remove('hidden');

    const accountsArr = Object.values(state.accounts);
    listEl.innerHTML =
      accountsArr
        .map((acct) => {
          const tier = PLAN_TIERS[acct.planTier] || PLAN_TIERS.pro;
          return `
            <button type="button" class="google-account-row" data-google-login-id="${acct.id}">
              <div class="google-acct-left">
                <span class="avatar-circle ${acct.colorClass}">${escapeHtml(acct.initials)}</span>
                <div class="google-acct-info">
                  <strong>${escapeHtml(acct.name)}</strong>
                  <small>${escapeHtml(acct.email)} • ${escapeHtml(tier.name)} (${fmtNum(acct.quotaTotal)} Quota)</small>
                </div>
              </div>
              <span class="plan-tier-badge">${escapeHtml(tier.badge)}</span>
            </button>
          `;
        })
        .join('') +
      `
        <button type="button" class="google-account-row" id="useAnotherGoogleAccountBtn">
          <div class="google-acct-left">
            <span class="avatar-circle custom">+</span>
            <div class="google-acct-info">
              <strong>Use another Google account</strong>
              <small>Sign in with any work or personal Google email</small>
            </div>
          </div>
        </button>
      `;

    listEl.querySelectorAll('[data-google-login-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        completeLoginAsUser(btn.getAttribute('data-google-login-id'), false);
      });
    });

    document.getElementById('useAnotherGoogleAccountBtn')?.addEventListener('click', () => {
      listEl.classList.add('hidden');
      customForm.classList.remove('hidden');
    });

    backdrop.classList.remove('hidden');
  }

  function closeGoogleChooserModal() {
    const backdrop = document.getElementById('googleChooserBackdrop');
    if (backdrop) backdrop.classList.add('hidden');
  }

  function buildShareableSublinkUrl(shareCode) {
    const base = window.location.href.split('?')[0].split('#')[0];
    return `${base}?s=${encodeURIComponent(shareCode)}#/s/${encodeURIComponent(shareCode)}`;
  }

  function openShareModal(sessionId) {
    activeShareModalSessionId = sessionId;
    const backdrop = document.getElementById('shareQuotaModalBackdrop');
    if (!backdrop) return;
    renderShareModalContent(sessionId);
    backdrop.classList.remove('hidden');
  }

  function closeShareModal() {
    const backdrop = document.getElementById('shareQuotaModalBackdrop');
    if (backdrop) backdrop.classList.add('hidden');
  }

  function renderShareModalContent(sessionId) {
    const body = document.getElementById('shareModalBody');
    if (!body) return;
    const session = getSessionById(sessionId);
    if (!session || session.type !== 'shared') return;

    const fullSublink = buildShareableSublinkUrl(session.shareCode);
    const pct = Math.min(100, Math.round((session.tokensUsed / session.tokenCap) * 100));

    body.innerHTML = `
      <div class="form-section">
        <label class="form-label">
          <span>Shareable CoThread Session Sublink (<code>/s/${escapeHtml(session.shareCode)}</code>)</span>
          <span style="color: ${session.linkActive ? 'var(--accent-emerald)' : '#E11D48'}">
            ${session.linkActive ? '● Sublink Active' : '● Sublink Revoked'}
          </span>
        </label>
        <div class="share-link-box">
          <input type="text" class="share-link-input" id="shareLinkUrlInput" readonly value="${escapeHtml(fullSublink)}" />
          <button type="button" class="btn-primary" id="copyShareLinkBtn">Copy Sublink</button>
          <button type="button" class="btn-secondary" id="openSecondTabBtn">Open in 2nd Tab ↗</button>
        </div>
        <p class="form-help">Colleagues opening this sublink can sign in with Google and collaborate live using <strong>${escapeHtml(session.hostName)}'s</strong> sponsored session allowance.</p>
      </div>

      <div class="form-section">
        <label class="form-label" for="sharePermissionSelect">Colleague Permission Level</label>
        <select id="sharePermissionSelect" class="form-select">
          <option value="can_prompt" ${session.permissionMode === 'can_prompt' ? 'selected' : ''}>
            ⚡ Can Prompt @Gemini &amp; Edit Canvas (Uses Host's Sponsored Session Quota)
          </option>
          <option value="view_only" ${session.permissionMode === 'view_only' ? 'selected' : ''}>
            👀 View &amp; Team Chat Only (Colleagues can Copy to My Chats to prompt on their own quota)
          </option>
        </select>
      </div>

      <div class="form-section">
        <div class="quota-slider-wrap">
          <label class="form-label" for="sessionCapSlider">
            <span>Host-Sponsored Session Token Cap</span>
            <span style="font-family: var(--font-mono)">
              ${fmtNum(session.tokensUsed)} / <strong id="capSliderValueLabel">${fmtNum(session.tokenCap)}</strong> tokens (${pct}%)
            </span>
          </label>
          <input
            type="range"
            id="sessionCapSlider"
            class="quota-slider"
            min="5000"
            max="100000"
            step="2500"
            value="${session.tokenCap}"
          />
          <p class="form-help">
            Limits how many tokens from <strong>${escapeHtml(session.hostName)}'s Software Token Quota</strong> can be used in <code>/s/${escapeHtml(session.shareCode)}</code>.
          </p>
        </div>
      </div>

      <div class="form-section">
        <label class="form-label">Per-Participant Token Usage in <code>/s/${escapeHtml(session.shareCode)}</code></label>
        <div class="participant-breakdown-list">
          ${session.participants
            .map((pid) => {
              const pAcct = state.accounts[pid] || state.accounts.alex;
              const used = session.participantUsage[pid] || 0;
              return `
                <div class="participant-breakdown-item">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="avatar-circle ${pAcct.colorClass}" style="width:22px;height:22px;font-size:10px;">${escapeHtml(pAcct.initials)}</span>
                    <span><strong>${escapeHtml(pAcct.name)}</strong> (${escapeHtml(pAcct.email)})</span>
                  </div>
                  <span style="font-family: var(--font-mono);">
                    ${fmtNum(used)} tokens from Host Quota
                  </span>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <div class="modal-footer-actions">
        <button type="button" class="btn-danger" id="toggleRevokeLinkBtn">
          ${session.linkActive ? 'Revoke Sublink' : 'Re-Activate Sublink'}
        </button>
        <button type="button" class="btn-primary" id="doneShareModalBtn">Done</button>
      </div>
    `;

    document.getElementById('copyShareLinkBtn')?.addEventListener('click', () => {
      const inp = document.getElementById('shareLinkUrlInput');
      if (inp) {
        inp.select();
        navigator.clipboard?.writeText(inp.value).catch(() => {});
      }
      showToast(`Copied sublink /s/${session.shareCode} to clipboard!`, 'shared');
    });

    document.getElementById('openSecondTabBtn')?.addEventListener('click', () => {
      window.open(fullSublink, '_blank');
    });

    document.getElementById('sharePermissionSelect')?.addEventListener('change', (e) => {
      session.permissionMode = e.target.value;
      saveAndBroadcastState();
      renderApp();
      showToast('Updated colleague permission level!', 'shared');
    });

    document.getElementById('sessionCapSlider')?.addEventListener('input', (e) => {
      session.tokenCap = Number(e.target.value);
      const lbl = document.getElementById('capSliderValueLabel');
      if (lbl) lbl.textContent = fmtNum(session.tokenCap);
      saveAndBroadcastState();
      renderWorkspaceStage();
    });

    document.getElementById('toggleRevokeLinkBtn')?.addEventListener('click', () => {
      session.linkActive = !session.linkActive;
      saveAndBroadcastState();
      renderApp();
      showToast(
        session.linkActive ? 'Sublink re-activated!' : 'Sublink revoked by Host.',
        session.linkActive ? 'shared' : 'personal'
      );
    });

    document.getElementById('doneShareModalBtn')?.addEventListener('click', closeShareModal);
  }

  function openAccountQuotaModal(userId) {
    activeQuotaModalUserId = userId || currentUserId;
    const backdrop = document.getElementById('accountQuotaModalBackdrop');
    if (!backdrop) return;
    renderAccountQuotaModalContent(activeQuotaModalUserId);
    backdrop.classList.remove('hidden');
  }

  function closeAccountQuotaModal() {
    const backdrop = document.getElementById('accountQuotaModalBackdrop');
    if (backdrop) backdrop.classList.add('hidden');
  }

  function renderAccountQuotaModalContent(userId) {
    const body = document.getElementById('accountQuotaModalBody');
    const account = state.accounts[userId];
    if (!body || !account) return;

    const pct = Math.min(100, Math.round((account.quotaUsed / account.quotaTotal) * 100));

    body.innerHTML = `
      <div class="form-section">
        <div class="participant-breakdown-item">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="avatar-circle ${account.colorClass}">${escapeHtml(account.initials)}</span>
            <div>
              <strong style="display:block;">${escapeHtml(account.name)}</strong>
              <span style="font-size:11px;color:var(--ink-muted);">${escapeHtml(account.email)} • CoThread Managed Account</span>
            </div>
          </div>
          <span class="plan-tier-badge">${escapeHtml(PLAN_TIERS[account.planTier]?.badge || 'PRO')}</span>
        </div>
      </div>

      <div class="form-section">
        <label class="form-label">
          <span>Provisioned Software Token Quota Usage</span>
          <span style="font-family:var(--font-mono);">
            ${fmtNum(account.quotaUsed)} / ${fmtNum(account.quotaTotal)} tokens (${pct}%)
          </span>
        </label>
        <div class="mini-progress-track" style="height:8px;">
          <div class="mini-progress-fill" style="width:${pct}%"></div>
        </div>
        <p class="form-help">
          CoThread automatically provisions and manages your Gemini 3.8 Flash, Gemini 4 Argon, and Gemini 3.5 Flash-Lite token quota—no API keys required.
        </p>
      </div>

      <div class="form-section">
        <label class="form-label">Switch / Upgrade Software Token Quota Tier</label>
        <div class="plan-tier-grid">
          ${Object.values(PLAN_TIERS)
            .map((tier) => {
              const isCurrent = account.planTier === tier.id;
              return `
                <div class="plan-tier-card ${isCurrent ? 'active-plan' : ''}" data-select-tier="${tier.id}">
                  <h4>${escapeHtml(tier.name)}</h4>
                  <div class="plan-tier-quota">${fmtNum(tier.quota)} tokens</div>
                  <p class="plan-tier-desc">${escapeHtml(tier.desc)}</p>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <div class="modal-footer-actions">
        <button type="button" class="btn-primary" id="doneAccountQuotaBtn">Done</button>
      </div>
    `;

    body.querySelectorAll('[data-select-tier]').forEach((card) => {
      card.addEventListener('click', () => {
        const newTierId = card.getAttribute('data-select-tier');
        const newTier = PLAN_TIERS[newTierId];
        if (newTier) {
          account.planTier = newTier.id;
          account.quotaTotal = newTier.quota;
          saveAndBroadcastState();
          renderApp();
          showToast(
            `Updated ${account.name}'s plan to ${newTier.name} (${fmtNum(newTier.quota)} software tokens)!`,
            'shared'
          );
        }
      });
    });

    document.getElementById('doneAccountQuotaBtn')?.addEventListener('click', closeAccountQuotaModal);
  }

  // =========================================================
  // SIMULATE COLLEAGUE ACTIVITY & GLOBAL EVENTS
  // =========================================================

  async function simulateColleagueActivity() {
    const colleagueId = currentUserId === 'alex' ? 'hasnain' : 'alex';
    const colleague = state.accounts[colleagueId] || state.accounts.hasnain;

    showToast(`Simulating live activity from ${colleague.name} in /s/cothread-arch-9x2k...`, 'shared');

    state.typingStatus = {
      sessionId: 'shared_arch_room',
      text: `${colleague.name} is typing in /s/cothread-arch-9x2k...`
    };
    saveAndBroadcastState();
    renderApp();

    await new Promise((r) => setTimeout(r, 700));

    await handleSendMessage(
      colleagueId,
      'shared_arch_room',
      `Hey team! Let me ask @Gemini to verify our sublink token cap logic using the Host's sponsored session quota.`,
      'chat'
    );

    await new Promise((r) => setTimeout(r, 600));

    await handleSendMessage(
      colleagueId,
      'shared_arch_room',
      `@Gemini Generate a clean quota check for /s/cothread-arch-9x2k that allows guests to copy the thread to /app when they want to use their own quota.`,
      'ai'
    );
  }

  function showToast(message, variant) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const item = document.createElement('div');
    item.className = `toast-item ${variant === 'personal' ? 'personal-toast' : ''}`;
    item.innerHTML = `
      <span>${variant === 'personal' ? '🔀' : '✦'}</span>
      <div style="flex:1;line-height:1.4;">${escapeHtml(message)}</div>
    `;
    container.appendChild(item);

    setTimeout(() => {
      item.style.opacity = '0';
      item.style.transition = 'opacity 0.25s ease';
      setTimeout(() => item.remove(), 260);
    }, 4200);
  }

  function initGlobalEvents() {
    // Theme Toggles (Website & App)
    document.getElementById('websiteThemeToggleBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('appThemeToggleBtn')?.addEventListener('click', toggleTheme);

    // Website Navbar CTAs
    document.getElementById('navOpenGoogleBtn')?.addEventListener('click', openGoogleChooserModal);
    document.getElementById('navTryCoThreadBtn')?.addEventListener('click', () => {
      completeLoginAsUser('alex', false);
    });

    // Hero Card: Continue with Google
    document.getElementById('openGoogleChooserBtn')?.addEventListener('click', openGoogleChooserModal);
    document.getElementById('closeGoogleChooserBtn')?.addEventListener('click', closeGoogleChooserModal);
    document.getElementById('googleChooserBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'googleChooserBackdrop') closeGoogleChooserModal();
    });

    // Hero Card: Toggle Signup Drawer & Submit Email Form
    document.getElementById('toggleSignupDrawerBtn')?.addEventListener('click', () => {
      const drawer = document.getElementById('heroSignupDrawer');
      if (drawer) {
        drawer.classList.toggle('hidden');
        document.getElementById('heroNameInput')?.focus();
      }
    });

    document.getElementById('heroEmailAuthForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('heroEmailInput')?.value || 'alex@company.com';
      const name = document.getElementById('heroNameInput')?.value || email.split('@')[0];
      const plan = document.getElementById('heroPlanSelect')?.value || 'pro';
      registerOrSignInWithDetails(name, email, plan);
    });

    // Quick 1-Click Login Buttons across Website
    document.querySelectorAll('[data-quick-login]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-quick-login');
        completeLoginAsUser(targetId, false);
      });
    });

    // Hero 1-Click Side-by-Side Live View Launch
    document.getElementById('heroLaunchSplitBtn')?.addEventListener('click', () => {
      state.sideBySideMode = true;
      completeLoginAsUser('alex', false);
    });

    // Pricing Cards: Provision Tier & Launch
    document.querySelectorAll('[data-provision-tier]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tier = btn.getAttribute('data-provision-tier');
        if (tier === 'starter') {
          completeLoginAsUser('hasnain', false);
        } else {
          state.accounts.alex.planTier = tier;
          state.accounts.alex.quotaTotal = PLAN_TIERS[tier]?.quota || 250000;
          completeLoginAsUser('alex', false);
        }
      });
    });

    // Footer Reset Demo State
    document.getElementById('footerResetBtn')?.addEventListener('click', () => {
      state = createDefaultState();
      saveAndBroadcastState();
      showToast('Demo state reset to default!', 'shared');
    });

    // Google Custom Account Form
    document.getElementById('cancelCustomGoogleBtn')?.addEventListener('click', () => {
      document.getElementById('googleCustomAccountForm')?.classList.add('hidden');
      document.getElementById('googleAccountList')?.classList.remove('hidden');
    });

    document.getElementById('googleCustomAccountForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('googleCustomName')?.value;
      const email = document.getElementById('googleCustomEmail')?.value;
      const tier = document.getElementById('googleCustomTier')?.value;
      registerOrSignInWithDetails(name, email, tier);
    });

    // Workspace Header Controls
    document.getElementById('backToWebsiteBtn')?.addEventListener('click', returnToCompanyWebsite);

    document.getElementById('headerModelSelect')?.addEventListener('change', (e) => {
      state.primaryModel = e.target.value;
      saveAndBroadcastState();
      showToast(`Switched CoThread AI model to ${state.primaryModel}.`, 'shared');
    });

    document.getElementById('copyCurrentSublinkBtn')?.addEventListener('click', () => {
      const pane = ensurePaneStateForUser(currentUserId || 'alex');
      const activeSession = getSessionById(pane.activeSessionId);
      if (activeSession && activeSession.type === 'shared') {
        const url = buildShareableSublinkUrl(activeSession.shareCode);
        navigator.clipboard?.writeText(url).catch(() => {});
        showToast(`Copied shared session sublink (/s/${activeSession.shareCode})!`, 'shared');
      } else {
        navigator.clipboard?.writeText(window.location.href).catch(() => {});
        showToast('Copied workspace link (/app)!', 'personal');
      }
    });

    document.getElementById('toggleSideBySideBtn')?.addEventListener('click', () => {
      state.sideBySideMode = !state.sideBySideMode;
      renderApp();
      showToast(
        state.sideBySideMode
          ? 'Enabled Side-by-Side Colleague Preview (Host + Colleague live on one screen).'
          : 'Switched to single-account view.',
        'shared'
      );
    });

    document.getElementById('simulateColleagueBtn')?.addEventListener('click', simulateColleagueActivity);

    // Close Modals
    document.getElementById('closeShareModalBtn')?.addEventListener('click', closeShareModal);
    document.getElementById('shareQuotaModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'shareQuotaModalBackdrop') closeShareModal();
    });

    document.getElementById('closeAccountQuotaModalBtn')?.addEventListener('click', closeAccountQuotaModal);
    document.getElementById('accountQuotaModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'accountQuotaModalBackdrop') closeAccountQuotaModal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initGlobalEvents();
    renderApp();
  });
})();
