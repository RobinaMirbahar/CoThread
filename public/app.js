/**
 * CoThread — Standard Gemini / Claude Style Collaborative AI Chat Portal
 * Features:
 * 1. Google Docs-style live presence in top bar (avatars of who joined the chat)
 * 2. Multi-user shared chat: prompts show sender's name and avatar
 * 3. Dummy Login & Signup portal with 1-click test personas (Hasnain, Sarah, Alex)
 * 4. 1-Click Share: copies join link; anyone opening it joins with live presence
 * 5. Cross-tab real-time sync via BroadcastChannel & LocalStorage
 * 6. Clean Gemini / Claude chat portal UI with zero marketing or quota clutter
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cothread_chat_state_v20';
  const TAB_AUTH_KEY = 'cothread_active_user_v20';
  const THEME_KEY = 'cothread_theme_v20';
  const CHANNEL_NAME = 'cothread_realtime_v20';

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
          messages: [
            {
              id: 'm_welcome',
              senderId: 'gemini',
              senderName: 'CoThread AI',
              senderRole: 'AI Assistant',
              kind: 'ai',
              timestamp: nowTimeLabel(),
              text: `Welcome to **CoThread**! ✦\n\nThis is a real-time collaborative AI chat — like **Google Docs for AI**:\n\n• **Share this chat**: Click **🔗 Share** in the top bar to copy the invite link.\n• **Multiplayer presence**: When a collaborator opens the link, their avatar immediately appears in the top bar presence stack.\n• **Shared context**: Anyone in the chat can send prompts, and everyone sees who asked what with their name and avatar.`
            }
          ]
        }
      ]
    };
  }

  let state = loadState();
  let currentUserId = loadTabUser();
  let pendingInviteShareCode = detectSublinkShareCode();

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
    const appIcon = document.getElementById('appThemeIcon');
    if (appIcon) appIcon.textContent = clean === 'light' ? '☀️' : '🌙';
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
          pulseSyncBadge('Synced Live');
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

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.accounts && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          // Ensure default accounts exist
          parsed.accounts = { ...DEFAULT_ACCOUNTS, ...parsed.accounts };
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
        mobileSidebarOpen: false,
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

  function pulseSyncBadge(text) {
    const el = document.getElementById('syncStatusText');
    if (!el) return;
    el.textContent = text || 'Live Sync';
    setTimeout(() => {
      if (el) el.textContent = 'Live Sync';
    }, 2200);
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
    }

    saveAndBroadcastState();
    renderApp();
    showToast(`Logged in as ${account.name}`, 'shared');
  }

  function logoutUser() {
    setTabUser(null);
    renderApp();
    showToast('Signed out.', 'personal');
  }

  // =========================================================
  // CHAT ACTIONS: NEW CHAT, SEND MESSAGE, SHARE
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
      messages: []
    };

    state.sessions.unshift(newSession);
    ensurePaneStateForUser(userId).activeSessionId = newId;
    saveAndBroadcastState();
    renderApp();
    showToast('Created new chat!', 'shared');
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
      session.title = text.length > 32 ? text.slice(0, 32) + '...' : text;
    }

    // Ensure current user is registered in session participants
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

    // Synthesize Gemini AI reply
    const aiReply = await synthesizeCoThreadAIResponse(session, account, text);

    state.typingStatus = null;

    const aiMsg = {
      id: 'm_ai_' + Date.now(),
      senderId: 'gemini',
      senderName: 'CoThread AI',
      senderRole: 'AI Assistant',
      kind: 'ai',
      modelUsed: state.primaryModel || 'gemini-3.8-flash',
      timestamp: nowTimeLabel(),
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

    // 1. Try server backend endpoint if available
    if (window.location.protocol.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(`/api/sessions/${encodeURIComponent(session.id)}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: triggeringAccount.id,
            senderId: triggeringAccount.id,
            content: cleanPrompt,
            text: cleanPrompt,
            isAiPrompt: true,
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
              codeSnippet: aiMsg.codeSnippet || null
            };
          }
        }
      } catch (e) {}
    }

    // 2. Try universal GeminiService engine
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
          model: state.primaryModel || 'gemini-3.8-flash'
        });

        if (result && (result.cleanText || result.text)) {
          return {
            text: result.cleanText || result.text,
            codeSnippet: result.codeSnippet || null
          };
        }
      } catch (e) {}
    }

    // 3. Realistic intelligent collaborative fallback response
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      text: `Hello ${triggeringAccount.shortName}! I received your prompt: "${cleanPrompt}".\n\nSince this is a shared CoThread conversation, all participants in this chat (${(session.participants || []).map((p) => state.accounts[p]?.shortName || p).join(', ')}) share this exact AI context. Feel free to continue chatting together!`,
      codeSnippet: cleanPrompt.toLowerCase().includes('code') || cleanPrompt.toLowerCase().includes('script')
        ? `// Collaborative CoThread Snippet\nconsole.log("Shared context active for:", "${triggeringAccount.name}");`
        : null
    };
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
  // RENDERING: AUTH PORTAL vs GEMINI/CLAUDE CHAT PORTAL
  // =========================================================

  function renderApp() {
    const authPortal = document.getElementById('authPortal');
    const appShell = document.getElementById('appShell');

    if (!currentUserId || !state.accounts[currentUserId]) {
      if (authPortal) authPortal.classList.remove('hidden');
      if (appShell) appShell.classList.add('hidden');

      // Check if there is an invite banner to display
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
      return;
    }

    if (authPortal) authPortal.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');

    // Auto-join pending chat if logged in
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
      saveAndBroadcastState();
    }

    renderWorkspaceStage();
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

    // List all sessions accessible
    const sessions = state.sessions;

    return `
      <section class="workspace-pane" data-pane-user="${userId}">
        <div class="pane-body-grid">
          <div
            class="mobile-sidebar-backdrop ${pane.mobileSidebarOpen ? 'open' : ''}"
            data-action="close-mobile-sidebar"
            data-user="${userId}"
          ></div>

          <!-- LEFT SIDEBAR (Claude / Gemini style) -->
          <aside class="pane-sidebar ${pane.mobileSidebarOpen ? 'mobile-open' : ''}" aria-label="Sidebar">
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
                data-action="close-mobile-sidebar"
                data-user="${userId}"
                title="Close Sidebar"
              >✕</button>
            </div>

            <div class="sidebar-scroll-area">
              <div class="sidebar-section">
                <div class="sidebar-section-header">
                  <span class="sidebar-section-title">Recent Chats</span>
                </div>

                ${sessions.map((s) => {
                  const isSelected = s.id === activeSession.id;
                  const participantCount = (s.participants && s.participants.length) || 1;
                  return `
                    <button
                      type="button"
                      class="session-nav-item ${isSelected ? 'active-shared' : ''}"
                      data-action="select-session"
                      data-user="${userId}"
                      data-session-id="${s.id}"
                    >
                      <div class="nav-item-top">
                        <span class="nav-item-title">${escapeHtml(s.title || 'Untitled Chat')}</span>
                        ${participantCount > 1 ? `<span class="nav-item-count" title="${participantCount} collaborators">👥 ${participantCount}</span>` : ''}
                      </div>
                    </button>
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
            <!-- TOP NAVBAR (Google Docs style presence) -->
            <header class="session-docs-header">
              <div class="session-header-top-row">
                <div class="session-title-cluster">
                  <button
                    type="button"
                    class="hdr-btn mobile-sidebar-toggle-btn"
                    data-action="toggle-mobile-sidebar"
                    data-user="${userId}"
                    title="Toggle Chats Sidebar"
                  >
                    <span>☰ Chats</span>
                  </button>
                  <h1 class="session-title-heading" title="${escapeHtml(activeSession.title)}">
                    ${escapeHtml(activeSession.title)}
                  </h1>
                </div>

                <div class="session-header-actions docs-presence-bar">
                  <!-- Google Docs Presence Avatars Stack -->
                  <div class="presence-avatar-stack" title="Collaborators in this chat">
                    ${(activeSession.participants || [userId]).map((pid) => {
                      const pAcct = state.accounts[pid] || {
                        name: 'Collaborator',
                        email: '',
                        initials: 'CT',
                        colorClass: 'custom'
                      };
                      const isYou = pid === userId;
                      const tooltip = `${escapeHtml(pAcct.name)}${isYou ? ' (You)' : ''}${pAcct.email ? ` • ${escapeHtml(pAcct.email)}` : ''}`;
                      return `
                        <div class="presence-avatar-item" data-tooltip="${tooltip}">
                          <span class="avatar-circle ${pAcct.colorClass || 'custom'}">
                            ${escapeHtml(pAcct.initials || 'U')}
                          </span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Share Chat Button -->
                  <button
                    type="button"
                    class="share-chat-action-btn"
                    data-action="quick-share"
                    data-session-id="${activeSession.id}"
                    title="Share this chat link with others to collaborate live"
                  >
                    <span>🔗 Share</span>
                  </button>
                </div>
              </div>
            </header>

            <div class="chat-and-canvas-split">
              <div class="chat-stream-column">
                <div class="messages-scroll-container" id="msgScroll_${userId}">
                  ${activeSession.messages.length === 0 ? `
                    <div class="empty-chat-welcome" style="text-align: center; margin: auto; padding: 50px 20px; max-width: 540px;">
                      <div style="font-size: 38px; margin-bottom: 14px;">✦</div>
                      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">How can CoThread AI help today?</h2>
                      <p style="color: var(--ink-muted); font-size: 13.5px; line-height: 1.6;">
                        Ask a question, brainstorm ideas, or share this chat link with your teammates using the <strong>🔗 Share</strong> button to collaborate together in real time like Google Docs.
                      </p>
                    </div>
                  ` : activeSession.messages.map((msg) => renderMessageRowHTML(msg, userId, activeSession)).join('')}
                </div>

                <!-- Live Typing / Processing Indicator -->
                <div class="live-typing-bar">
                  ${state.typingStatus && state.typingStatus.sessionId === activeSession.id
                    ? `<span>✦ ${escapeHtml(state.typingStatus.text)}</span>`
                    : ''}
                </div>

                <!-- COMPOSER DOCK (Claude / Gemini style) -->
                <div class="composer-dock">
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
                      ↑
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
      ? { name: 'CoThread AI', initials: '✦', colorClass: 'gemini' }
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
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const targetUser = btn.getAttribute('data-user') || userId;

      if (action === 'select-session') {
        const sId = btn.getAttribute('data-session-id');
        const p = ensurePaneStateForUser(targetUser);
        p.activeSessionId = sId;
        p.mobileSidebarOpen = false;
        saveAndBroadcastState();
        renderApp();
        scrollChatToBottom(sId);
      } else if (action === 'new-chat') {
        createNewChat(targetUser);
      } else if (action === 'toggle-mobile-sidebar') {
        const p = ensurePaneStateForUser(targetUser);
        p.mobileSidebarOpen = !p.mobileSidebarOpen;
        renderApp();
      } else if (action === 'close-mobile-sidebar') {
        const p = ensurePaneStateForUser(targetUser);
        p.mobileSidebarOpen = false;
        renderApp();
      } else if (action === 'send-message') {
        const sId = btn.getAttribute('data-session-id');
        const inp = document.getElementById(`composerInput_${targetUser}`);
        handleSendMessage(targetUser, sId, inp ? inp.value : '');
      } else if (action === 'logout') {
        logoutUser();
      } else if (action === 'quick-share') {
        const sId = btn.getAttribute('data-session-id');
        const session = getSessionById(sId);
        if (session) {
          const shareUrl = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(session.shareCode)}`;
          navigator.clipboard?.writeText(shareUrl).catch(() => {});
          const origHtml = btn.innerHTML;
          btn.innerHTML = '<span>✓ Copied!</span>';
          setTimeout(() => {
            btn.innerHTML = origHtml;
          }, 2000);
          showToast('Chat link copied! Anyone with the link will join with live presence.', 'shared');
        }
      }
    });
  }

  function initGlobalEvents() {
    // Theme toggle
    document.getElementById('appThemeToggleBtn')?.addEventListener('click', toggleTheme);

    // Header Model Select
    document.getElementById('headerModelSelect')?.addEventListener('change', (e) => {
      state.primaryModel = e.target.value;
      saveAndBroadcastState();
      showToast(`Model set to ${state.primaryModel}`, 'shared');
    });

    // Return to sign in / brand link
    document.getElementById('backToWebsiteBtn')?.addEventListener('click', () => {
      logoutUser();
    });

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
  }

  // =========================================================
  // BOOT APPLICATION
  // =========================================================

  function bootCoThreadApp() {
    initTheme();
    initGlobalEvents();

    // Check URL parameters for invites
    try {
      const params = new URLSearchParams(window.location.search);
      const joinCode = params.get('join') || params.get('s');
      if (joinCode) {
        pendingInviteShareCode = joinCode.trim();
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
