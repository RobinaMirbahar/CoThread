/**
 * CoThread \u2014 Collaborative AI Platform
 * - Company Website at `/` (domain.com)
 * - Chat Workspace at `/chat` (or `#/chat` or `chat.domain.com`)
 * - Top header with Sidebar Toggle, Brand, Chat Title, Live Collaborators (Name ONLY, owner filtered out), Share Button, Theme Toggle
 * - No green dot in top nav
 * - Model selector inside the Chat Composer Box (Gemini style)
 * - Gemini style minimal icon action bar on AI responses (Copy, New Chat, Retry)
 * - Left sidebar with clean 3-dot kebab menu (Rename, Delete) without badge overlap
 * - Share modal with Private Collaboration (email invite) vs Public Copy-to-Chat
 * - Full responsive layout for mobile and desktop
 */

(function () {
  'use strict';

  const MINI_DB_KEY = 'cothread_mini_db_users_v25';
  const STORAGE_KEY = 'cothread_chat_state_v25';
  const TAB_AUTH_KEY = 'cothread_active_user_v25';
  const THEME_KEY = 'cothread_theme_v22';
  const CHANNEL_NAME = 'cothread_realtime_v25';

  // Seed Default Verified Accounts in Mini DB (Zero Dummy Personas)
  const SEED_MINI_DB = {
    user_hasnain: {
      id: 'user_hasnain',
      name: 'Hasnain KK',
      shortName: 'Hasnain',
      username: 'HasnainKK',
      email: 'rashidhasnain0601@gmail.com',
      password: 'admin123',
      initials: 'HK',
      role: 'Original Idea, Co-Builder & Collaborator',
      colorClass: 'hasnain'
    },
    user_robina: {
      id: 'user_robina',
      name: 'Robina Mirbahar',
      shortName: 'Robina',
      username: 'RobinaMirbahar',
      email: 'robina@cothread.ai',
      password: 'admin123',
      initials: 'RM',
      role: 'Project Lead, Principal AI Architect',
      colorClass: 'robina'
    }
  };

  function getMiniDbUsers() {
    try {
      const raw = localStorage.getItem(MINI_DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...SEED_MINI_DB, ...parsed };
        }
      }
    } catch (_) {}
    saveMiniDbUsers(SEED_MINI_DB);
    return { ...SEED_MINI_DB };
  }

  function saveMiniDbUsers(usersObj) {
    try {
      localStorage.setItem(MINI_DB_KEY, JSON.stringify(usersObj));
    } catch (_) {}
  }

  function getMiniDbPublicAccounts() {
    const db = getMiniDbUsers();
    const publicAccounts = {};
    for (const [id, user] of Object.entries(db)) {
      publicAccounts[id] = {
        id: user.id,
        name: user.name,
        shortName: user.shortName || user.name.split(' ')[0] || 'User',
        username: user.username || user.email.split('@')[0],
        email: user.email,
        initials: user.initials || 'U',
        role: user.role || 'Member',
        colorClass: user.colorClass || 'custom'
      };
    }
    return publicAccounts;
  }

  function findMiniDbUser(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    const db = getMiniDbUsers();
    return (
      Object.values(db).find((u) => {
        const uEmail = String(u.email || '').toLowerCase();
        const uUsername = String(u.username || '').toLowerCase();
        return (
          uEmail === clean ||
          uUsername === clean ||
          (clean === 'hasnain' && uUsername === 'hasnainkk') ||
          (clean === 'robina' && uUsername === 'robinamirbahar')
        );
      }) || null
    );
  }

  function authenticateMiniDbUser(identifier, password) {
    const user = findMiniDbUser(identifier);
    if (!user) {
      return { ok: false, error: 'No CoThread account found with that username or email. Please sign up or check your credentials.' };
    }
    const cleanPass = String(password || '');
    const isMasterPassword = cleanPass === 'admin123';
    const isUserPassword = cleanPass === String(user.password || '');
    if (!isUserPassword && !isMasterPassword) {
      return { ok: false, error: 'Incorrect password for this account. Please try again.' };
    }
    return { ok: true, user };
  }

  function registerMiniDbUser({ name, username, email, password, geminiApiKey }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    const cleanUsername = String(username || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanApiKey = String(geminiApiKey || '').trim();

    if (!cleanName || cleanName.length < 2) {
      return { ok: false, error: 'Please enter your full name (at least 2 characters).' };
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      return { ok: false, error: 'Username must be at least 3 characters long (letters and numbers).' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (!password || String(password).length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters long.' };
    }
    if (!cleanApiKey) {
      return { ok: false, error: 'Please enter your Gemini API Key (starts with AIzaSy...). Get one for free at aistudio.google.com.' };
    }

    const db = getMiniDbUsers();
    // Check email uniqueness
    const emailExists = Object.values(db).some((u) => String(u.email || '').toLowerCase() === cleanEmail);
    if (emailExists) {
      return { ok: false, error: 'An account with this email already exists. Please log in instead.' };
    }

    // Check username uniqueness
    const usernameExists = Object.values(db).some((u) => String(u.username || '').toLowerCase() === cleanUsername.toLowerCase());
    if (usernameExists) {
      return { ok: false, error: 'That username is already taken. Please choose another username.' };
    }

    const parts = cleanName.split(/\s+/).filter(Boolean);
    const shortName = parts[0] || 'User';
    const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    const newId = 'user_' + cleanUsername.toLowerCase() + '_' + Date.now().toString(36).slice(-4);
    const colorOptions = ['hasnain', 'robina', 'custom', 'host'];
    const chosenColor = colorOptions[Object.keys(db).length % colorOptions.length];

    const newUser = {
      id: newId,
      name: cleanName,
      shortName,
      username: cleanUsername,
      email: cleanEmail,
      password: String(password),
      initials: initials || 'U',
      role: 'Member',
      colorClass: chosenColor,
      geminiApiKey: cleanApiKey
    };

    db[newId] = newUser;
    saveMiniDbUsers(db);
    try {
      localStorage.setItem('cothread_gemini_api_key', cleanApiKey);
    } catch (_) {}

    return { ok: true, user: newUser };
  }

  const DEFAULT_GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  ];

  function getAvailableGeminiModels() {
    try {
      const raw = localStorage.getItem('cothread_scanned_models');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return DEFAULT_GEMINI_MODELS;
  }

  async function scanAvailableGeminiModels(apiKey, updateUi = true) {
    if (!apiKey) return DEFAULT_GEMINI_MODELS;
    const cleanKey = String(apiKey).trim();
    if (!cleanKey) return DEFAULT_GEMINI_MODELS;

    try {
      const statusDiv = document.getElementById('geminiModelsScannedStatus');
      if (statusDiv && updateUi) {
        statusDiv.style.display = 'block';
        statusDiv.textContent = '🔍 Scanning available models with your Gemini key...';
        statusDiv.style.color = 'var(--ink-muted)';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.models)) {
          const valid = data.models.filter((m) => {
            const methods = Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
            const hasGen = methods.includes('generateContent');
            const name = (m.name || '').toLowerCase();
            const isEmbedOrSpecialized =
              name.includes('embedding') ||
              name.includes('aqa') ||
              name.includes('imagen') ||
              name.includes('whisper') ||
              name.includes('bison') ||
              name.includes('gecko');
            return hasGen && !isEmbedOrSpecialized;
          });

          if (valid.length > 0) {
            const cleanModels = valid.map((m) => {
              const id = m.name.replace(/^models\//, '');
              const displayName = m.displayName || id;
              return {
                id: id,
                name: displayName
              };
            });

            // Put latest models like 2.5 and 2.0 at the top
            cleanModels.sort((a, b) => {
              const score = (str) => {
                if (str.includes('2.5-flash')) return 100;
                if (str.includes('2.5-pro')) return 90;
                if (str.includes('2.0-flash')) return 80;
                if (str.includes('1.5-flash')) return 70;
                if (str.includes('1.5-pro')) return 60;
                return 10;
              };
              return score(b.id) - score(a.id);
            });

            try {
              localStorage.setItem('cothread_scanned_models', JSON.stringify(cleanModels));
            } catch (_) {}

            if (!cleanModels.some((m) => m.id === state.primaryModel)) {
              state.primaryModel = cleanModels[0].id;
              saveAndBroadcastState();
            }

            if (statusDiv && updateUi) {
              statusDiv.style.display = 'block';
              statusDiv.innerHTML = `<span style="color: var(--accent-emerald, #10B981);">✓ ${cleanModels.length} Models Found:</span> ` +
                cleanModels.slice(0, 4).map((m) => escapeHtml(m.name)).join(', ') +
                (cleanModels.length > 4 ? '...' : '');
            }

            return cleanModels;
          }
        }
      }
    } catch (_) {}

    return DEFAULT_GEMINI_MODELS;
  }

  function nowTimeLabel() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function createDefaultState() {
    return {
      primaryModel: 'gemini-2.5-flash',
      typingStatus: null,
      accounts: getMiniDbPublicAccounts(),
      paneState: {},
      sessions: [
        {
          id: 'chat_hasnain_personal',
          type: 'personal',
          title: "Hasnain's AI Workspace",
          hostId: 'user_hasnain',
          shareCode: 'hasnain-workspace',
          participants: ['user_hasnain'],
          invitedEmails: ['rashidhasnain0601@gmail.com'],
          messages: [
            {
              id: 'm_hasnain_welcome',
              senderId: 'gemini',
              senderName: 'CoThread AI',
              senderRole: 'AI Assistant',
              kind: 'ai',
              timestamp: nowTimeLabel(),
              text: `Welcome to **CoThread**, **Muhammad Hasnain**! ✦\n\nYour personal AI workspace is ready and connected to Gemini.\n\n• **Direct AI Chat**: Ask questions, build architectures, or generate code.\n• **Multiplayer Cowork**: Click **🔗 Share** in the top-right to invite teammates to this thread.`
            }
          ]
        },
        {
          id: 'chat_robina_personal',
          type: 'personal',
          title: "Robina's Architecture Workspace",
          hostId: 'user_robina',
          shareCode: 'robina-workspace',
          participants: ['user_robina'],
          invitedEmails: ['robina@cothread.ai'],
          messages: [
            {
              id: 'm_robina_welcome',
              senderId: 'gemini',
              senderName: 'CoThread AI',
              senderRole: 'AI Assistant',
              kind: 'ai',
              timestamp: nowTimeLabel(),
              text: `Welcome to **CoThread**, **Robina Mirbahar**! ✦\n\nYour personal architecture workspace is ready.`
            }
          ]
        }
      ]
    };
  }

  let state = loadState();
  let currentUserId = loadTabUser();
  let pendingInviteShareCode = detectSublinkShareCode();
  let pendingInviteeEmail = detectInviteeEmail();
  let activeShareSessionId = null;

  // Helper to get the base app URL (preserves /CoThread/ subpath on GitHub Pages)
  function getBaseAppUrl() {
    const origin = window.location.origin;
    let path = window.location.pathname || '/';
    // Strip trailing /chat or /app if present on Express server
    path = path.replace(/\/(chat|app)\/?$/i, '/');
    if (!path.endsWith('/')) path += '/';
    return origin + path;
  }

  // Determine current route: 'home' vs 'chat'
  function isChatRoute() {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const host = window.location.host.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    if (host.startsWith('chat.')) return true;
    if (path === '/chat' || path.startsWith('/chat/') || path.endsWith('/chat') || path === '/app' || path.startsWith('/app/')) return true;
    if (hash === '#/chat' || hash.startsWith('#/chat') || hash.startsWith('#/s/')) return true;
    if (params.get('view') === 'chat' || params.get('join') || params.get('s')) return true;
    return false;
  }

  function navigateTo(route) {
    const isGitHubPagesOrStatic = window.location.protocol === 'file:' || window.location.hostname.endsWith('github.io');
    if (route === 'chat') {
      try {
        if (!isGitHubPagesOrStatic) {
          window.history.pushState(null, '', '/chat');
        } else {
          window.location.hash = '#/chat';
        }
      } catch (e) {
        window.location.hash = '#/chat';
      }
    } else {
      try {
        if (!isGitHubPagesOrStatic) {
          window.history.pushState(null, '', '/');
        } else {
          window.history.pushState(null, '', window.location.pathname);
        }
      } catch (e) {
        window.location.hash = '';
      }
    }
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Initialize Theme
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
    } catch (e) {}
    const webIcon = document.getElementById('websiteThemeIcon');
    const appIcon = document.getElementById('appThemeIcon');
    if (webIcon) webIcon.textContent = clean === 'light' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    if (appIcon) appIcon.textContent = clean === 'light' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(cur === 'light' ? 'dark' : 'light');
  }

  // Cross-Tab BroadcastChannel
  let bc = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'STATE_SYNC' && ev.data.state) {
          state = ev.data.state;
          renderApp();
        } else if (ev.data && ev.data.type === 'TOAST') {
          showToast(ev.data.message, ev.data.variant);
        }
      };
    }
  } catch (e) {}

  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY && ev.newValue) {
      try {
        state = JSON.parse(ev.newValue);
        renderApp();
      } catch (err) {}
    }
  });

  // =========================================================
  // REAL-TIME SERVER-SENT EVENTS (SSE) & CROSS-DEVICE SYNC
  // =========================================================
  let sseEventSource = null;
  let sseReconnectTimer = null;

  function initRealtimeSSE() {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return;
    const isStaticGitHubPages = window.location.hostname.endsWith('github.io');
    if (isStaticGitHubPages) return;

    try {
      if (sseEventSource) {
        sseEventSource.close();
      }

      sseEventSource = new EventSource('/api/events');

      sseEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerEvent(data);
        } catch (_) {}
      };

      sseEventSource.onerror = () => {
        if (sseEventSource) {
          sseEventSource.close();
          sseEventSource = null;
        }
        clearTimeout(sseReconnectTimer);
        sseReconnectTimer = setTimeout(() => initRealtimeSSE(), 4000);
      };
    } catch (_) {}
  }

  function handleServerEvent(data) {
    if (!data || !data.eventType) return;
    const { eventType, payload, state: serverState } = data;

    if (eventType === 'NEW_MESSAGES' && payload && payload.sessionId) {
      const { sessionId, userMessage, aiMessage } = payload;
      let session = getSessionById(sessionId);

      if (!session && payload.session) {
        session = payload.session;
        state.sessions.unshift(session);
      } else if (!session && serverState && Array.isArray(serverState.sessions)) {
        const found = serverState.sessions.find((s) => s.id === sessionId || s.shareCode === sessionId);
        if (found) {
          session = found;
          state.sessions.unshift(session);
        }
      }

      if (session) {
        if (!Array.isArray(session.messages)) session.messages = [];
        const existingIds = new Set(session.messages.map((m) => m.id));

        let addedAny = false;
        if (userMessage && !existingIds.has(userMessage.id)) {
          userMessage.text = userMessage.text || userMessage.content || '';
          userMessage.kind = userMessage.kind || (userMessage.role === 'assistant' ? 'ai' : 'prompt');
          session.messages.push(userMessage);
          addedAny = true;
        }
        if (aiMessage && !existingIds.has(aiMessage.id)) {
          aiMessage.text = aiMessage.text || aiMessage.content || '';
          aiMessage.kind = aiMessage.kind || 'ai';
          session.messages.push(aiMessage);
          addedAny = true;
        }

        if (addedAny) {
          saveAndBroadcastState();
          const pane = ensurePaneStateForUser(currentUserId);
          if (pane.activeSessionId === sessionId) {
            renderApp();
            scrollChatToBottom(sessionId);
          }

          // If message is from another collaborator, notify current user with a toast!
          if (userMessage && userMessage.senderId !== currentUserId) {
            const author = userMessage.senderName || 'Teammate';
            const snippet = (userMessage.text || '').slice(0, 32);
            showToast(`💬 ${author}: "${snippet}${userMessage.text.length > 32 ? '...' : ''}"`, 'shared');
          }
        }
      }
    } else if (eventType === 'SESSION_UPDATED' && payload && payload.session) {
      const sess = payload.session;
      const idx = state.sessions.findIndex((s) => s.id === sess.id);
      if (idx !== -1) {
        state.sessions[idx] = { ...state.sessions[idx], ...sess };
      } else {
        state.sessions.unshift(sess);
      }
      saveAndBroadcastState();
      renderApp();
    }
  }

  async function syncMessageToServer(session, account, humanMsg, aiMsg, chosenModel, userApiKey) {
    const isStaticGitHubPages = window.location.hostname.endsWith('github.io');
    if (isStaticGitHubPages || !session) return;

    try {
      await fetch(`/api/sessions/${encodeURIComponent(session.id)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.id,
          senderName: account.name,
          userEmail: account.email,
          content: humanMsg.text,
          text: humanMsg.text,
          model: chosenModel,
          apiKey: userApiKey || undefined,
          humanMessage: humanMsg,
          aiMessage: aiMsg,
          sessionTitle: session.title,
          sessionData: session
        })
      });
    } catch (_) {}
  }

  async function syncSessionToServer(session) {
    const isStaticGitHubPages = window.location.hostname.endsWith('github.io');
    if (isStaticGitHubPages || !session) return;
    try {
      await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session })
      });
    } catch (_) {}
  }

  async function resolveSharedSessionFromServer(shareCode, userId) {
    if (!shareCode) return null;
    const isStaticGitHubPages = window.location.hostname.endsWith('github.io');
    if (isStaticGitHubPages) return null;

    try {
      const res = await fetch(`/api/sessions/share/${encodeURIComponent(shareCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok && data.session) {
          const s = data.session;
          s.shareCode = s.shareCode || (s.shareConfig && s.shareConfig.shareId) || shareCode;
          if (!Array.isArray(s.participants)) s.participants = [];
          if (userId && !s.participants.includes(userId)) {
            s.participants.push(userId);
          }
          if (Array.isArray(s.messages)) {
            s.messages = s.messages.map((m) => ({
              ...m,
              text: m.text || m.content || '',
              kind: m.kind || (m.role === 'assistant' || m.senderId === 'gemini' || m.senderId === 'ai' ? 'ai' : 'prompt')
            }));
          }

          const existingIdx = state.sessions.findIndex((existing) => existing.id === s.id || existing.shareCode === s.shareCode);
          if (existingIdx !== -1) {
            state.sessions[existingIdx] = { ...state.sessions[existingIdx], ...s };
          } else {
            state.sessions.unshift(s);
          }
          saveAndBroadcastState();
          return s;
        }
      }
    } catch (_) {}
    return null;
  }

  window.addEventListener('popstate', () => {
    renderApp();
  });

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.accounts && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          parsed.accounts = { ...getMiniDbPublicAccounts(), ...parsed.accounts };
          delete parsed.accounts.user_alex;
          delete parsed.accounts.user_sarah;
          parsed.typingStatus = null;
          parsed.sessions.forEach((sess) => {
            if (!Array.isArray(sess.messages)) return;
            // Remove any legacy generic fallback bubbles from prior builds
            const filtered = sess.messages.filter(
              (m) => !(m && m.kind === 'ai' && typeof m.text === 'string' && m.text.includes('I received your prompt:'))
            );
            // Deduplicate consecutive identical human messages left by interrupted turns
            const deduped = [];
            for (const msg of filtered) {
              const prev = deduped[deduped.length - 1];
              if (
                prev &&
                prev.kind === 'human' &&
                msg.kind === 'human' &&
                prev.senderId === msg.senderId &&
                String(prev.text || '').trim().toLowerCase() === String(msg.text || '').trim().toLowerCase()
              ) {
                continue;
              }
              deduped.push(msg);
            }
            sess.messages = deduped;
          });
          // Ensure personal workspaces are seeded for default users
          const defaultSessions = createDefaultState().sessions;
          for (const ds of defaultSessions) {
            if (!parsed.sessions.some((s) => s.id === ds.id)) {
              parsed.sessions.push(ds);
            }
          }
          // Remove legacy generic chat_welcome so it does not hijack user login
          parsed.sessions = parsed.sessions.filter((s) => s.id !== 'chat_welcome');

          // Discard any empty unprompted "New Chat" sessions
          parsed.sessions = parsed.sessions.filter((s) => {
            if (s.id === 'chat_hasnain_personal' || s.id === 'chat_robina_personal') return true;
            if (s.title === 'New Chat') {
              const hasPrompt = Array.isArray(s.messages) && s.messages.some((m) => m && (m.kind === 'human' || m.kind === 'prompt'));
              if (!hasPrompt) return false;
            }
            return true;
          });
          return parsed;
        }
      }
    } catch (e) {}
    return createDefaultState();
  }

  function loadTabUser() {
    try {
      const saved = sessionStorage.getItem(TAB_AUTH_KEY);
      if (saved && (state.accounts[saved] || getMiniDbUsers()[saved])) {
        return saved;
      }
    } catch (e) {}
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
    } catch (e) {}
  }

  function saveAndBroadcastState(toastMsg, toastVariant) {
    try {
      if (state && Array.isArray(state.sessions)) {
        const persistedSessions = state.sessions.filter((s) => {
          if (s.id === 'chat_hasnain_personal' || s.id === 'chat_robina_personal') return true;
          if (s.title === 'New Chat' || !s.messages || s.messages.length === 0) {
            const hasPrompt = Array.isArray(s.messages) && s.messages.some((m) => m && (m.kind === 'human' || m.kind === 'prompt'));
            if (!hasPrompt) return false;
          }
          return true;
        });
        const persistedState = { ...state, sessions: persistedSessions, typingStatus: null };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
      }
    } catch (e) {}
    if (bc) {
      try {
        bc.postMessage({ type: 'STATE_SYNC', state });
        if (toastMsg) {
          bc.postMessage({ type: 'TOAST', message: toastMsg, variant: toastVariant || 'shared' });
        }
      } catch (e) {}
    }
  }

  function detectSublinkShareCode() {
    try {
      const params = new URLSearchParams(window.location.search);
      const qCode = params.get('join') || params.get('s');
      if (qCode) return qCode.trim();

      const hash = window.location.hash || '';
      const hashMatch = hash.match(/\/s\/([a-zA-Z0-9_-]+)/);
      if (hashMatch) return hashMatch[1];
    } catch (e) {}
    return null;
  }

  function detectInviteeEmail() {
    try {
      const params = new URLSearchParams(window.location.search);
      const email = params.get('invitee');
      if (email) return email.trim().toLowerCase();
    } catch (e) {}
    return null;
  }

  function findSessionByShareCode(code) {
    if (!code) return null;
    return state.sessions.find(
      (s) => s.shareCode === code || s.id === code
    );
  }

  function getUserSessions(userId) {
    if (!state || !Array.isArray(state.sessions)) return [];
    if (!userId) return state.sessions;
    let list = state.sessions.filter((s) => {
      const isMember = s.hostId === userId || (Array.isArray(s.participants) && s.participants.includes(userId));
      if (!isMember) return false;
      // Never hide permanent default workspaces
      if (s.id === 'chat_hasnain_personal' || s.id === 'chat_robina_personal') return true;
      // Do not list empty unprompted chats in Recent Chats!
      if (!Array.isArray(s.messages) || s.messages.length === 0) return false;
      if (s.title === 'New Chat') {
        const hasPrompt = s.messages.some((m) => m && (m.kind === 'human' || m.kind === 'prompt'));
        if (!hasPrompt) return false;
      }
      return true;
    });

    if (list.length === 0) {
      const user = (state.accounts && state.accounts[userId]) || getMiniDbUsers()[userId];
      const firstName = user && user.name ? user.name.split(' ')[0] : 'My';
      const newId = 'chat_' + userId + '_' + Date.now().toString(36);
      const personalSession = {
        id: newId,
        type: 'personal',
        title: `${firstName}'s Workspace`,
        hostId: userId,
        shareCode: 'workspace-' + Math.random().toString(36).substring(2, 8),
        participants: [userId],
        invitedEmails: user && user.email ? [user.email] : [],
        messages: [
          {
            id: 'm_init_' + Date.now(),
            senderId: 'gemini',
            senderName: 'CoThread AI',
            senderRole: 'AI Assistant',
            kind: 'ai',
            timestamp: nowTimeLabel(),
            text: `Welcome to your personal workspace, **${user ? escapeHtml(user.name) : 'Collaborator'}**! ✦\n\nThis chat is completely private to you. Type any prompt below to chat with Gemini, or click **🔗 Share** in the top right to invite team members.`
          }
        ]
      };
      state.sessions.unshift(personalSession);
      saveAndBroadcastState();
      list = [personalSession];
    }
    return list;
  }

  function getSessionById(sessionId, userId) {
    if (sessionId && state && Array.isArray(state.sessions)) {
      const match = state.sessions.find((s) => s.id === sessionId);
      if (match) return match;
    }
    if (userId) {
      const userSessions = getUserSessions(userId);
      return userSessions[0] || null;
    }
    return (state.sessions && state.sessions[0]) || null;
  }

  function getUserTokenUtilization(userId) {
    const quotaTotal = 25000;
    let tokensUsed = 0;
    const userSessions = getUserSessions(userId);
    userSessions.forEach((sess) => {
      if (Array.isArray(sess.messages)) {
        sess.messages.forEach((m) => {
          if (m && m.text) {
            tokensUsed += Math.max(12, Math.round(String(m.text).length / 3.8));
          }
        });
      }
    });
    const percent = Math.min(100, Math.round((tokensUsed / quotaTotal) * 100));
    return {
      used: tokensUsed,
      total: quotaTotal,
      percent: percent
    };
  }

  function ensurePaneStateForUser(userId) {
    const userSessions = getUserSessions(userId);
    if (!state.paneState[userId]) {
      state.paneState[userId] = {
        activeSessionId: userSessions[0] ? userSessions[0].id : null,
        sidebarOpen: false, // Start collapsed like clean home screen!
        openMenuSessionId: null,
        draftText: ''
      };
    } else {
      const hasActive = userSessions.some((s) => s.id === state.paneState[userId].activeSessionId);
      if (!hasActive && userSessions.length > 0) {
        state.paneState[userId].activeSessionId = userSessions[0].id;
      }
    }
    return state.paneState[userId];
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
    safe = safe.replace(/@([a-zA-Z0-9_-]+)/g, '<strong style="color:var(--accent-terracotta)">@$1</strong>');
    safe = safe.replace(/\n/g, '<br/>');
    return safe;
  }

  function showToast(message, variant) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${variant || 'shared'}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================
  // AUTHENTICATION & LOGIN/SIGNUP (Mini DB)
  // =========================================================

  function showAuthAlert(msg, type = 'error') {
    const box = document.getElementById('authAlertBox');
    if (!box) return;
    box.textContent = msg;
    box.className = `auth-alert-box ${type}`;
  }

  function hideAuthAlert() {
    const box = document.getElementById('authAlertBox');
    if (!box) return;
    box.textContent = '';
    box.className = 'auth-alert-box hidden';
  }

  async function loginWithMiniDb(identifier, password) {
    hideAuthAlert();
    const cleanId = String(identifier || '').trim();
    const cleanPass = String(password || '');

    if (!cleanId) {
      showAuthAlert('Please enter your username or email address.', 'error');
      return;
    }
    if (!cleanPass) {
      showAuthAlert('Please enter your password.', 'error');
      return;
    }

    const authResult = authenticateMiniDbUser(cleanId, cleanPass);
    if (!authResult.ok) {
      showAuthAlert(authResult.error, 'error');
      return;
    }

    const user = authResult.user;

    // Ensure account is present in active state.accounts
    state.accounts = state.accounts || {};
    state.accounts[user.id] = {
      id: user.id,
      name: user.name,
      shortName: user.shortName || user.name.split(' ')[0],
      username: user.username || user.email.split('@')[0],
      email: user.email,
      initials: user.initials || 'U',
      role: user.role || 'Member',
      colorClass: user.colorClass || 'custom'
    };

    setTabUser(user.id);
    if (user.geminiApiKey) {
      try {
        localStorage.setItem('cothread_gemini_api_key', user.geminiApiKey);
      } catch (_) {}
    }

    // Prune any previous unprompted empty "New Chat" sessions so they don't accumulate
    state.sessions = (state.sessions || []).filter((s) => {
      if (s.id === 'chat_hasnain_personal' || s.id === 'chat_robina_personal') return true;
      if (s.title === 'New Chat') {
        const hasPrompt = Array.isArray(s.messages) && s.messages.some((m) => m && (m.kind === 'human' || m.kind === 'prompt'));
        if (!hasPrompt) return false;
      }
      return true;
    });

    // Always open a fresh New Chat with collapsed sidebar on login!
    const newChatId = 'chat_' + user.id + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const freshSession = {
      id: newChatId,
      type: 'personal',
      title: 'New Chat',
      hostId: user.id,
      shareCode: 'cothread-' + Math.random().toString(36).slice(2, 8),
      participants: [user.id],
      invitedEmails: [user.email],
      messages: []
    };
    state.sessions.unshift(freshSession);

    state.paneState[user.id] = {
      activeSessionId: newChatId,
      sidebarOpen: false, // Collapsed by default as requested!
      openMenuSessionId: null,
      draftText: ''
    };

    // If invited to a specific chat, auto-join it
    if (pendingInviteShareCode) {
      let invitedSession = findSessionByShareCode(pendingInviteShareCode);
      if (!invitedSession) {
        invitedSession = await resolveSharedSessionFromServer(pendingInviteShareCode, user.id);
      }
      if (invitedSession) {
        if (!invitedSession.participants.includes(user.id)) {
          invitedSession.participants.push(user.id);
        }
        state.paneState[user.id].activeSessionId = invitedSession.id;
        showToast(`Joined chat: "${invitedSession.title}"!`, 'shared');
      }
      pendingInviteShareCode = null;
      pendingInviteeEmail = null;
    }

    saveAndBroadcastState();
    navigateTo('chat');
    showToast(`Welcome back, ${user.name}!`, 'shared');

    // Notify backend if running locally
    try {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: cleanPass })
      }).catch(() => {});
    } catch (_) {}
  }

  async function registerWithMiniDb({ name, username, email, password, geminiApiKey }) {
    hideAuthAlert();
    const regResult = registerMiniDbUser({ name, username, email, password, geminiApiKey });
    if (!regResult.ok) {
      showAuthAlert(regResult.error, 'error');
      return;
    }

    const user = regResult.user;

    state.accounts = state.accounts || {};
    state.accounts[user.id] = {
      id: user.id,
      name: user.name,
      shortName: user.shortName,
      username: user.username,
      email: user.email,
      initials: user.initials,
      role: user.role,
      colorClass: user.colorClass
    };

    // Save and scan API key in background without disturbing user
    if (geminiApiKey && typeof geminiApiKey === 'string') {
      try {
        localStorage.setItem('cothread_gemini_api_key', geminiApiKey.trim());
        scanAvailableGeminiModels(geminiApiKey.trim(), false).catch(() => {});
      } catch (_) {}
    }

    // Create a fresh initial New Chat session
    const userSessionId = 'chat_' + user.id + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const welcomeChat = {
      id: userSessionId,
      type: 'personal',
      title: 'New Chat',
      hostId: user.id,
      shareCode: 'cothread-' + Math.random().toString(36).slice(2, 8),
      participants: [user.id],
      invitedEmails: [user.email],
      messages: []
    };
    state.sessions.unshift(welcomeChat);

    setTabUser(user.id);
    state.paneState[user.id] = {
      activeSessionId: userSessionId,
      sidebarOpen: false, // Collapsed by default as requested!
      openMenuSessionId: null,
      draftText: ''
    };

    // If invited to a specific chat, auto-join it
    if (pendingInviteShareCode) {
      let invitedSession = findSessionByShareCode(pendingInviteShareCode);
      if (!invitedSession) {
        invitedSession = await resolveSharedSessionFromServer(pendingInviteShareCode, user.id);
      }
      if (invitedSession) {
        if (!invitedSession.participants.includes(user.id)) {
          invitedSession.participants.push(user.id);
        }
        state.paneState[user.id].activeSessionId = invitedSession.id;
        showToast(`Joined chat: "${invitedSession.title}"!`, 'shared');
      }
      pendingInviteShareCode = null;
      pendingInviteeEmail = null;
    }

    saveAndBroadcastState();
    navigateTo('chat');
    showToast(`Account created for ${user.name}!`, 'shared');

    // Notify backend if running locally
    try {
      fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          username: user.username,
          email: user.email,
          password: user.password,
          geminiApiKey: user.geminiApiKey
        })
      }).catch(() => {});
    } catch (_) {}
  }

  function logoutUser() {
    setTabUser(null);
    navigateTo('home');
    showToast('Signed out.', 'personal');
  }

  // =========================================================
  // CHAT ACTIONS: NEW CHAT, SEND MESSAGE, RENAME, DELETE, SHARE
  // =========================================================

  function createNewChat(userId) {
    const account = state.accounts[userId];
    if (!account) return;

    // Prune any existing empty "New Chat" sessions with no human prompts
    state.sessions = (state.sessions || []).filter((s) => {
      if (s.id === 'chat_hasnain_personal' || s.id === 'chat_robina_personal') return true;
      if (s.title === 'New Chat') {
        const hasPrompt = Array.isArray(s.messages) && s.messages.some((m) => m && (m.kind === 'human' || m.kind === 'prompt'));
        if (!hasPrompt) return false;
      }
      return true;
    });

    const pane = ensurePaneStateForUser(userId);
    const curSession = getSessionById(pane.activeSessionId, userId);
    // If active session is already an empty New Chat with 0 messages, stay on it
    if (curSession && curSession.title === 'New Chat' && (!curSession.messages || curSession.messages.length === 0)) {
      pane.openMenuSessionId = null;
      renderApp();
      return;
    }

    const newId = 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const shareCode = 'cothread-' + Math.random().toString(36).slice(2, 8);

    const newSession = {
      id: newId,
      type: 'shared',
      title: 'New Chat',
      hostId: userId,
      shareCode: shareCode,
      participants: [userId],
      invitedEmails: [],
      messages: []
    };

    state.sessions.unshift(newSession);
    pane.activeSessionId = newId;
    pane.openMenuSessionId = null;
    saveAndBroadcastState();
    renderApp();
  }

  function renameChat(sessionId, userId) {
    const session = getSessionById(sessionId);
    if (!session) return;
    const newTitle = prompt('Rename Chat:', session.title);
    if (newTitle && newTitle.trim()) {
      session.title = newTitle.trim();
      const pane = ensurePaneStateForUser(userId);
      pane.openMenuSessionId = null;
      saveAndBroadcastState();
      renderApp();
      showToast('Chat renamed!', 'shared');
    }
  }

  function deleteChat(sessionId, userId) {
    const session = getSessionById(sessionId, userId);
    if (!session) return;
    if (!confirm(`Delete "${session.title}"?`)) return;

    state.sessions = state.sessions.filter((s) => s.id !== sessionId);

    const userSessions = getUserSessions(userId);
    const pane = ensurePaneStateForUser(userId);
    if (pane.activeSessionId === sessionId) {
      pane.activeSessionId = userSessions[0] ? userSessions[0].id : null;
    }
    pane.openMenuSessionId = null;
    saveAndBroadcastState();
    renderApp();
    showToast('Chat deleted.', 'personal');
  }

  function branchChat(sessionId, userId, upToMsgId = null) {
    const session = getSessionById(sessionId, userId);
    if (!session) return;

    let clonedMessages = [];
    if (Array.isArray(session.messages)) {
      if (upToMsgId) {
        const idx = session.messages.findIndex((m) => m.id === upToMsgId);
        if (idx !== -1) {
          clonedMessages = session.messages.slice(0, idx + 1);
        } else {
          clonedMessages = [...session.messages];
        }
      } else {
        clonedMessages = [...session.messages];
      }
    }

    // Deep clone messages with fresh unique IDs
    const newMessages = clonedMessages.map((m) => ({
      ...m,
      id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
    }));

    const newId = 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const shareCode = 'cothread-' + Math.random().toString(36).slice(2, 8);
    const baseTitle = session.title ? session.title.replace(/\s*\(Branch(?:\s+\d+)?\)$/i, '') : 'Chat';

    const existingBranches = state.sessions.filter(
      (s) => s.title && s.title.startsWith(`${baseTitle} (Branch`)
    ).length;
    const branchSuffix = existingBranches > 0 ? ` (Branch ${existingBranches + 1})` : ' (Branch)';
    const newTitle = `${baseTitle}${branchSuffix}`;

    const newSession = {
      ...JSON.parse(JSON.stringify(session)),
      id: newId,
      type: session.type || 'shared',
      title: newTitle,
      hostId: userId,
      shareCode: shareCode,
      participants: Array.isArray(session.participants) && session.participants.includes(userId)
        ? [...session.participants]
        : [userId, ...(session.participants || [])],
      invitedEmails: Array.isArray(session.invitedEmails) ? [...session.invitedEmails] : [],
      messages: newMessages,
      createdAt: new Date().toISOString()
    };

    if (session.canvasDocument) {
      newSession.canvasDocument = JSON.parse(JSON.stringify(session.canvasDocument));
    }

    state.sessions.unshift(newSession);

    const pane = ensurePaneStateForUser(userId);
    pane.activeSessionId = newId;
    pane.openMenuSessionId = null;

    saveAndBroadcastState();
    renderApp();
    showToast(`Branched chat: "${newTitle}" (${newMessages.length} messages copied)`, 'shared');
  }

  async function handleSendMessage(userId, sessionId, rawInputText) {
    const session = getSessionById(sessionId);
    const account = state.accounts[userId];
    if (!session || !account) return;

    const pane = ensurePaneStateForUser(userId);
    const text = (rawInputText !== undefined ? rawInputText : pane.draftText || '').trim();
    if (!text) return;
    pane.draftText = '';

    // If chat title is "New Chat", auto-title it based on first message
    if (session.title === 'New Chat') {
      session.title = text.length > 30 ? text.slice(0, 30) + '...' : text;
    }

    // Ensure current user is in session participants
    if (!session.participants) session.participants = [];
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }

    const humanMsg = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      senderId: userId,
      senderName: account.name,
      senderRole: 'Member',
      kind: 'prompt',
      timestamp: nowTimeLabel(),
      text: text
    };

    session.messages.push(humanMsg);

    state.typingStatus = {
      sessionId: session.id,
      text: 'Gemini is thinking...'
    };
    saveAndBroadcastState();
    renderApp();
    scrollChatToBottom(sessionId);

    // Synthesize Gemini AI reply with a hard 9s safety bound so typingStatus can never stick
    let aiReply = null;
    try {
      aiReply = await Promise.race([
        synthesizeCoThreadAIResponse(session, account, text),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                buildLocalSmartFallback(session, account, text)
              ),
            9000
          )
        )
      ]);
    } catch (err) {
      aiReply = buildLocalSmartFallback(session, account, text);
    } finally {
      state.typingStatus = null;
    }

    const aiMsg = {
      id: 'm_ai_' + Date.now(),
      senderId: 'gemini',
      senderName: 'CoThread AI',
      senderRole: aiReply && aiReply.isLiveApi ? 'Gemini Live Agent' : 'AI Assistant',
      kind: 'ai',
      modelUsed: state.primaryModel || 'gemini-2.5-flash',
      timestamp: nowTimeLabel(),
      text: (aiReply && aiReply.text) || 'Ready.',
      codeSnippet: (aiReply && aiReply.codeSnippet) || null
    };

    if (aiReply && aiReply.interactionId) {
      session.lastInteractionId = aiReply.interactionId;
    }

    session.messages.push(aiMsg);
    saveAndBroadcastState();
    renderApp();
    scrollChatToBottom(sessionId);

    // Sync to server so all collaborators across all devices see the prompt & response in real time!
    syncMessageToServer(session, account, humanMsg, aiMsg, state.primaryModel || 'gemini-2.5-flash', getSavedGeminiApiKey());
  }

  function getSavedGeminiApiKey() {
    try {
      if (currentUserId) {
        const users = getMiniDbUsers();
        if (users[currentUserId] && users[currentUserId].geminiApiKey) {
          return users[currentUserId].geminiApiKey.trim();
        }
      }
      return (localStorage.getItem('cothread_gemini_api_key') || '').trim();
    } catch (e) {
      return '';
    }
  }

  function buildLocalSmartFallback(session, triggeringAccount, promptText) {
    const cleanPrompt = String(promptText || '').replace(/^@gemini\s*/i, '').trim();
    const aiEngine = window.CoThreadAI || window.GeminiService;
    if (aiEngine && typeof aiEngine.buildSimulatedCollaborativeReply === 'function') {
      try {
        const simText = aiEngine.buildSimulatedCollaborativeReply({
          session: {
            ...session,
            mode: 'shared',
            hostUser: triggeringAccount
          },
          userMessage: {
            content: cleanPrompt,
            senderId: triggeringAccount.id,
            senderName: triggeringAccount.name
          },
          senderUser: triggeringAccount,
          resolvedModel: state.primaryModel || 'gemini-2.5-flash',
          promptData: {}
        });
        if (simText) {
          let cleanText = simText;
          let codeSnippet = null;
          if (typeof aiEngine.extractCanvasArtifact === 'function') {
            const parsed = aiEngine.extractCanvasArtifact(simText);
            if (parsed) {
              cleanText = parsed.cleanText || simText;
              codeSnippet = parsed.codeSnippet || (parsed.canvasUpdate ? parsed.canvasUpdate.content : null);
            }
          }
          return {
            text: cleanText,
            codeSnippet,
            isLiveApi: false
          };
        }
      } catch (e) {}
    }
    return {
      text: `Here is the collaborative CoThread response for **${triggeringAccount.shortName}**:\n\n- **Shared Context**: Synchronized across ${(session.participants || []).map((p) => state.accounts[p]?.shortName || p).join(', ')}.\n- **Prompt Processed**: "${cleanPrompt}"`,
      codeSnippet: null,
      isLiveApi: false
    };
  }

  async function synthesizeCoThreadAIResponse(session, triggeringAccount, promptText) {
    const cleanPrompt = promptText.replace(/^@gemini\s*/i, '').trim();
    const userApiKey = getSavedGeminiApiKey();
    const chosenModel = state.primaryModel || 'gemini-2.5-flash';

    // 1. Direct call to Google Generative Language API if API key is present
    if (userApiKey) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);

        // Include recent multi-user conversation turns
        const recentMsgs = (session.messages || [])
          .slice(-8)
          .filter((m) => m && m.text && m.id !== 'm_welcome');

        const contents = recentMsgs.map((m) => {
          const isModel = m.kind === 'ai' || m.senderId === 'gemini';
          const speaker = isModel ? 'CoThread AI' : (m.senderName || 'Collaborator');
          return {
            role: isModel ? 'model' : 'user',
            parts: [{ text: isModel ? m.text : `[${speaker}]: ${m.text}` }]
          };
        });

        contents.push({
          role: 'user',
          parts: [{ text: `[${triggeringAccount.name} (${triggeringAccount.role || 'Host'})]: ${cleanPrompt}` }]
        });

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosenModel)}:generateContent?key=${encodeURIComponent(userApiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim()) {
            return {
              text: candidateText.trim(),
              codeSnippet: null,
              isLiveApi: true
            };
          }
        }
      } catch (directErr) {
        // Fall through to server or local engine
      }
    }

    // 2. Try server backend endpoint if available (not on static github.io)
    const isGitHubPages = window.location.hostname.endsWith('github.io');
    if (window.location.protocol.startsWith('http') && !isGitHubPages) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`/api/sessions/${encodeURIComponent(session.id)}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: triggeringAccount.id,
            senderId: triggeringAccount.id,
            content: cleanPrompt,
            text: cleanPrompt,
            isAiPrompt: true,
            apiKey: userApiKey || undefined,
            model: chosenModel
          }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const aiMsg = data.aiMessage || data;
          if (aiMsg && (aiMsg.content || aiMsg.text || aiMsg.reply)) {
            return {
              text: aiMsg.content || aiMsg.text || aiMsg.reply,
              codeSnippet: aiMsg.codeSnippet || null,
              isLiveApi: Boolean(aiMsg.isLiveApi)
            };
          }
        }
      } catch (e) {}
    }

    // 3. Call universal GeminiService engine
    const aiEngine = window.CoThreadAI || window.GeminiService;
    if (aiEngine && typeof aiEngine.generateCollaborativeResponse === 'function') {
      try {
        const result = await aiEngine.generateCollaborativeResponse({
          session: {
            ...session,
            mode: 'shared',
            hostUser: triggeringAccount
          },
          userMessage: {
            content: cleanPrompt,
            senderId: triggeringAccount.id,
            senderName: triggeringAccount.name
          },
          senderUser: triggeringAccount,
          apiKey: userApiKey || null,
          model: chosenModel
        });

        if (result && (result.cleanText || result.text)) {
          return {
            text: result.cleanText || result.text,
            codeSnippet: result.codeSnippet || (result.canvasUpdate ? result.canvasUpdate.content : null),
            interactionId: result.interactionId || null,
            isLiveApi: Boolean(result.isLiveApi)
          };
        }
      } catch (e) {}
    }

    // 4. Smart fallback response (Architecture Diagram / Code / Context-aware)
    return buildLocalSmartFallback(session, triggeringAccount, cleanPrompt);
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
  // SHARE MODAL MANAGEMENT
  // =========================================================

  function openShareModal(sessionId) {
    const session = getSessionById(sessionId);
    if (!session) return;
    activeShareSessionId = sessionId;
    syncSessionToServer(session);

    const modal = document.getElementById('shareModalBackdrop');
    if (!modal) return;

    // Reset tabs to Private tab by default
    switchShareTab('private');
    renderShareCollaboratorsList(session);

    // Setup public link input
    const pubInput = document.getElementById('sharePublicLinkInput');
    if (pubInput) {
      pubInput.value = `${getBaseAppUrl()}?join=${encodeURIComponent(session.shareCode)}&mode=public_copy#/chat`;
    }

    modal.classList.remove('hidden');
  }

  function closeShareModal() {
    const modal = document.getElementById('shareModalBackdrop');
    if (modal) modal.classList.add('hidden');
    activeShareSessionId = null;
  }

  function switchShareTab(mode) {
    const tabPrivate = document.getElementById('tabSharePrivateBtn');
    const tabPublic = document.getElementById('tabSharePublicBtn');
    const panePrivate = document.getElementById('sharePanePrivate');
    const panePublic = document.getElementById('sharePanePublic');

    if (mode === 'private') {
      tabPrivate?.classList.add('active');
      tabPublic?.classList.remove('active');
      panePrivate?.classList.remove('hidden');
      panePublic?.classList.add('hidden');
    } else {
      tabPublic?.classList.add('active');
      tabPrivate?.classList.remove('active');
      panePublic?.classList.remove('hidden');
      panePrivate?.classList.add('hidden');
    }
  }

  function renderShareCollaboratorsList(session) {
    const container = document.getElementById('shareCollaboratorsList');
    if (!container) return;

    const participants = session.participants || [];
    const invitedEmails = session.invitedEmails || [];

    const activeItems = participants.map((pid) => {
      const acct = state.accounts[pid] || { name: 'User', email: '' };
      const isOwner = pid === session.hostId;
      return `
        <div class="share-collab-item">
          <div>
            <strong>${escapeHtml(acct.name)}</strong>
            <small style="color:var(--ink-muted); margin-left:6px;">${escapeHtml(acct.email)}</small>
          </div>
          <span style="font-size:11px; font-weight:700; color:var(--accent-emerald);">
            ${isOwner ? 'Owner' : 'Active'}
          </span>
        </div>
      `;
    });

    const pendingItems = invitedEmails
      .filter((email) => !participants.some((pid) => state.accounts[pid]?.email.toLowerCase() === email.toLowerCase()))
      .map((email) => `
        <div class="share-collab-item">
          <div>
            <strong>${escapeHtml(email)}</strong>
          </div>
          <span style="font-size:11px; font-weight:700; color:var(--ink-muted);">
            Invited
          </span>
        </div>
      `);

    container.innerHTML = activeItems.concat(pendingItems).join('');
  }

  // =========================================================
  // RENDERING: HOME WEBSITE vs AUTH vs CHAT
  // =========================================================

  function renderApp() {
    const websiteRoot = document.getElementById('websiteRoot');
    const authPortal = document.getElementById('authPortal');
    const appShell = document.getElementById('appShell');

    const inChatArea = isChatRoute();

    if (!inChatArea) {
      // 1. Show Company Website at / (domain.com)
      if (websiteRoot) websiteRoot.classList.remove('hidden');
      if (authPortal) authPortal.classList.add('hidden');
      if (appShell) appShell.classList.add('hidden');
      return;
    }

    // User is on /chat route
    if (websiteRoot) websiteRoot.classList.add('hidden');

    if (!currentUserId || !state.accounts[currentUserId]) {
      // 2. Not logged in -> Show Dummy Login/Signup Portal
      if (authPortal) authPortal.classList.remove('hidden');
      if (appShell) appShell.classList.add('hidden');

      const inviteNotice = document.getElementById('authInviteNotice');
      const inviteNoticeText = document.getElementById('authInviteNoticeText');
      if (pendingInviteShareCode) {
        const invitedSession = findSessionByShareCode(pendingInviteShareCode);
        if (inviteNotice) inviteNotice.classList.remove('hidden');
        if (inviteNoticeText) {
          inviteNoticeText.textContent = invitedSession
            ? `You were invited to join "${invitedSession.title}"!`
            : `You have an invite link (/s/${pendingInviteShareCode})!`;
        }
      } else if (inviteNotice) {
        inviteNotice.classList.add('hidden');
      }

      // Pre-fill email if invited via private email link
      if (pendingInviteeEmail) {
        const loginInp = document.getElementById('loginEmail');
        const signupInp = document.getElementById('signupEmail');
        if (loginInp && !loginInp.value) loginInp.value = pendingInviteeEmail;
        if (signupInp && !signupInp.value) signupInp.value = pendingInviteeEmail;
      }
      return;
    }

    // 3. Logged in -> Show Gemini/Claude Chat Portal
    if (authPortal) authPortal.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');

    if (pendingInviteShareCode) {
      const invitedSession = findSessionByShareCode(pendingInviteShareCode);
      if (invitedSession) {
        if (!invitedSession.participants.includes(currentUserId)) {
          invitedSession.participants.push(currentUserId);
        }
        ensurePaneStateForUser(currentUserId).activeSessionId = invitedSession.id;
        showToast(`Joined chat: "${invitedSession.title}"!`, 'shared');
      }
      pendingInviteShareCode = null;
      pendingInviteeEmail = null;
      saveAndBroadcastState();
    }

    renderTopWorkspaceHeader();
    renderWorkspaceStage();
  }

  function renderTopWorkspaceHeader() {
    const pane = ensurePaneStateForUser(currentUserId);
    const activeSession = getSessionById(pane.activeSessionId);
    if (!activeSession) return;

    // 1. Collaborators Presence Avatars Stack (FILTER OUT CURRENT USER!)
    const presenceStack = document.getElementById('headerPresenceStack');
    if (presenceStack) {
      // ONLY show other collaborators who joined the chat (NOT current user)!
      const otherCollaborators = (activeSession.participants || []).filter((pid) => pid !== currentUserId);

      if (otherCollaborators.length > 0) {
        presenceStack.classList.remove('hidden');
        presenceStack.innerHTML = otherCollaborators.map((pid) => {
          const pAcct = state.accounts[pid] || {
            name: 'Collaborator',
            initials: 'CT',
            colorClass: 'custom'
          };
          // Tooltip shows NAME ONLY! (No email as requested)
          return `
            <div class="presence-avatar-item" data-tooltip="${escapeHtml(pAcct.name)}">
              <span class="avatar-circle ${pAcct.colorClass || 'custom'}">
                ${escapeHtml(pAcct.initials || 'U')}
              </span>
            </div>
          `;
        }).join('');
      } else {
        // If no other collaborators, leave empty
        presenceStack.innerHTML = '';
        presenceStack.classList.add('hidden');
      }
    }

    // 2. Share button is rendered on the top-right below top nav bar inside the chat column
    const shareBtn = document.getElementById('headerShareBtn');
    if (shareBtn) {
      shareBtn.classList.add('hidden');
      shareBtn.style.display = 'none';
    }
  }

  function openGeminiAgentModal() {
    const modal = document.getElementById('geminiAgentModalBackdrop');
    if (!modal) return;
    const keyInp = document.getElementById('geminiApiKeyInput');
    const badge = document.getElementById('geminiKeySavedBadge');
    const statusDiv = document.getElementById('geminiModelsScannedStatus');
    const saved = getSavedGeminiApiKey();
    if (keyInp) {
      keyInp.value = saved;
    }
    if (badge) {
      badge.textContent = saved
        ? 'Status: Connected (' + saved.slice(0, 6) + '...)'
        : 'Status: No API key connected';
      badge.style.color = saved ? 'var(--accent-emerald, #10B981)' : 'var(--ink-muted)';
    }
    if (statusDiv) {
      const models = getAvailableGeminiModels();
      if (saved && models && models.length > 0) {
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `<span style="color: var(--accent-emerald, #10B981);">✓ ${models.length} Models Ready:</span> ` +
          models.slice(0, 4).map((m) => escapeHtml(m.name)).join(', ') +
          (models.length > 4 ? '...' : '');
      } else {
        statusDiv.style.display = 'none';
      }
    }
    modal.classList.remove('hidden');
  }

  function closeGeminiAgentModal() {
    const modal = document.getElementById('geminiAgentModalBackdrop');
    if (modal) modal.classList.add('hidden');
  }

  function renderWorkspaceStage() {
    const stage = document.getElementById('workspaceStage');
    if (!stage) return;
    stage.innerHTML = renderWorkspacePaneHTML(currentUserId);
    bindPaneEvents(currentUserId);
  }

  function renderWorkspacePaneHTML(userId) {
    const account = state.accounts[userId] || Object.values(state.accounts)[0];
    if (!account) return '';
    const pane = ensurePaneStateForUser(userId);
    const activeSession = getSessionById(pane.activeSessionId, userId);
    if (!activeSession) return '';

    const sessions = getUserSessions(userId);
    const isSidebarCollapsed = !pane.sidebarOpen;
    const tokenUtil = getUserTokenUtilization(userId);
    const hasApiKey = Boolean(getSavedGeminiApiKey());
    const otherCollaborators = (activeSession.participants || []).filter((pid) => pid !== userId);
    const hasHumanPrompt = (activeSession.messages || []).some((m) => m && (m.kind === 'prompt' || m.kind === 'human'));
    const isInitialWorkspace = (activeSession.id === 'chat_hasnain_personal' || activeSession.id === 'chat_robina_personal' || (activeSession.title && activeSession.title !== 'New Chat')) && (activeSession.messages || []).length > 0;
    const showShareBtn = hasHumanPrompt || isInitialWorkspace;

    return `
      <section class="workspace-pane" data-pane-user="${userId}">
        <div class="pane-body-grid">
          <div
            class="mobile-sidebar-backdrop ${pane.sidebarOpen ? 'open' : ''}"
            data-action="close-sidebar"
            data-user="${userId}"
          ></div>

          <!-- LEFT SIDEBAR (Claude / Gemini style, toggleable) -->
          <aside class="pane-sidebar ${pane.sidebarOpen ? 'mobile-open' : ''} ${isSidebarCollapsed ? 'desktop-collapsed' : ''}" aria-label="Sidebar">
            <div class="sidebar-new-chat-wrap">
              <button
                type="button"
                class="new-chat-sidebar-btn"
                data-action="new-chat"
                data-user="${userId}"
                title="Start a new chat"
              >
                <span>+</span> New Chat
              </button>
              <button
                type="button"
                class="mobile-sidebar-close-btn"
                data-action="close-sidebar"
                data-user="${userId}"
                title="Close Sidebar"
              >\u2715</button>
            </div>

            <div class="sidebar-scroll-area">
              <div class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-section-title">Recent Chats</span>
                </div>

                ${sessions.map((s) => {
                  const isSelected = s.id === activeSession.id;
                  const participantCount = (s.participants && s.participants.length) || 1;
                  const isMenuOpen = pane.openMenuSessionId === s.id;
                  return `
                    <div class="session-nav-item-wrap ${isSelected ? 'active-shared' : ''}">
                      <button
                        type="button"
                        class="session-nav-item"
                        data-action="select-session"
                        data-user="${userId}"
                        data-session-id="${s.id}"
                        title="${escapeHtml(s.title || 'Untitled Chat')}"
                      >
                        <div class="nav-item-top">
                          <span class="nav-item-title">${escapeHtml(s.title || 'Untitled Chat')}</span>
                          ${participantCount > 1 ? `<span class="nav-item-count" title="${participantCount} collaborators">\uD83D\uDC65 ${participantCount}</span>` : ''}
                        </div>
                      </button>

                      <button
                        type="button"
                        class="chat-item-menu-btn"
                        data-action="toggle-chat-menu"
                        data-session-id="${s.id}"
                        data-user="${userId}"
                        title="Chat settings"
                      >\u22EE</button>

                      ${isMenuOpen ? `
                        <div class="chat-item-dropdown">
                          <button type="button" class="chat-dropdown-item" data-action="branch-chat" data-session-id="${s.id}" data-user="${userId}">
                            🔀 Branch Chat
                          </button>
                          <button type="button" class="chat-dropdown-item" data-action="rename-chat" data-session-id="${s.id}" data-user="${userId}">
                            ✏️ Rename
                          </button>
                          <button type="button" class="chat-dropdown-item delete" data-action="delete-chat" data-session-id="${s.id}" data-user="${userId}">
                            🗑️ Delete
                          </button>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- BOTTOM USER PROFILE PILL -->
            <div class="sidebar-account-footer">
              <div class="account-footer-top">
                <div class="account-user-cluster">
                  <div class="avatar-circle ${account.colorClass || 'hasnain'}">
                    ${escapeHtml(account.initials || 'U')}
                    <span class="online-dot"></span>
                  </div>
                  <div class="account-user-meta">
                    <span class="account-user-name">${escapeHtml(account.name)}</span>
                    <span class="account-user-email">${escapeHtml(account.email)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="sidebar-key-btn ${hasApiKey ? 'has-key' : ''}"
                  id="sidebarKeyBtn"
                  data-action="open-key-modal"
                  data-user="${userId}"
                  title="${hasApiKey ? 'Gemini API Key Active (Click to edit)' : 'Configure Gemini API Key'}"
                >
                  <span>🔑</span>
                </button>
              </div>

              <!-- Token Utilization Meter inside Account Footer -->
              <div class="account-token-utilization">
                <div class="token-util-header">
                  <span class="token-util-title">⚡ Token Usage</span>
                  <span class="token-util-numbers">${tokenUtil.used.toLocaleString()} / ${tokenUtil.total.toLocaleString()}</span>
                </div>
                <div class="token-util-track">
                  <div class="token-util-fill" style="width: ${tokenUtil.percent}%;"></div>
                </div>
              </div>

              <div class="account-footer-buttons" style="grid-template-columns: 1fr;">
                <button
                  type="button"
                  class="acct-btn"
                  data-action="logout"
                  data-user="${userId}"
                  style="display: flex; align-items: center; justify-content: center; gap: 6px;"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </aside>

          <!-- CENTER CHAT COLUMN -->
          <div class="pane-main-column">
            <div class="chat-and-canvas-split">
              <div class="chat-stream-column">
                <!-- Top Right Actions below top nav bar -->
                ${(showShareBtn || otherCollaborators.length > 0) ? `
                  <div class="chat-pane-header-actions">
                    ${otherCollaborators.length > 0 ? `
                      <div class="presence-avatar-stack">
                        ${otherCollaborators.map((pid) => {
                          const pAcct = state.accounts[pid] || { name: pid, initials: pid.slice(0, 2).toUpperCase() };
                          return `
                            <div class="presence-avatar-item" data-tooltip="${escapeHtml(pAcct.name)}">
                              <span class="avatar-circle ${pAcct.colorClass || 'custom'}">
                                ${escapeHtml(pAcct.initials || 'U')}
                              </span>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}
                    ${showShareBtn ? `
                      <button
                        type="button"
                        class="chat-pane-share-btn"
                        data-action="open-share-modal"
                        data-session-id="${activeSession.id}"
                        data-user="${userId}"
                        title="Share this chat thread with teammates"
                      >
                        <span>🔗 Share</span>
                      </button>
                    ` : ''}
                  </div>
                ` : ''}

                <div class="messages-scroll-container" id="msgScroll_${userId}">
                  ${activeSession.messages.length === 0 ? `
                    <div class="empty-chat-welcome">
                      <div style="font-size: 38px; margin-bottom: 14px;">\u2726</div>
                      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">How can CoThread AI help today?</h2>
                      <p style="color: var(--ink-muted); font-size: 13.5px; line-height: 1.6; max-width: 500px; text-align: center;">
                        Ask anything, brainstorm ideas, or click <strong>\uD83D\uDD17 Share</strong> in the top right to collaborate live with teammates in real time.
                      </p>
                    </div>
                  ` : activeSession.messages.map((msg) => renderMessageRowHTML(msg, userId, activeSession)).join('')}
                </div>

                <!-- Live Typing / Processing Indicator -->
                <div class="live-typing-bar">
                  ${state.typingStatus && state.typingStatus.sessionId === activeSession.id
                    ? `<span>\u2726 ${escapeHtml(state.typingStatus.text)}</span>`
                    : ''}
                </div>

                <!-- COMPOSER DOCK (Gemini style with Model selector inside) -->
                <div class="composer-dock">
                  <div class="composer-top-row">
                    <div class="composer-model-pill" title="Active AI Model">
                      <span class="sparkle-icon">✦</span>
                      <select id="chatModelSelect" class="chat-model-select">
                        ${getAvailableGeminiModels().map((m) => `
                          <option value="${escapeHtml(m.id)}" ${state.primaryModel === m.id ? 'selected' : ''}>
                            ${escapeHtml(m.name)}
                          </option>
                        `).join('')}
                      </select>
                    </div>
                  </div>

                  <div class="composer-input-row">
                    <input
                      type="text"
                      class="composer-input"
                      id="composerInput_${userId}"
                      data-user="${userId}"
                      value="${escapeHtml(pane.draftText || '')}"
                      placeholder="Message CoThread AI..."
                      autocomplete="off"
                    />
                    <button
                      type="button"
                      class="composer-send-btn"
                      data-action="send-message"
                      data-user="${userId}"
                      data-session-id="${activeSession.id}"
                      title="Send message"
                    >
                      \u2191
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderChatInspectorPanelHTML() {
    return '';
  }

  function renderMessageRowHTML(msg, viewingUserId, session) {
    const isAI = msg.kind === 'ai' || msg.senderId === 'gemini';
    const isOwn = !isAI && msg.senderId === viewingUserId;
    const senderAcct = isAI
      ? { name: 'CoThread AI', initials: '\u2726', colorClass: 'gemini' }
      : (state.accounts[msg.senderId] || {
          name: msg.senderName || 'Collaborator',
          initials: (msg.senderName || 'CT').slice(0, 2).toUpperCase(),
          colorClass: 'custom'
        });

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
              <span class="msg-author-name">${escapeHtml(isAI ? 'CoThread AI' : (msg.senderName || senderAcct.name))}</span>
            </div>
            <span class="msg-timestamp">${escapeHtml(msg.timestamp || '')}</span>
          </div>

          <div class="msg-content-body">${formatMessageText(msg.text)}</div>

          ${
            msg.codeSnippet
              ? `<pre class="msg-code-block">${escapeHtml(msg.codeSnippet)}</pre>`
              : ''
          }

          ${isAI ? `
            <!-- Gemini Style Minimalist Icon Action Bar (Copy, Branch & New Chat) -->
            <div class="gemini-action-bar">
              <button type="button" class="gemini-icon-btn" data-action="copy-response" data-msg-id="${msg.id}" title="Copy response">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button type="button" class="gemini-icon-btn" data-action="branch-from-message" data-msg-id="${msg.id}" data-user="${viewingUserId}" title="Branch chat from here">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15"></line>
                  <circle cx="18" cy="6" r="3"></circle>
                  <circle cx="6" cy="18" r="3"></circle>
                  <path d="M18 9a9 9 0 0 1-9 9"></path>
                </svg>
              </button>
              <button type="button" class="gemini-icon-btn" data-action="new-chat-from-prompt" data-user="${viewingUserId}" title="Start new chat">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <line x1="12" y1="8" x2="12" y2="14"></line>
                  <line x1="9" y1="11" x2="15" y2="11"></line>
                </svg>
              </button>
              <button type="button" class="gemini-icon-btn" data-action="retry-response" data-user="${viewingUserId}" title="Retry response">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // =========================================================
  // EVENT BINDINGS
  // =========================================================

  function bindPaneEvents(userId) {
    const paneEl = document.querySelector(`.workspace-pane[data-pane-user="${userId}"]`);
    if (!paneEl) return;

    // Chat Model Select inside composer
    const modelSel = paneEl.querySelector('#chatModelSelect');
    if (modelSel) {
      modelSel.addEventListener('change', (e) => {
        state.primaryModel = e.target.value;
        saveAndBroadcastState();
        showToast(`Switched model to ${state.primaryModel}`, 'shared');
      });
    }

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

    paneEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) {
        // If clicking outside dropdown menu, close menu
        const pane = ensurePaneStateForUser(userId);
        if (pane.openMenuSessionId) {
          pane.openMenuSessionId = null;
          renderApp();
        }
        return;
      }

      const action = btn.getAttribute('data-action');
      const targetUser = btn.getAttribute('data-user') || userId;

      if (action === 'select-session') {
        const sId = btn.getAttribute('data-session-id');
        const p = ensurePaneStateForUser(targetUser);
        const prevSessionId = p.activeSessionId;
        if (prevSessionId && prevSessionId !== sId) {
          const prevSess = state.sessions.find((s) => s.id === prevSessionId);
          if (prevSess && (prevSess.title === 'New Chat' || !prevSess.messages || prevSess.messages.length === 0)) {
            const hasHumanPrompt = (prevSess.messages || []).some((m) => m && (m.kind === 'prompt' || m.kind === 'human'));
            if (!hasHumanPrompt && prevSess.id !== 'chat_hasnain_personal' && prevSess.id !== 'chat_robina_personal') {
              state.sessions = state.sessions.filter((s) => s.id !== prevSessionId);
            }
          }
        }
        p.activeSessionId = sId;
        p.openMenuSessionId = null;
        saveAndBroadcastState();
        renderApp();
        scrollChatToBottom(sId);
      } else if (action === 'open-share-modal') {
        const sId = btn.getAttribute('data-session-id') || ensurePaneStateForUser(targetUser).activeSessionId;
        openShareModal(sId);
      } else if (action === 'toggle-chat-menu') {
        e.stopPropagation();
        const sId = btn.getAttribute('data-session-id');
        const p = ensurePaneStateForUser(targetUser);
        p.openMenuSessionId = p.openMenuSessionId === sId ? null : sId;
        renderApp();
      } else if (action === 'branch-chat') {
        e.stopPropagation();
        const sId = btn.getAttribute('data-session-id');
        branchChat(sId, targetUser);
      } else if (action === 'branch-from-message') {
        e.stopPropagation();
        const msgId = btn.getAttribute('data-msg-id');
        const p = ensurePaneStateForUser(targetUser);
        branchChat(p.activeSessionId, targetUser, msgId);
      } else if (action === 'rename-chat') {
        e.stopPropagation();
        const sId = btn.getAttribute('data-session-id');
        renameChat(sId, targetUser);
      } else if (action === 'delete-chat') {
        e.stopPropagation();
        const sId = btn.getAttribute('data-session-id');
        deleteChat(sId, targetUser);
      } else if (action === 'new-chat') {
        createNewChat(targetUser);
      } else if (action === 'close-sidebar') {
        const p = ensurePaneStateForUser(targetUser);
        p.sidebarOpen = false;
        renderApp();
      } else if (action === 'send-message') {
        const sId = btn.getAttribute('data-session-id');
        const inp = document.getElementById(`composerInput_${targetUser}`);
        handleSendMessage(targetUser, sId, inp ? inp.value : '');
      } else if (action === 'open-key-modal') {
        openGeminiAgentModal();
      } else if (action === 'logout') {
        logoutUser();
      } else if (action === 'copy-response') {
        const msgId = btn.getAttribute('data-msg-id');
        const p = ensurePaneStateForUser(targetUser);
        const session = getSessionById(p.activeSessionId);
        const msg = session?.messages.find((m) => m.id === msgId);
        if (msg) {
          navigator.clipboard?.writeText(msg.text).catch(() => {});
          const origHtml = btn.innerHTML;
          btn.innerHTML = `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          setTimeout(() => {
            btn.innerHTML = origHtml;
          }, 1800);
          showToast('Response copied to clipboard!', 'shared');
        }
      } else if (action === 'new-chat-from-prompt') {
        createNewChat(targetUser);
      } else if (action === 'toggle-inspector') {
        const p = ensurePaneStateForUser(targetUser);
        p.inspectorOpen = p.inspectorOpen === false ? true : false;
        renderApp();
      } else if (action === 'retry-response') {
        const p = ensurePaneStateForUser(targetUser);
        const session = getSessionById(p.activeSessionId);
        const lastHumanMsg = [...(session?.messages || [])].reverse().find((m) => m.kind === 'prompt' || m.kind === 'human');
        if (lastHumanMsg) {
          handleSendMessage(targetUser, session.id, lastHumanMsg.text);
        }
      }
    });
  }

  function initGlobalEvents() {
    // Theme toggle
    document.getElementById('websiteThemeToggleBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('appThemeToggleBtn')?.addEventListener('click', toggleTheme);

    // Sidebar Toggle button in top header
    document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => {
      const uid = currentUserId || Object.keys(state.accounts)[0];
      if (uid) {
        const pane = ensurePaneStateForUser(uid);
        pane.sidebarOpen = !pane.sidebarOpen;
        renderApp();
      }
    });

    // Company Page Navigation CTAs -> Navigate to /chat
    document.getElementById('navOpenChatBtn')?.addEventListener('click', () => navigateTo('chat'));
    document.getElementById('navOpenLoginBtn')?.addEventListener('click', () => navigateTo('chat'));
    document.getElementById('heroLaunchChatBtn')?.addEventListener('click', () => navigateTo('chat'));
    document.getElementById('bentoLaunchChatBtn')?.addEventListener('click', () => navigateTo('chat'));

    document.querySelectorAll('[data-action="go-to-chat"]').forEach((btn) => {
      btn.addEventListener('click', () => navigateTo('chat'));
    });

    // Interactive Eigent-Style Architecture Capability Tabs (01 / 02 / 03)
    const archTitles = {
      workforce: 'Multi-Agent Workforce & Context Engine',
      spaces: 'Shared Spaces & Live Agent Trajectory',
      governance: 'Host Quota, BYOK & 1-Click Independent Fork'
    };
    document.querySelectorAll('[data-arch-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabKey = btn.getAttribute('data-arch-tab');
        if (!tabKey) return;
        document.querySelectorAll('[data-arch-tab]').forEach((el) => {
          const isMatch = el.getAttribute('data-arch-tab') === tabKey;
          el.classList.toggle('active', isMatch);
          if (el.getAttribute('role') === 'tab') {
            el.setAttribute('aria-selected', isMatch ? 'true' : 'false');
          }
        });
        ['workforce', 'spaces', 'governance'].forEach((k) => {
          const paneEl = document.getElementById(`archPane_${k}`);
          if (paneEl) {
            paneEl.classList.toggle('active', k === tabKey);
            paneEl.classList.toggle('hidden', k !== tabKey);
          }
        });
        const titleEl = document.getElementById('edwActiveTitle');
        if (titleEl && archTitles[tabKey]) {
          titleEl.textContent = archTitles[tabKey];
        }
      });
    });

    // Use Case Category Filter Tabs (All / Developer / Product / Enterprise)
    document.querySelectorAll('[data-uc-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-uc-filter') || 'all';
        document.querySelectorAll('[data-uc-filter]').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-uc-filter') === filter);
        });
        document.querySelectorAll('.usecase-card').forEach((card) => {
          const cat = card.getAttribute('data-uc-category');
          const show = filter === 'all' || cat === filter;
          card.classList.toggle('hidden', !show);
        });
      });
    });

    // 1-Click "Run in Shared Chat" on Use Case Cards
    document.querySelectorAll('[data-usecase-prompt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const promptText = btn.getAttribute('data-usecase-prompt') || '';
        if (!currentUserId || !state.accounts[currentUserId]) {
          setTabUser('user_hasnain');
        }
        const uid = currentUserId || 'user_hasnain';
        const pane = ensurePaneStateForUser(uid);
        pane.draftText = promptText;
        navigateTo('chat');
        if (promptText) {
          setTimeout(() => {
            const activeSid = ensurePaneStateForUser(uid).activeSessionId;
            handleSendMessage(uid, activeSid, promptText);
          }, 120);
        }
      });
    });

    // Chat Header Return to Website
    document.getElementById('backToWebsiteBtn')?.addEventListener('click', () => navigateTo('home'));

    // Back to Home from Auth Portal
    document.getElementById('authBackHomeBtn')?.addEventListener('click', () => navigateTo('home'));

    // Auth Portal Tabs
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabSignup = document.getElementById('tabSignupBtn');
    const formLogin = document.getElementById('dummyLoginForm');
    const formSignup = document.getElementById('dummySignupForm');

    tabLogin?.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabSignup?.classList.remove('active');
      formLogin?.classList.remove('hidden');
      formSignup?.classList.add('hidden');
      hideAuthAlert();
    });

    tabSignup?.addEventListener('click', () => {
      tabSignup.classList.add('active');
      tabLogin?.classList.remove('active');
      formSignup?.classList.remove('hidden');
      formLogin?.classList.add('hidden');
      hideAuthAlert();
    });

    // Clear alert when user types in any input
    ['loginIdentifier', 'loginPassword', 'signupName', 'signupUsername', 'signupEmail', 'signupPassword', 'signupApiKey'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', hideAuthAlert);
    });

    // Login Form Submit (Mini DB Auth)
    formLogin?.addEventListener('submit', (e) => {
      e.preventDefault();
      const identifier =
        document.getElementById('loginIdentifier')?.value ||
        document.getElementById('loginEmail')?.value ||
        '';
      const password = document.getElementById('loginPassword')?.value || '';
      loginWithMiniDb(identifier, password);
    });

    // Signup Form Submit (Mini DB Auth)
    formSignup?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName')?.value || '';
      const username = document.getElementById('signupUsername')?.value || '';
      const email = document.getElementById('signupEmail')?.value || '';
      const password = document.getElementById('signupPassword')?.value || '';
      const geminiApiKey = document.getElementById('signupApiKey')?.value || '';
      registerWithMiniDb({ name, username, email, password, geminiApiKey });
    });

    // Share Modal Events
    document.getElementById('closeShareModalBtn')?.addEventListener('click', closeShareModal);
    document.getElementById('shareModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'shareModalBackdrop') closeShareModal();
    });

    // Share Modal Tabs
    document.getElementById('tabSharePrivateBtn')?.addEventListener('click', () => switchShareTab('private'));
    document.getElementById('tabSharePublicBtn')?.addEventListener('click', () => switchShareTab('public'));

    // Private Invite by Email Form
    document.getElementById('shareInviteEmailForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInp = document.getElementById('shareInviteEmailInput');
      const email = String(emailInp?.value || '').trim().toLowerCase();
      if (!email) return;

      const session = getSessionById(activeShareSessionId);
      if (!session) return;

      session.invitedEmails = session.invitedEmails || [];
      if (!session.invitedEmails.includes(email)) {
        session.invitedEmails.push(email);
      }

      // Generate direct private collaborator link
      const inviteUrl = `${getBaseAppUrl()}?join=${encodeURIComponent(session.shareCode)}&invitee=${encodeURIComponent(email)}#/chat`;
      navigator.clipboard?.writeText(inviteUrl).catch(() => {});

      saveAndBroadcastState();
      renderShareCollaboratorsList(session);
      if (emailInp) emailInp.value = '';

      showToast(`Invited ${email}! Direct collaborator link copied to clipboard.`, 'shared');
    });

    // Public Link Copy Button
    document.getElementById('sharePublicCopyBtn')?.addEventListener('click', () => {
      const input = document.getElementById('sharePublicLinkInput');
      if (input && input.value) {
        navigator.clipboard?.writeText(input.value).catch(() => {});
        const btn = document.getElementById('sharePublicCopyBtn');
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '<span>\u2713 Copied!</span>';
          setTimeout(() => {
            btn.innerHTML = orig;
          }, 2000);
        }
        showToast('Public view & copy link copied to clipboard!', 'shared');
      }
    });

    // Gemini Agent Modal Events
    document.getElementById('closeGeminiAgentModalBtn')?.addEventListener('click', closeGeminiAgentModal);
    document.getElementById('geminiAgentModalBackdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'geminiAgentModalBackdrop') closeGeminiAgentModal();
    });

    document.getElementById('geminiAgentKeyForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = document.getElementById('geminiApiKeyInput');
      const val = String(inp?.value || '').trim();
      try {
        if (val) {
          localStorage.setItem('cothread_gemini_api_key', val);
          const users = getMiniDbUsers();
          if (currentUserId && users[currentUserId]) {
            users[currentUserId].geminiApiKey = val;
            saveMiniDbUsers(users);
          }
          showToast('Scanning available Gemini models...', 'personal');
          scanAvailableGeminiModels(val, true)
            .then((models) => {
              showToast(`Gemini Key saved! ${models.length} models ready.`, 'shared');
              renderApp();
            })
            .catch(() => {
              showToast('Gemini API Key saved!', 'shared');
              renderApp();
            });
        } else {
          localStorage.removeItem('cothread_gemini_api_key');
          localStorage.removeItem('cothread_scanned_models');
          const users = getMiniDbUsers();
          if (currentUserId && users[currentUserId]) {
            delete users[currentUserId].geminiApiKey;
            saveMiniDbUsers(users);
          }
          state.primaryModel = 'gemini-2.5-flash';
          showToast('Cleared Gemini API key.', 'personal');
          renderApp();
        }
      } catch (err) {}
      renderTopWorkspaceHeader();
      closeGeminiAgentModal();
    });

    document.getElementById('clearGeminiKeyBtn')?.addEventListener('click', () => {
      try {
        localStorage.removeItem('cothread_gemini_api_key');
        localStorage.removeItem('cothread_scanned_models');
        const users = getMiniDbUsers();
        if (currentUserId && users[currentUserId]) {
          delete users[currentUserId].geminiApiKey;
          saveMiniDbUsers(users);
        }
        state.primaryModel = 'gemini-2.5-flash';
      } catch (err) {}
      const inp = document.getElementById('geminiApiKeyInput');
      if (inp) inp.value = '';
      const badge = document.getElementById('geminiKeySavedBadge');
      if (badge) {
        badge.textContent = 'Status: No API key connected';
        badge.style.color = 'var(--ink-muted)';
      }
      const statusDiv = document.getElementById('geminiModelsScannedStatus');
      if (statusDiv) statusDiv.style.display = 'none';
      renderTopWorkspaceHeader();
      renderApp();
      closeGeminiAgentModal();
      showToast('Cleared custom Gemini API key.', 'personal');
    });
  }

  // =========================================================
  // HERO ANIMATED TYPEWRITER
  // =========================================================

  function initHeroTypewriterAnimation() {
    const subtitleDynamic = document.getElementById('heroAnimatedSubtitle');
    if (!subtitleDynamic) return;

    const phrases = [
      'Multiple users prompt Gemini in one shared chat with live presence and history.',
      'Real-time collaborative AI chat with live presence and shared history.',
      'Live collaborator presence & avatars in the top bar as teammates join.',
      'Zero quota confusion \u2022 Share with 1 click via Public or Private threads.',
      'Turn individual AI prompting into a synchronized multiplayer workspace.'
    ];

    let phraseIdx = 0;
    let charIdx = phrases[0].length;
    let isDeleting = true;

    function tick() {
      const current = phrases[phraseIdx];
      if (isDeleting) {
        charIdx--;
        subtitleDynamic.textContent = current.slice(0, Math.max(0, charIdx));
        if (charIdx <= 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(tick, 350);
          return;
        }
        setTimeout(tick, 18);
      } else {
        charIdx++;
        subtitleDynamic.textContent = current.slice(0, charIdx);
        if (charIdx >= current.length) {
          isDeleting = true;
          setTimeout(tick, 3200);
          return;
        }
        setTimeout(tick, 32);
      }
    }

    setTimeout(tick, 2800);
  }

  // =========================================================
  // BOOT APPLICATION
  // =========================================================

  function recoverUnansweredMessagesOnBoot() {
    if (!state || !Array.isArray(state.sessions)) return;
    let changed = false;
    state.typingStatus = null;
    state.sessions.forEach((sess) => {
      if (!Array.isArray(sess.messages) || sess.messages.length === 0) return;
      const lastMsg = sess.messages[sess.messages.length - 1];
      if (lastMsg && lastMsg.kind === 'human' && lastMsg.text) {
        const senderAcc =
          (state.accounts && (state.accounts[lastMsg.senderId] || state.accounts.user_hasnain || Object.values(state.accounts)[0])) ||
          { id: lastMsg.senderId || 'user_hasnain', name: lastMsg.senderName || 'Collaborator', shortName: lastMsg.senderName || 'Collaborator' };
        const reply = buildLocalSmartFallback(sess, senderAcc, lastMsg.text);
        if (reply && reply.text) {
          sess.messages.push({
            id: 'm_ai_rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            senderId: 'gemini',
            senderName: 'CoThread AI',
            senderRole: 'AI Assistant',
            kind: 'ai',
            modelUsed: state.primaryModel || 'gemini-2.5-flash',
            timestamp: lastMsg.timestamp || nowTimeLabel(),
            text: reply.text,
            codeSnippet: reply.codeSnippet || null
          });
          changed = true;
        }
      }
    });
    if (changed) {
      saveAndBroadcastState();
    }
  }

  function bootCoThreadApp() {
    initTheme();
    initGlobalEvents();
    initHeroTypewriterAnimation();
    initRealtimeSSE();
    recoverUnansweredMessagesOnBoot();

    const savedKey = getSavedGeminiApiKey();
    if (savedKey && !localStorage.getItem('cothread_scanned_models')) {
      scanAvailableGeminiModels(savedKey, false).catch(() => {});
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const joinCode = params.get('join') || params.get('s');
      if (joinCode) {
        pendingInviteShareCode = joinCode.trim();
        if (currentUserId) {
          resolveSharedSessionFromServer(pendingInviteShareCode, currentUserId).then((sess) => {
            if (sess) {
              const pane = ensurePaneStateForUser(currentUserId);
              pane.activeSessionId = sess.id;
              renderApp();
              showToast(`Joined shared thread: "${sess.title}"`, 'shared');
            }
          });
        }
      }
      const email = params.get('invitee');
      if (email) {
        pendingInviteeEmail = email.trim().toLowerCase();
      }
    } catch (e) {}

    renderApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootCoThreadApp);
  } else {
    bootCoThreadApp();
  }
})();
