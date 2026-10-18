/**
 * CoThread — Cloud Firestore Persistence Layer
 * ============================================
 * Manages persistent storage across three dedicated Cloud Firestore tables/collections:
 *   1. `users`         — User accounts, credentials, roles, and profile metadata
 *   2. `chat_history`  — Per-user personal & shared multiplayer chat sessions and messages
 *   3. `user_settings` — Per-user settings (theme, selected Gemini model, custom API key, scanned models, active session)
 *
 * Works seamlessly in two modes:
 *   - Google Cloud Firestore Native (`@google-cloud/firestore` via Cloud Run ADC / Service Account)
 *   - Local JSON Snapshot (`data/cothread-firestore-db.json`) for zero-config local development and offline fallback
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'cothread-firestore-db.json');

const DEFAULT_SEED_USERS = {
  user_hasnain: {
    id: 'user_hasnain',
    name: 'Hasnain KK',
    shortName: 'Hasnain',
    username: 'HasnainKK',
    email: 'rashidhasnain0601@gmail.com',
    password: 'admin123',
    initials: 'HK',
    role: 'Original Idea, Co-Builder & Collaborator',
    colorClass: 'hasnain',
    createdAt: '2026-10-14T00:00:00.000Z',
    updatedAt: new Date().toISOString()
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
    colorClass: 'robina',
    createdAt: '2026-10-14T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
};

const DEFAULT_SEED_SETTINGS = {
  user_hasnain: {
    userId: 'user_hasnain',
    theme: 'light',
    primaryModel: 'gemini-2.5-flash',
    geminiApiKey: '',
    scannedModels: [],
    sidebarOpen: false,
    activeSessionId: 'chat_hasnain_personal',
    updatedAt: new Date().toISOString()
  },
  user_robina: {
    userId: 'user_robina',
    theme: 'light',
    primaryModel: 'gemini-2.5-flash',
    geminiApiKey: '',
    scannedModels: [],
    sidebarOpen: false,
    activeSessionId: 'chat_robina_personal',
    updatedAt: new Date().toISOString()
  }
};

function createDefaultChatHistory() {
  const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return [
    {
      id: 'chat_hasnain_personal',
      type: 'personal',
      title: "Hasnain's AI Workspace",
      hostId: 'user_hasnain',
      shareCode: 'hasnain-workspace',
      participants: ['user_hasnain'],
      invitedEmails: ['rashidhasnain0601@gmail.com'],
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'm_hasnain_welcome',
          senderId: 'gemini',
          senderName: 'CoThread AI',
          senderRole: 'AI Assistant',
          kind: 'ai',
          timestamp: nowLabel,
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
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'm_robina_welcome',
          senderId: 'gemini',
          senderName: 'CoThread AI',
          senderRole: 'AI Assistant',
          kind: 'ai',
          timestamp: nowLabel,
          text: `Welcome to **CoThread**, **Robina Mirbahar**! ✦\n\nYour personal architecture workspace is ready.`
        }
      ]
    }
  ];
}

class CoThreadFirestoreDB {
  constructor() {
    this.projectId =
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCP_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      'gen-lang-client-0234999945';
    this.databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
    this.firestoreClient = null;
    this.mode = 'local-firestore-json';
    this.hydrated = false;

    // In-memory tables backed by Cloud Firestore + JSON snapshot
    this.tables = {
      users: { ...DEFAULT_SEED_USERS },
      chat_history: createDefaultChatHistory(),
      user_settings: { ...DEFAULT_SEED_SETTINGS }
    };

    this._init();
  }

  _init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (_) {}

    // Load local snapshot first for instant availability
    this._loadLocalTables();

    // Initialize @google-cloud/firestore when deployed on Cloud Run or when credentials are configured
    if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.K_SERVICE ||
      process.env.ENABLE_CLOUD_FIRESTORE === 'true'
    ) {
      try {
        const { Firestore } = require('@google-cloud/firestore');
        this.firestoreClient = new Firestore({
          projectId: this.projectId,
          databaseId: this.databaseId,
          ignoreUndefinedProperties: true
        });
        this.mode = 'google-cloud-firestore';
        // Asynchronously hydrate from Cloud Firestore
        this.hydrateFromCloudFirestore().catch((err) => {
          console.warn('[CoThreadFirestoreDB] Cloud Firestore hydration warning:', err.message);
        });
      } catch (_) {
        this.mode = 'local-firestore-json';
      }
    }
  }

  _loadLocalTables() {
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.tables) {
          if (parsed.tables.users && typeof parsed.tables.users === 'object') {
            this.tables.users = { ...DEFAULT_SEED_USERS, ...parsed.tables.users };
          }
          if (Array.isArray(parsed.tables.chat_history) && parsed.tables.chat_history.length > 0) {
            this.tables.chat_history = parsed.tables.chat_history;
          }
          if (parsed.tables.user_settings && typeof parsed.tables.user_settings === 'object') {
            this.tables.user_settings = { ...DEFAULT_SEED_SETTINGS, ...parsed.tables.user_settings };
          }
        }
      }
    } catch (_) {}
  }

  _saveLocalTables(legacyState = null) {
    try {
      const payload = {
        _meta: {
          engine: 'CoThread Cloud Firestore Persistence',
          projectId: this.projectId,
          databaseId: this.databaseId,
          mode: this.mode,
          collections: ['users', 'chat_history', 'user_settings'],
          updatedAt: new Date().toISOString()
        },
        tables: this.tables,
        state: legacyState || undefined
      };
      fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(payload, null, 2), 'utf8');
    } catch (_) {}
  }

  /**
   * Hydrate `users`, `chat_history`, and `user_settings` collections from Cloud Firestore on startup
   */
  async hydrateFromCloudFirestore() {
    if (!this.firestoreClient) return false;
    try {
      // 1. Hydrate `users` table
      const usersSnap = await this.firestoreClient.collection('users').get();
      if (!usersSnap.empty) {
        usersSnap.forEach((doc) => {
          const data = doc.data();
          if (data && (data.id || doc.id)) {
            const uid = data.id || doc.id;
            this.tables.users[uid] = { ...this.tables.users[uid], ...data, id: uid };
          }
        });
      } else {
        // Seed default users to Cloud Firestore
        for (const [uid, userObj] of Object.entries(this.tables.users)) {
          await this.firestoreClient.collection('users').doc(uid).set(userObj, { merge: true });
        }
      }

      // 2. Hydrate `chat_history` table
      const chatSnap = await this.firestoreClient.collection('chat_history').get();
      if (!chatSnap.empty) {
        const loadedSessions = [];
        chatSnap.forEach((doc) => {
          const data = doc.data();
          if (data && (data.id || doc.id)) {
            loadedSessions.push({ ...data, id: data.id || doc.id });
          }
        });
        if (loadedSessions.length > 0) {
          // Ensure seed personal workspaces exist
          const seedDefaults = createDefaultChatHistory();
          for (const seed of seedDefaults) {
            if (!loadedSessions.some((s) => s.id === seed.id)) {
              loadedSessions.push(seed);
            }
          }
          this.tables.chat_history = loadedSessions;
        }
      } else {
        // Seed default sessions to Cloud Firestore
        for (const sess of this.tables.chat_history) {
          await this.firestoreClient.collection('chat_history').doc(sess.id).set(sess, { merge: true });
        }
      }

      // 3. Hydrate `user_settings` table
      const settingsSnap = await this.firestoreClient.collection('user_settings').get();
      if (!settingsSnap.empty) {
        settingsSnap.forEach((doc) => {
          const data = doc.data();
          const uid = data.userId || doc.id;
          if (uid) {
            this.tables.user_settings[uid] = { ...this.tables.user_settings[uid], ...data, userId: uid };
          }
        });
      } else {
        // Seed default user settings to Cloud Firestore
        for (const [uid, settingObj] of Object.entries(this.tables.user_settings)) {
          await this.firestoreClient.collection('user_settings').doc(uid).set(settingObj, { merge: true });
        }
      }

      this.hydrated = true;
      this._saveLocalTables();
      return true;
    } catch (err) {
      console.warn('[CoThreadFirestoreDB] Failed to hydrate from Cloud Firestore:', err.message);
      return false;
    }
  }

  // =========================================================================
  // TABLE 1: `users` (Users Table)
  // =========================================================================

  getAllUsers() {
    return { ...this.tables.users };
  }

  getPublicAccounts() {
    const publicAccounts = {};
    for (const [id, user] of Object.entries(this.tables.users)) {
      publicAccounts[id] = {
        id: user.id || id,
        name: user.name,
        shortName: user.shortName || (user.name ? user.name.split(' ')[0] : 'User'),
        username: user.username || (user.email ? user.email.split('@')[0] : id),
        email: user.email,
        initials: user.initials || 'U',
        role: user.role || 'Member',
        colorClass: user.colorClass || 'custom'
      };
    }
    return publicAccounts;
  }

  getUserById(userId) {
    if (!userId) return null;
    return this.tables.users[userId] || null;
  }

  findUserByIdentifier(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    return (
      Object.values(this.tables.users).find((u) => {
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

  async upsertUser(userObj) {
    if (!userObj || !userObj.id) {
      throw new Error('User object with a valid id is required.');
    }
    const existing = this.tables.users[userObj.id] || {};
    const record = {
      ...existing,
      ...userObj,
      id: userObj.id,
      updatedAt: new Date().toISOString(),
      createdAt: existing.createdAt || userObj.createdAt || new Date().toISOString()
    };
    this.tables.users[record.id] = record;

    // Also sync API key into user_settings if provided
    if (record.geminiApiKey !== undefined) {
      await this.upsertUserSettings(record.id, { geminiApiKey: record.geminiApiKey });
    }

    this._saveLocalTables();

    if (this.firestoreClient) {
      try {
        await this.firestoreClient.collection('users').doc(record.id).set(record, { merge: true });
      } catch (err) {
        console.warn('[CoThreadFirestoreDB] Firestore users write warning:', err.message);
      }
    }
    return record;
  }

  async syncUsersMap(usersMap) {
    if (!usersMap || typeof usersMap !== 'object') return this.tables.users;
    for (const [uid, userObj] of Object.entries(usersMap)) {
      if (userObj && typeof userObj === 'object') {
        await this.upsertUser({ ...userObj, id: userObj.id || uid });
      }
    }
    return this.tables.users;
  }

  // =========================================================================
  // TABLE 2: `chat_history` (Chat History & Sessions Table)
  // =========================================================================

  getAllSessions(userId = null) {
    if (!userId) return [...this.tables.chat_history];
    return this.tables.chat_history.filter((s) => {
      return (
        s.hostId === userId ||
        s.ownerId === userId ||
        (Array.isArray(s.participants) && s.participants.includes(userId))
      );
    });
  }

  getSessionById(sessionId) {
    if (!sessionId) return null;
    return this.tables.chat_history.find((s) => s.id === sessionId) || null;
  }

  async upsertSession(sessionObj) {
    if (!sessionObj || !sessionObj.id) {
      throw new Error('Session object with a valid id is required.');
    }
    const cleanSession = {
      ...sessionObj,
      updatedAt: new Date().toISOString()
    };

    const idx = this.tables.chat_history.findIndex((s) => s.id === cleanSession.id);
    if (idx !== -1) {
      this.tables.chat_history[idx] = cleanSession;
    } else {
      this.tables.chat_history.unshift(cleanSession);
    }

    this._saveLocalTables();

    if (this.firestoreClient) {
      try {
        await this.firestoreClient.collection('chat_history').doc(cleanSession.id).set(cleanSession, { merge: true });
      } catch (err) {
        console.warn('[CoThreadFirestoreDB] Firestore chat_history write warning:', err.message);
      }
    }
    return cleanSession;
  }

  async syncSessionsList(sessionsArray) {
    if (!Array.isArray(sessionsArray)) return this.tables.chat_history;

    const byId = new Map();
    // Keep existing sessions first, then overwrite/prepend with incoming sessions
    for (const incoming of sessionsArray) {
      if (incoming && incoming.id) {
        byId.set(incoming.id, {
          ...incoming,
          updatedAt: incoming.updatedAt || new Date().toISOString()
        });
      }
    }
    for (const existing of this.tables.chat_history) {
      if (existing && existing.id && !byId.has(existing.id)) {
        byId.set(existing.id, existing);
      }
    }

    this.tables.chat_history = Array.from(byId.values());
    this._saveLocalTables();

    if (this.firestoreClient) {
      try {
        const batch = this.firestoreClient.batch();
        for (const sess of sessionsArray) {
          if (sess && sess.id) {
            const ref = this.firestoreClient.collection('chat_history').doc(sess.id);
            batch.set(ref, { ...sess, updatedAt: new Date().toISOString() }, { merge: true });
          }
        }
        await batch.commit();
      } catch (err) {
        console.warn('[CoThreadFirestoreDB] Firestore batch chat_history sync warning:', err.message);
      }
    }
    return this.tables.chat_history;
  }

  async deleteSession(sessionId) {
    if (!sessionId) return false;
    this.tables.chat_history = this.tables.chat_history.filter((s) => s.id !== sessionId);
    this._saveLocalTables();

    if (this.firestoreClient) {
      try {
        await this.firestoreClient.collection('chat_history').doc(sessionId).delete();
      } catch (err) {
        console.warn('[CoThreadFirestoreDB] Firestore deleteSession warning:', err.message);
      }
    }
    return true;
  }

  // =========================================================================
  // TABLE 3: `user_settings` (Per-User Settings Table)
  // =========================================================================

  getUserSettings(userId) {
    if (!userId) return null;
    if (!this.tables.user_settings[userId]) {
      const user = this.tables.users[userId];
      this.tables.user_settings[userId] = {
        userId,
        theme: 'light',
        primaryModel: 'gemini-2.5-flash',
        geminiApiKey: (user && user.geminiApiKey) || '',
        scannedModels: [],
        sidebarOpen: false,
        activeSessionId: null,
        updatedAt: new Date().toISOString()
      };
    }
    return this.tables.user_settings[userId];
  }

  getAllUserSettings() {
    return { ...this.tables.user_settings };
  }

  async upsertUserSettings(userId, patch = {}) {
    if (!userId) throw new Error('userId is required to update user_settings.');
    const current = this.getUserSettings(userId) || { userId };
    const updated = {
      ...current,
      ...patch,
      userId,
      updatedAt: new Date().toISOString()
    };
    this.tables.user_settings[userId] = updated;

    // Keep user's geminiApiKey in sync on the user record if updated in settings
    if (patch.geminiApiKey !== undefined && this.tables.users[userId]) {
      this.tables.users[userId].geminiApiKey = patch.geminiApiKey;
    }

    this._saveLocalTables();

    if (this.firestoreClient) {
      try {
        await this.firestoreClient.collection('user_settings').doc(userId).set(updated, { merge: true });
      } catch (err) {
        console.warn('[CoThreadFirestoreDB] Firestore user_settings write warning:', err.message);
      }
    }
    return updated;
  }

  // =========================================================================
  // LEGACY & UNIFIED SNAPSHOT HELPERS
  // =========================================================================

  loadSnapshot() {
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.state) {
          return parsed.state;
        }
      }
    } catch (_) {}
    return null;
  }

  async syncState(state) {
    this._saveLocalTables(state);

    if (this.firestoreClient && state) {
      try {
        const batch = this.firestoreClient.batch();
        for (const [userId, user] of Object.entries(state.users || {})) {
          const ref = this.firestoreClient.collection('users').doc(userId);
          batch.set(ref, { ...user, updatedAt: new Date().toISOString() }, { merge: true });
        }
        for (const session of state.sessions || []) {
          const ref = this.firestoreClient.collection('sessions').doc(session.id);
          batch.set(ref, { ...session, updatedAt: new Date().toISOString() }, { merge: true });
        }
        await batch.commit();
      } catch (_) {}
    }
    return {
      ok: true,
      mode: this.mode,
      projectId: this.projectId
    };
  }

  getStatus() {
    return {
      connected: true,
      backend: this.mode,
      projectId: this.projectId,
      databaseId: this.databaseId,
      hydrated: this.hydrated,
      collections: ['users', 'chat_history', 'user_settings', 'sessions'],
      counts: {
        users: Object.keys(this.tables.users).length,
        chat_history: this.tables.chat_history.length,
        user_settings: Object.keys(this.tables.user_settings).length
      },
      snapshotFile: SNAPSHOT_FILE
    };
  }
}

module.exports = { CoThreadFirestoreDB };
