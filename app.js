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

  const STORAGE_KEY = 'cothread_chat_state_v22';
  const TAB_AUTH_KEY = 'cothread_active_user_v22';
  const THEME_KEY = 'cothread_theme_v22';
  const CHANNEL_NAME = 'cothread_realtime_v22';

  // Seed Default Accounts
  const DEFAULT_ACCOUNTS = {
    user_hasnain: {
      id: 'user_hasnain',
      name: 'Muhammad Hasnain',
      shortName: 'Hasnain',
      email: 'hasnain@cothread.ai',
      initials: 'MH',
      colorClass: 'hasnain'
    },
    user_sarah: {
      id: 'user_sarah',
      name: 'Sarah Chen',
      shortName: 'Sarah',
      email: 'sarah@cothread.ai',
      initials: 'SC',
      colorClass: 'sarah'
    },
    user_alex: {
      id: 'user_alex',
      name: 'Alex Rivera',
      shortName: 'Alex',
      email: 'alex@cothread.ai',
      initials: 'AR',
      colorClass: 'alex'
    }
  };

  function nowTimeLabel() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function createDefaultState() {
    return {
      primaryModel: 'gemini-3.8-flash',
      typingStatus: null,
      accounts: { ...DEFAULT_ACCOUNTS },
      paneState: {},
      sessions: [
        {
          id: 'chat_welcome',
          type: 'shared',
          title: 'General AI Chat',
          hostId: 'user_hasnain',
          shareCode: 'cothread-team-chat',
          participants: ['user_hasnain', 'user_sarah'],
          invitedEmails: ['sarah@cothread.ai'],
          messages: [
            {
              id: 'm_welcome',
              senderId: 'gemini',
              senderName: 'CoThread AI',
              senderRole: 'AI Assistant',
              kind: 'ai',
              timestamp: nowTimeLabel(),
              text: `Welcome to **CoThread**! \u2726\n\nThis is a real-time collaborative AI chat:\n\n\u2022 **Share this chat**: Click **\uD83D\uDD17 Share** in the top right to invite teammates privately or create a public link.\n\u2022 **Multiplayer presence**: When someone joins, their avatar immediately appears in the top right presence stack.\n\u2022 **Shared context**: Anyone in the chat can send prompts, and everyone sees who asked what with their name and avatar.`
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

  window.addEventListener('popstate', () => {
    renderApp();
  });

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.accounts && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          parsed.accounts = { ...DEFAULT_ACCOUNTS, ...parsed.accounts };
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
          return parsed;
        }
      }
    } catch (e) {}
    return createDefaultState();
  }

  function loadTabUser() {
    try {
      const saved = sessionStorage.getItem(TAB_AUTH_KEY);
      if (saved && state.accounts[saved]) {
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
      const persistedState = { ...state, typingStatus: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
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

  function getSessionById(sessionId) {
    return state.sessions.find((s) => s.id === sessionId) || state.sessions[0] || null;
  }

  function ensurePaneStateForUser(userId) {
    if (!state.paneState[userId]) {
      const defaultSess =
        state.sessions.find((s) => s.participants && s.participants.includes(userId)) ||
        state.sessions[0];
      state.paneState[userId] = {
        activeSessionId: defaultSess ? defaultSess.id : null,
        sidebarOpen: true,
        openMenuSessionId: null,
        draftText: ''
      };
    } else if (!state.paneState[userId].activeSessionId && state.sessions.length > 0) {
      state.paneState[userId].activeSessionId = state.sessions[0].id;
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
  // AUTHENTICATION & LOGIN/SIGNUP
  // =========================================================

  function loginOrRegisterUser(name, email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) return;

    let account = Object.values(state.accounts).find(
      (a) => a.email.toLowerCase() === cleanEmail
    );

    if (!account) {
      const cleanName = String(name || cleanEmail.split('@')[0]).trim();
      const parts = cleanName.split(/\s+/);
      const shortName = parts[0] || 'User';
      const initials = parts
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const newId = 'user_' + cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 10) + '_' + Math.random().toString(36).slice(2, 5);

      const colorClasses = ['hasnain', 'sarah', 'alex', 'custom'];
      const chosenColor = colorClasses[Object.keys(state.accounts).length % colorClasses.length];

      account = {
        id: newId,
        name: cleanName,
        shortName,
        email: cleanEmail,
        initials: initials || 'U',
        colorClass: chosenColor
      };
      state.accounts[newId] = account;
    }

    setTabUser(account.id);
    ensurePaneStateForUser(account.id);

    // If invited to a specific chat, auto-join it
    if (pendingInviteShareCode) {
      const invitedSession = findSessionByShareCode(pendingInviteShareCode);
      if (invitedSession) {
        if (!invitedSession.participants.includes(account.id)) {
          invitedSession.participants.push(account.id);
        }
        state.paneState[account.id].activeSessionId = invitedSession.id;
        showToast(`Joined chat: "${invitedSession.title}"!`, 'shared');
      }
      pendingInviteShareCode = null;
      pendingInviteeEmail = null;
    }

    saveAndBroadcastState();
    navigateTo('chat');
    showToast(`Logged in as ${account.name}`, 'shared');
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
    const pane = ensurePaneStateForUser(userId);
    pane.activeSessionId = newId;
    pane.openMenuSessionId = null;
    saveAndBroadcastState();
    renderApp();
    showToast('Created new chat!', 'shared');
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
    const session = getSessionById(sessionId);
    if (!session) return;
    if (!confirm(`Delete "${session.title}"?`)) return;

    state.sessions = state.sessions.filter((s) => s.id !== sessionId);

    if (state.sessions.length === 0) {
      createNewChat(userId);
      return;
    }

    const pane = ensurePaneStateForUser(userId);
    if (pane.activeSessionId === sessionId) {
      pane.activeSessionId = state.sessions[0].id;
    }
    pane.openMenuSessionId = null;
    saveAndBroadcastState();
    renderApp();
    showToast('Chat deleted.', 'personal');
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
      modelUsed: state.primaryModel || 'gemini-3.8-flash',
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
  }

  function getSavedGeminiApiKey() {
    try {
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
          resolvedModel: state.primaryModel || 'gemini-3.8-flash',
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

    // 1. Try server backend endpoint if available (not on static github.io)
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
            model: state.primaryModel || 'gemini-3.8-flash'
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

    // 2. Call universal GeminiService engine (calls live Gemini /v1beta/interactions when API key is present)
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
          model: state.primaryModel || 'gemini-3.8-flash'
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

    // 3. Smart fallback response (Architecture Diagram / Code / Context-aware)
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

    // 1. Update Title in Top Header
    const titleEl = document.getElementById('headerChatTitle');
    if (titleEl) {
      titleEl.textContent = activeSession.title || 'New Chat';
      titleEl.title = activeSession.title || 'New Chat';
    }

    // 2. Render Collaborators Presence Avatars Stack (FILTER OUT CURRENT USER!)
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

    // 3. Wire Share Button & Gemini Agent Button in Top Right
    const shareBtn = document.getElementById('headerShareBtn');
    if (shareBtn) {
      shareBtn.onclick = () => openShareModal(activeSession.id);
    }

    const geminiBtn = document.getElementById('headerGeminiKeyBtn');
    const geminiStatusEl = document.getElementById('headerGeminiKeyStatus');
    const hasCustomKey = Boolean(getSavedGeminiApiKey());
    if (geminiStatusEl) {
      geminiStatusEl.textContent = hasCustomKey ? '\u2726 Gemini Agent (Key Active)' : '\u2726 Gemini Agent';
    }
    if (geminiBtn) {
      geminiBtn.onclick = () => openGeminiAgentModal();
    }
  }

  function openGeminiAgentModal() {
    const modal = document.getElementById('geminiAgentModalBackdrop');
    if (!modal) return;
    const keyInp = document.getElementById('geminiApiKeyInput');
    const badge = document.getElementById('geminiKeySavedBadge');
    const saved = getSavedGeminiApiKey();
    if (keyInp) {
      keyInp.value = saved;
    }
    if (badge) {
      badge.textContent = saved
        ? 'Status: Connected to Live Gemini API Key (' + saved.slice(0, 6) + '...)'
        : 'Status: Using CoThread ADK Collaborative Agent';
      badge.style.color = saved ? 'var(--accent-emerald)' : 'var(--ink-muted)';
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
    const activeSession = getSessionById(pane.activeSessionId);
    if (!activeSession) return '';

    const sessions = state.sessions;
    const isSidebarCollapsed = !pane.sidebarOpen;

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
                          <button type="button" class="chat-dropdown-item" data-action="rename-chat" data-session-id="${s.id}" data-user="${userId}">
                            \u270F\uFE0F Rename
                          </button>
                          <button type="button" class="chat-dropdown-item delete" data-action="delete-chat" data-session-id="${s.id}" data-user="${userId}">
                            \uD83D\uDDD1\uFE0F Delete
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
                    <!-- Model Selector inside Chat Box like Gemini -->
                    <div class="composer-model-pill" title="Active AI Model">
                      <span class="sparkle-icon">\u2726</span>
                      <select id="chatModelSelect" class="chat-model-select">
                        <option value="gemini-3.8-flash" ${state.primaryModel === 'gemini-3.8-flash' ? 'selected' : ''}>Gemini 3.8 Flash</option>
                        <option value="gemini-4-argon" ${state.primaryModel === 'gemini-4-argon' ? 'selected' : ''}>Gemini 4 Argon</option>
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
            <!-- Gemini Style Minimalist Icon Action Bar (Copy & New Chat) -->
            <div class="gemini-action-bar">
              <button type="button" class="gemini-icon-btn" data-action="copy-response" data-msg-id="${msg.id}" title="Copy response">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
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
        p.activeSessionId = sId;
        p.openMenuSessionId = null;
        saveAndBroadcastState();
        renderApp();
        scrollChatToBottom(sId);
      } else if (action === 'toggle-chat-menu') {
        e.stopPropagation();
        const sId = btn.getAttribute('data-session-id');
        const p = ensurePaneStateForUser(targetUser);
        p.openMenuSessionId = p.openMenuSessionId === sId ? null : sId;
        renderApp();
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
      } else if (action === 'retry-response') {
        const p = ensurePaneStateForUser(targetUser);
        const session = getSessionById(p.activeSessionId);
        const lastHumanMsg = [...(session?.messages || [])].reverse().find((m) => m.kind === 'prompt');
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

    // Chat Header Return to Website
    document.getElementById('backToWebsiteBtn')?.addEventListener('click', () => navigateTo('home'));

    // Back to Home from Auth Portal
    document.getElementById('authBackHomeBtn')?.addEventListener('click', () => navigateTo('home'));

    // Dummy Auth Portal Tabs
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabSignup = document.getElementById('tabSignupBtn');
    const formLogin = document.getElementById('dummyLoginForm');
    const formSignup = document.getElementById('dummySignupForm');

    tabLogin?.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabSignup?.classList.remove('active');
      formLogin?.classList.remove('hidden');
      formSignup?.classList.add('hidden');
    });

    tabSignup?.addEventListener('click', () => {
      tabSignup.classList.add('active');
      tabLogin?.classList.remove('active');
      formSignup?.classList.remove('hidden');
      formLogin?.classList.add('hidden');
    });

    // Login Form Submit
    formLogin?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value;
      if (email) loginOrRegisterUser('', email);
    });

    // Signup Form Submit
    formSignup?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName')?.value;
      const email = document.getElementById('signupEmail')?.value;
      if (email) loginOrRegisterUser(name, email);
    });

    // 1-Click Quick Test Personas
    document.querySelectorAll('.quick-profile-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-test-name');
        const email = btn.getAttribute('data-test-email');
        if (email) loginOrRegisterUser(name, email);
      });
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
          showToast('Gemini API Key saved for live Chat Agent!', 'shared');
        } else {
          localStorage.removeItem('cothread_gemini_api_key');
          showToast('Cleared custom Gemini API key.', 'personal');
        }
      } catch (err) {}
      renderTopWorkspaceHeader();
      closeGeminiAgentModal();
    });

    document.getElementById('clearGeminiKeyBtn')?.addEventListener('click', () => {
      try {
        localStorage.removeItem('cothread_gemini_api_key');
      } catch (err) {}
      const inp = document.getElementById('geminiApiKeyInput');
      if (inp) inp.value = '';
      renderTopWorkspaceHeader();
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
          (state.accounts && state.accounts[lastMsg.senderId]) ||
          DEFAULT_ACCOUNTS.hasnain ||
          { id: lastMsg.senderId || 'hasnain', name: lastMsg.senderName || 'Collaborator', shortName: lastMsg.senderName || 'Collaborator' };
        const reply = buildLocalSmartFallback(sess, senderAcc, lastMsg.text);
        if (reply && reply.text) {
          sess.messages.push({
            id: 'm_ai_rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            senderId: 'gemini',
            senderName: 'CoThread AI',
            senderRole: 'AI Assistant',
            kind: 'ai',
            modelUsed: state.primaryModel || 'gemini-3.8-flash',
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
    recoverUnansweredMessagesOnBoot();

    try {
      const params = new URLSearchParams(window.location.search);
      const joinCode = params.get('join') || params.get('s');
      if (joinCode) {
        pendingInviteShareCode = joinCode.trim();
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
