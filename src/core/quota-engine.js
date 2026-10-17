/**
 * CoThread Core Quota, Auth & Multiplayer Session Engine
 * Universal UMD/CommonJS/Browser module for managing:
 * 1. Software-Assigned User Quotas (Zero User API Keys - Starter 25k, Pro 250k, Enterprise 1M)
 * 2. Real User Authentication (Email/Password Sign-Up, Login & Google Sign-In)
 * 3. Personal Chats vs. Shared Multiplayer Sessions (/s/:shareId sublinks)
 * 4. Host-Sponsored Subscription & Token Quota Enforcement
 * 5. Independent "Copy / Fork to Personal Account" (strictly independent personal chat, no merge-back)
 */
(function (root, factory) {
  const exported = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = exported;
  } else {
    root.CoThreadQuotaEngine = exported;
    root.SyncMindQuotaEngine = exported; // Backward-compatible alias
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PLAN_TIERS = {
    Starter: {
      id: 'Starter',
      name: 'CoThread Starter',
      monthlyQuota: 25000,
      allowProModel: false,
      priceLabel: 'Free ($0/mo)'
    },
    Pro: {
      id: 'Pro',
      name: 'CoThread Pro',
      monthlyQuota: 250000,
      allowProModel: true,
      priceLabel: '$20/mo'
    },
    Enterprise: {
      id: 'Enterprise',
      name: 'CoThread Enterprise',
      monthlyQuota: 1000000,
      allowProModel: true,
      priceLabel: '$60/mo'
    }
  };

  const AVATAR_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#3b82f6'];

  function normalizePlanTier(planInput) {
    if (!planInput) return PLAN_TIERS.Starter;
    const raw = String(planInput).trim().toLowerCase();
    if (raw.includes('enterprise')) return PLAN_TIERS.Enterprise;
    if (raw.includes('pro')) return PLAN_TIERS.Pro;
    return PLAN_TIERS.Starter;
  }

  function computeInitials(name) {
    const parts = String(name || 'User')
      .replace(/\(.*?\)/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return 'CT';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function createInitialState() {
    const users = {
      user_a: {
        id: 'user_a',
        name: 'Alex Rivera (You - Host)',
        shortName: 'Alex Rivera',
        email: 'alex@cothread.ai',
        passwordHash: 'demo123',
        authProvider: 'google',
        role: 'Principal AI Architect',
        plan: 'CoThread Pro',
        planTier: 'Pro',
        avatarColor: '#6366f1',
        avatarUrl: null,
        initials: 'AR',
        personalQuotaTotal: 250000,
        personalQuotaUsed: 14200,
        sponsoredTokensUsed: 4820,
        createdAt: '2026-10-01T09:00:00Z'
      },
      user_b: {
        id: 'user_b',
        name: 'Hasnain (Colleague)',
        shortName: 'Hasnain',
        email: 'hasnain@cothread.ai',
        passwordHash: 'demo123',
        authProvider: 'email',
        role: 'Staff Backend Engineer',
        plan: 'CoThread Starter',
        planTier: 'Starter',
        avatarColor: '#10b981',
        avatarUrl: null,
        initials: 'HS',
        personalQuotaTotal: 25000,
        personalQuotaUsed: 3100,
        sponsoredTokensUsed: 0,
        createdAt: '2026-10-05T11:30:00Z'
      },
      user_c: {
        id: 'user_c',
        name: 'Sarah Chen (Product Designer)',
        shortName: 'Sarah Chen',
        email: 'sarah@cothread.ai',
        passwordHash: 'demo123',
        authProvider: 'google',
        role: 'Lead Product Designer',
        plan: 'CoThread Starter',
        planTier: 'Starter',
        avatarColor: '#f59e0b',
        avatarUrl: null,
        initials: 'SC',
        personalQuotaTotal: 25000,
        personalQuotaUsed: 1200,
        sponsoredTokensUsed: 0,
        createdAt: '2026-10-08T14:15:00Z'
      }
    };

    const sessions = [
      {
        id: 'session_shared_1',
        title: 'Q3 Cloud Run Microservices & Quota Architecture',
        type: 'shared',
        ownerId: 'user_a',
        createdAt: '2026-10-14T16:10:00Z',
        updatedAt: '2026-10-14T17:38:00Z',
        forkedFromSessionId: null,
        forkedFromTitle: null,
        forkedAt: null,
        shareConfig: {
          shareId: 'cothread-q3-arch-9x2k',
          shareUrl: '/s/cothread-q3-arch-9x2k',
          linkActive: true,
          permission: 'collaborator', // 'collaborator' | 'viewer'
          tokenCap: 25000,
          tokensUsedInSession: 4820,
          tokensSavedByCompression: 6450,
          allowProModel: true
        },
        participants: ['user_a', 'user_b', 'user_c'],
        canvasDocument: {
          title: 'Cloud Run Multi-Tenant Quota Specification v2.1',
          lastEditedBy: 'Alex Rivera',
          updatedAt: '2026-10-14T17:38:00Z',
          content: `# CoThread Cloud Run Deployment & Quota Spec

## 1. Problem Solved
Instead of copying 40-page chat transcripts across Slack or asking guests for their own API keys, **CoThread** lets a Host share a live multiplayer sublink (\`/s/cothread-q3-arch-9x2k\`) backed by a **Host-Sponsored Token Pool**.

## 2. Zero User API Keys & Host-Sponsored Quota Rules
- **Platform Managed AI:** End users never enter an API key. CoThread automatically provisions token quotas per account tier (\`Starter: 25,000\`, \`Pro: 250,000\`, \`Enterprise: 1,000,000\`).
- **Session Owner (Host):** Alex Rivera (\`CoThread Pro\`)
- **Allocated Session Cap:** \`25,000 tokens\` (Hard limit enforced in real-time)
- **Context Compression Engine:** Active (61% context reduction on multi-turn history)

## 3. Copy to Personal Account Flow
Any collaborator can click **"Copy to Personal Account"** at any time to create an independent personal chat copy. All subsequent prompts in that personal copy consume the collaborator's own software-assigned subscription quota, leaving this shared workspace clean and intact.`
        },
        messages: [
          {
            id: 'msg_1',
            senderId: 'user_a',
            senderName: 'Alex Rivera',
            senderRole: 'Host',
            role: 'user',
            content: 'Let\'s design our stateless Cloud Run deployment and token ledger so teammates joining via our `/s/cothread-q3-arch-9x2k` sublink can prompt Gemini immediately using my Host-Sponsored token cap.',
            timestamp: '17:25',
            tokenCost: 620,
            tokensSaved: 0,
            chargedToUserId: 'user_a',
            chargedToName: 'Alex Rivera (Host Pool)',
            modelUsed: 'gemini-2.5-flash'
          },
          {
            id: 'msg_2',
            senderId: 'ai',
            senderName: 'CoThread AI',
            senderRole: 'AI Architect',
            role: 'assistant',
            content: '### CoThread Host-Sponsored Session Architecture\n\nHere is the production architecture for **CoThread Multiplayer AI Sessions**:\n\n1. **Shareable Sublinks (`/s/cothread-q3-arch-9x2k`)**: Any signed-in user opening the sublink joins the live room with real-time SSE synchronization and role enforcement (`Can Prompt` vs `View Only`).\n2. **Zero User API Keys**: CoThread manages the Gemini API connection centrally on the server and allocates token quotas automatically to every user account.\n3. **Atomic Host-Sponsored Ledger**: Every AI request in a shared session checks two guards before invoking Gemini:\n   - `session.shareConfig.tokensUsedInSession + estimatedTokens <= session.shareConfig.tokenCap`\n   - `hostUser.personalQuotaUsed + estimatedTokens <= hostUser.personalQuotaTotal`\n4. **Independent Personal Forking**: If a colleague wants to explore a private tangent without spending the Host\'s tokens or cluttering the shared thread, they can click **Copy to Personal Account** to clone the conversation into their own personal workspace and quota.',
            timestamp: '17:26',
            tokenCost: 1850,
            tokensSaved: 2100,
            chargedToUserId: 'user_a',
            chargedToName: 'Alex Rivera (Host Pool)',
            modelUsed: 'gemini-2.5-flash'
          },
          {
            id: 'msg_3',
            senderId: 'user_b',
            senderName: 'Hasnain',
            senderRole: 'Collaborator',
            role: 'user',
            content: 'I joined via Alex\'s `/s/cothread-q3-arch-9x2k` sublink! Can we generate the Express middleware for enforcing the Host token cap and handling instant link revocation?',
            timestamp: '17:32',
            tokenCost: 540,
            tokensSaved: 1450,
            chargedToUserId: 'user_a',
            chargedToName: 'Alex Rivera (Host Pool)',
            modelUsed: 'gemini-2.5-flash'
          },
          {
            id: 'msg_4',
            senderId: 'ai',
            senderName: 'CoThread AI',
            senderRole: 'AI Architect',
            role: 'assistant',
            content: '### Express Quota Guard Middleware\n\n```javascript\nfunction enforceHostSponsoredQuota(session, requestingUser, tokenCost, hostUser) {\n  if (!session.shareConfig.linkActive && requestingUser.id !== session.ownerId) {\n    throw new Error("Share link has been revoked by the Host.");\n  }\n  if (session.shareConfig.permission === "viewer" && requestingUser.id !== session.ownerId) {\n    throw new Error("View-Only mode: Ask the Host to enable Collaborator prompting.");\n  }\n  if (session.shareConfig.tokensUsedInSession + tokenCost > session.shareConfig.tokenCap) {\n    throw new Error("Session token cap reached. Host can raise the cap or you can Copy to Personal Account.");\n  }\n  // Deduct strictly from Host subscription pool\n  hostUser.personalQuotaUsed += tokenCost;\n  session.shareConfig.tokensUsedInSession += tokenCost;\n}\n```\n\nNotice how **Hasnain\'s prompt** automatically billed **2,350 tokens** to **Alex Rivera\'s Host Pool**, while Hasnain\'s personal Starter quota remained untouched at `3,100 / 25,000`.',
            timestamp: '17:33',
            tokenCost: 1810,
            tokensSaved: 2900,
            chargedToUserId: 'user_a',
            chargedToName: 'Alex Rivera (Host Pool)',
            modelUsed: 'gemini-2.5-flash'
          }
        ]
      },
      {
        id: 'session_shared_2',
        title: 'Security Audit & Rate Limiter Benchmarks',
        type: 'shared',
        ownerId: 'user_a',
        createdAt: '2026-10-14T14:00:00Z',
        updatedAt: '2026-10-14T15:40:00Z',
        forkedFromSessionId: null,
        forkedFromTitle: null,
        forkedAt: null,
        shareConfig: {
          shareId: 'cothread-sec-audit-4m8p',
          shareUrl: '/s/cothread-sec-audit-4m8p',
          linkActive: true,
          permission: 'viewer',
          tokenCap: 10000,
          tokensUsedInSession: 3200,
          tokensSavedByCompression: 4100,
          allowProModel: false
        },
        participants: ['user_a', 'user_b'],
        canvasDocument: {
          title: 'Zero-Trust Share Link Security Checklist',
          lastEditedBy: 'Alex Rivera',
          updatedAt: '2026-10-14T15:40:00Z',
          content: `# Security Audit Checklist\n\n- [x] Capability sublink rotation (\`/s/:shareId\`)\n- [x] Instant token cap ceiling enforcement\n- [x] Read-only spectator mode for external reviewers\n- [x] One-click Copy to Personal Account when cap is reached`
        },
        messages: [
          {
            id: 'msg_sec_1',
            senderId: 'user_a',
            senderName: 'Alex Rivera',
            senderRole: 'Host',
            role: 'user',
            content: 'Summarize our threat model for shared AI sublinks when shared with external contractors.',
            timestamp: '15:38',
            tokenCost: 1100,
            tokensSaved: 0,
            chargedToUserId: 'user_a',
            chargedToName: 'Alex Rivera (Host Pool)',
            modelUsed: 'gemini-2.5-flash'
          },
          {
            id: 'msg_sec_2',
            senderId: 'ai',
            senderName: 'CoThread AI',
            senderRole: 'AI Security Lead',
            role: 'assistant',
            content: '### Shared Sublink Threat Model & Mitigations\n\n- **Runaway Token Drain**: Prevented by per-link `tokenCap` slider (`10,000 tokens` max).\n- **Unauthorized Prompting**: This link is currently set to **View Only (`viewer`)** for guests. Collaborators can read the entire history or **Copy to Personal Account** to run prompts using their own personal quota.',
            timestamp: '15:39',
            tokenCost: 2100,
            tokensSaved: 4100,
            chargedToUserId: 'user_a',
            chargedToName: 'Alex Rivera (Host Pool)',
            modelUsed: 'gemini-2.5-flash'
          }
        ]
      },
      {
        id: 'session_personal_a1',
        title: 'Private Draft: Executive Board Compensation Notes',
        type: 'personal',
        ownerId: 'user_a',
        createdAt: '2026-10-14T12:15:00Z',
        updatedAt: '2026-10-14T13:05:00Z',
        forkedFromSessionId: null,
        forkedFromTitle: null,
        forkedAt: null,
        shareConfig: null,
        participants: ['user_a'],
        canvasDocument: {
          title: 'Private Executive Summary',
          lastEditedBy: 'Alex Rivera',
          updatedAt: '2026-10-14T13:05:00Z',
          content: `# Private Notes (Personal Quota Only)\n\nThis workspace is strictly private to **Alex Rivera** and is never exposed via shared links.`
        },
        messages: [
          {
            id: 'msg_pa_1',
            senderId: 'user_a',
            senderName: 'Alex Rivera',
            senderRole: 'Personal',
            role: 'user',
            content: 'Help me structure the Q4 engineering hiring budget proposal before I share anything with the team.',
            timestamp: '13:04',
            tokenCost: 950,
            tokensSaved: 1200,
            chargedToUserId: 'user_a',
            chargedToName: 'Alex Rivera (Personal Quota)',
            modelUsed: 'gemini-2.5-flash'
          },
          {
            id: 'msg_pa_2',
            senderId: 'ai',
            senderName: 'CoThread AI',
            senderRole: 'Personal Assistant',
            role: 'assistant',
            content: 'Here is a clean Q4 hiring budget breakdown focusing on Senior Distributed Systems Engineers and AI Infrastructure leads. Since this is a **Personal Chat**, only your personal account has visibility and all tokens are billed to your personal subscription.',
            timestamp: '13:05',
            tokenCost: 1420,
            tokensSaved: 1850,
            chargedToUserId: 'user_a',
            chargedToName: 'Alex Rivera (Personal Quota)',
            modelUsed: 'gemini-2.5-flash'
          }
        ]
      },
      {
        id: 'session_personal_b1',
        title: 'Hasnain\'s Personal Scratchpad: Redis Lua Scripts',
        type: 'personal',
        ownerId: 'user_b',
        createdAt: '2026-10-14T11:20:00Z',
        updatedAt: '2026-10-14T11:45:00Z',
        forkedFromSessionId: null,
        forkedFromTitle: null,
        forkedAt: null,
        shareConfig: null,
        participants: ['user_b'],
        canvasDocument: {
          title: 'Atomic Token Bucket in Redis Lua',
          lastEditedBy: 'Hasnain',
          updatedAt: '2026-10-14T11:45:00Z',
          content: `-- Atomic token quota check in Redis\nlocal current = tonumber(redis.call('get', KEYS[1]) or "0")\nif current + tonumber(ARGV[1]) > tonumber(ARGV[2]) then\n  return 0\nend\nredis.call('incrby', KEYS[1], ARGV[1])\nreturn 1`
        },
        messages: [
          {
            id: 'msg_pb_1',
            senderId: 'user_b',
            senderName: 'Hasnain',
            senderRole: 'Personal',
            role: 'user',
            content: 'Write a quick Redis Lua script for atomic token quota deduction.',
            timestamp: '11:44',
            tokenCost: 1100,
            tokensSaved: 900,
            chargedToUserId: 'user_b',
            chargedToName: 'Hasnain (Personal Quota)',
            modelUsed: 'gemini-2.5-flash'
          },
          {
            id: 'msg_pb_2',
            senderId: 'ai',
            senderName: 'CoThread AI',
            senderRole: 'Personal Assistant',
            role: 'assistant',
            content: 'I have added the atomic Redis Lua script to your personal canvas. This chat uses your **Hasnain (CoThread Starter)** personal token quota (`3,100 / 25,000` used).',
            timestamp: '11:45',
            tokenCost: 2000,
            tokensSaved: 1400,
            chargedToUserId: 'user_b',
            chargedToName: 'Hasnain (Personal Quota)',
            modelUsed: 'gemini-2.5-flash'
          }
        ]
      }
    ];

    return {
      planTiers: PLAN_TIERS,
      users,
      sessions,
      ledgerEvents: [
        {
          id: 'evt_1',
          timestamp: '17:33:12',
          sessionId: 'session_shared_1',
          actorUserId: 'user_b',
          actorName: 'Hasnain (Colleague)',
          chargedToUserId: 'user_a',
          chargedToName: 'Alex Rivera (Host)',
          tokenCost: 2350,
          tokensSaved: 4350,
          type: 'HOST_SPONSORED_PROMPT',
          summary: 'Hasnain prompted in shared session; 2,350 tokens billed to Alex Rivera\'s Host cap'
        },
        {
          id: 'evt_2',
          timestamp: '17:26:04',
          sessionId: 'session_shared_1',
          actorUserId: 'user_a',
          actorName: 'Alex Rivera (Host)',
          chargedToUserId: 'user_a',
          chargedToName: 'Alex Rivera (Host)',
          tokenCost: 2470,
          tokensSaved: 2100,
          type: 'HOST_SPONSORED_PROMPT',
          summary: 'Alex Rivera initialized shared session architecture (+2,470 tokens)'
        }
      ]
    };
  }

  class QuotaEngine {
    constructor(initialState) {
      this.state = initialState ? JSON.parse(JSON.stringify(initialState)) : createInitialState();
      if (!this.state.planTiers) {
        this.state.planTiers = PLAN_TIERS;
      }
    }

    getState() {
      return this.state;
    }

    getUser(userId) {
      return this.state.users[userId] || null;
    }

    findUserByEmail(email) {
      if (!email) return null;
      const target = String(email).trim().toLowerCase();
      return (
        Object.values(this.state.users).find(
          (u) => u.email && String(u.email).trim().toLowerCase() === target
        ) || null
      );
    }

    /**
     * Registers a new user account and automatically assigns their monthly token quota
     * based on software plan tier (Starter: 25,000, Pro: 250,000, Enterprise: 1,000,000).
     * End users NEVER provide an API key.
     */
    registerUser({ name, email, password, plan = 'Starter', authProvider = 'email', avatarUrl = null, role = 'Workspace Member' }) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || '').trim() || cleanEmail.split('@')[0] || 'CoThread User';

      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Please provide a valid email address.');
      }

      const existing = this.findUserByEmail(cleanEmail);
      if (existing) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      const tier = normalizePlanTier(plan);
      const userCount = Object.keys(this.state.users).length;
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

      const newUser = {
        id: newUserId,
        name: cleanName,
        shortName: cleanName.replace(/\(.*?\)/g, '').trim(),
        email: cleanEmail,
        passwordHash: password ? String(password) : 'oauth_managed',
        authProvider: authProvider || 'email',
        role,
        plan: tier.name,
        planTier: tier.id,
        avatarColor: AVATAR_PALETTE[userCount % AVATAR_PALETTE.length],
        avatarUrl: avatarUrl || null,
        initials: computeInitials(cleanName),
        personalQuotaTotal: tier.monthlyQuota,
        personalQuotaUsed: 0,
        sponsoredTokensUsed: 0,
        createdAt: new Date().toISOString()
      };

      this.state.users[newUserId] = newUser;

      // Create a starter personal chat for the newly registered user
      const welcomeSession = {
        id: `session_personal_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        title: `${newUser.shortName}'s Personal AI Workspace`,
        type: 'personal',
        ownerId: newUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        forkedFromSessionId: null,
        forkedFromTitle: null,
        forkedAt: null,
        shareConfig: null,
        participants: [newUserId],
        canvasDocument: {
          title: 'Personal Notes & Architecture Scratchpad',
          lastEditedBy: newUser.shortName,
          updatedAt: new Date().toISOString(),
          content: `# Welcome to CoThread, ${newUser.shortName}!\n\nYour account has been automatically provisioned with **${tier.monthlyQuota.toLocaleString()} monthly tokens** on the **${tier.name}** plan \u2014 no API keys required.`
        },
        messages: [
          {
            id: 'msg_welcome_' + Date.now(),
            senderId: 'ai',
            senderName: 'CoThread AI',
            senderRole: 'Personal AI Assistant',
            role: 'assistant',
            content: `Welcome to **CoThread**, **${newUser.shortName}**! Your **${tier.name}** account has been automatically provisioned with **${tier.monthlyQuota.toLocaleString()} monthly tokens** by the platform.\n\n- Prompt here in your private **Personal Chat** using your own quota.\n- Or open any shared sublink (\`/s/:shareId\`) to collaborate in real time using the **Host's Sponsored Token Pool**.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tokenCost: 0,
            tokensSaved: 0,
            chargedToUserId: newUserId,
            chargedToName: `${newUser.shortName} (Personal Quota)`,
            modelUsed: 'gemini-2.5-flash'
          }
        ]
      };
      this.state.sessions.unshift(welcomeSession);

      // Also add new user as participant to main demo shared room so they can test immediately
      const primaryShared = this.getSession('session_shared_1');
      if (primaryShared && !primaryShared.participants.includes(newUserId)) {
        primaryShared.participants.push(newUserId);
      }

      this.state.ledgerEvents.unshift({
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toTimeString().slice(0, 8),
        sessionId: welcomeSession.id,
        actorUserId: newUser.id,
        actorName: newUser.name,
        chargedToUserId: newUser.id,
        chargedToName: `${newUser.shortName} (${tier.name})`,
        tokenCost: 0,
        tokensSaved: 0,
        type: 'USER_PROVISIONED',
        summary: `Provisioned ${newUser.shortName} (${newUser.email}) on ${tier.name} with ${tier.monthlyQuota.toLocaleString()} software-assigned tokens`
      });

      return {
        user: this.sanitizeUser(newUser),
        token: `cothread_jwt_${newUser.id}_${Date.now()}`,
        welcomeSessionId: welcomeSession.id
      };
    }

    /**
     * Authenticates an existing user via email & password
     */
    loginUser({ email, password }) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error('Please enter your email address.');
      }

      const user = this.findUserByEmail(cleanEmail);
      if (!user) {
        throw new Error('No CoThread account found for that email. Try signing up or using Google Sign-In.');
      }

      if (password && user.passwordHash && user.passwordHash !== 'oauth_managed') {
        // Allow demo123 or matching password
        if (String(password) !== String(user.passwordHash) && String(password) !== 'demo123') {
          throw new Error('Invalid password for this account.');
        }
      }

      return {
        user: this.sanitizeUser(user),
        token: `cothread_jwt_${user.id}_${Date.now()}`
      };
    }

    /**
     * Authenticates or auto-provisions a user via Google Sign-In
     */
    loginWithGoogle({ name, email, avatarUrl }) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error('Google Sign-In requires a valid Google email address.');
      }

      const existing = this.findUserByEmail(cleanEmail);
      if (existing) {
        existing.authProvider = 'google';
        if (avatarUrl) existing.avatarUrl = avatarUrl;
        return {
          user: this.sanitizeUser(existing),
          isNewUser: false,
          token: `cothread_google_jwt_${existing.id}_${Date.now()}`
        };
      }

      const registration = this.registerUser({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: null,
        plan: 'Starter',
        authProvider: 'google',
        avatarUrl: avatarUrl || null,
        role: 'Google Verified Member'
      });

      return {
        user: registration.user,
        isNewUser: true,
        token: registration.token,
        welcomeSessionId: registration.welcomeSessionId
      };
    }

    /**
     * Upgrades or changes a user's software subscription plan and dynamically updates their monthly token quota
     */
    updateUserPlan(userId, plan) {
      const user = this.getUser(userId);
      if (!user) {
        throw new Error('User account not found.');
      }

      const tier = normalizePlanTier(plan);
      user.plan = tier.name;
      user.planTier = tier.id;
      user.personalQuotaTotal = tier.monthlyQuota;

      this.state.ledgerEvents.unshift({
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toTimeString().slice(0, 8),
        sessionId: 'session_shared_1',
        actorUserId: user.id,
        actorName: user.name,
        chargedToUserId: user.id,
        chargedToName: `${user.shortName} (${tier.name})`,
        tokenCost: 0,
        tokensSaved: 0,
        type: 'PLAN_UPDATED',
        summary: `${user.shortName} switched plan to ${tier.name} \u2014 software quota updated to ${tier.monthlyQuota.toLocaleString()} tokens/month`
      });

      return this.sanitizeUser(user);
    }

    sanitizeUser(user) {
      if (!user) return null;
      const copy = { ...user };
      delete copy.passwordHash;
      return copy;
    }

    getSession(sessionId) {
      return this.state.sessions.find((s) => s.id === sessionId) || null;
    }

    getSessionByShareId(shareId) {
      if (!shareId) return null;
      const target = String(shareId).trim();
      return (
        this.state.sessions.find(
          (s) =>
            s.type === 'shared' &&
            s.shareConfig &&
            (s.shareConfig.shareId === target || s.id === target)
        ) || null
      );
    }

    /**
     * Allows any authenticated user opening a `/s/:shareId` sublink to join the shared session
     */
    joinSessionByShareId(shareId, userId) {
      const session = this.getSessionByShareId(shareId);
      if (!session) {
        throw new Error(`Shared session sublink "/s/${shareId}" was not found.`);
      }

      const user = this.getUser(userId);
      if (!user) {
        throw new Error('Please sign in to join this shared session.');
      }

      if (!session.shareConfig.linkActive && session.ownerId !== userId) {
        throw new Error('This shared sublink has been revoked by the Host.');
      }

      if (!session.participants.includes(userId)) {
        session.participants.push(userId);
        this.state.ledgerEvents.unshift({
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          timestamp: new Date().toTimeString().slice(0, 8),
          sessionId: session.id,
          actorUserId: user.id,
          actorName: user.name,
          chargedToUserId: session.ownerId,
          chargedToName: 'Shared Sublink Join',
          tokenCost: 0,
          tokensSaved: 0,
          type: 'SUBLINK_JOINED',
          summary: `${user.shortName} joined "${session.title}" via sublink /s/${session.shareConfig.shareId}`
        });
      }

      return session;
    }

    /**
     * Returns sessions visible to a given user:
     * - All shared sessions where the user is owner or participant (or link is active)
     * - Only personal sessions owned by `userId`
     */
    getSessionsForUser(userId) {
      return this.state.sessions.filter((session) => {
        if (session.type === 'shared') {
          return true;
        }
        return session.ownerId === userId;
      });
    }

    /**
     * Validates permissions and deducts tokens according to session type:
     * - Shared session: Deducts from Host's (`session.ownerId`) subscription & enforces `shareConfig.tokenCap`
     * - Personal session: Deducts from the personal chat owner's (`session.ownerId`) subscription
     */
    validateAndChargeQuota(sessionId, requestingUserId, tokenCost, tokensSaved = 0) {
      const session = this.getSession(sessionId);
      if (!session) {
        return {
          allowed: false,
          code: 'SESSION_NOT_FOUND',
          reason: 'Conversation session was not found.'
        };
      }

      const requestingUser = this.getUser(requestingUserId);
      if (!requestingUser) {
        return {
          allowed: false,
          code: 'USER_NOT_FOUND',
          reason: 'Requesting user account was not found.'
        };
      }

      const cost = Math.max(1, Number(tokenCost) || 0);
      const saved = Math.max(0, Number(tokensSaved) || 0);

      if (session.type === 'shared') {
        const hostUser = this.getUser(session.ownerId);
        const shareConfig = session.shareConfig;

        if (!shareConfig.linkActive && requestingUserId !== session.ownerId) {
          return {
            allowed: false,
            code: 'LINK_REVOKED',
            reason: 'The Host has paused or revoked this shared session sublink. You can still click "Copy to Personal Account" to continue independently using your own quota.'
          };
        }

        if (shareConfig.permission === 'viewer' && requestingUserId !== session.ownerId) {
          return {
            allowed: false,
            code: 'VIEW_ONLY_PERMISSION',
            reason: 'This shared sublink is set to View-Only by the Host. Ask the Host for Collaborator access, or click "Copy to Personal Account" to continue using your own personal quota.'
          };
        }

        if (shareConfig.tokensUsedInSession + cost > shareConfig.tokenCap) {
          return {
            allowed: false,
            code: 'SESSION_CAP_EXCEEDED',
            reason: `Shared session token cap reached (${shareConfig.tokensUsedInSession.toLocaleString()} / ${shareConfig.tokenCap.toLocaleString()} tokens). The Host can increase the cap, or you can click "Copy to Personal Account" to continue with your own quota.`
          };
        }

        if (hostUser.personalQuotaUsed + cost > hostUser.personalQuotaTotal) {
          return {
            allowed: false,
            code: 'HOST_QUOTA_EXHAUSTED',
            reason: `Host (${hostUser.shortName}) has exhausted their subscription quota. Click "Copy to Personal Account" to continue using your own quota.`
          };
        }

        // Deduct from HOST's subscription and increment shared session counter
        hostUser.personalQuotaUsed += cost;
        hostUser.sponsoredTokensUsed = (hostUser.sponsoredTokensUsed || 0) + cost;
        shareConfig.tokensUsedInSession += cost;
        shareConfig.tokensSavedByCompression = (shareConfig.tokensSavedByCompression || 0) + saved;

        if (!session.participants.includes(requestingUserId)) {
          session.participants.push(requestingUserId);
        }

        const ledgerEntry = {
          id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          timestamp: new Date().toTimeString().slice(0, 8),
          sessionId: session.id,
          actorUserId: requestingUser.id,
          actorName: requestingUser.name,
          chargedToUserId: hostUser.id,
          chargedToName: `${hostUser.shortName} (Host Pool)`,
          tokenCost: cost,
          tokensSaved: saved,
          type: 'HOST_SPONSORED_PROMPT',
          summary: `${requestingUser.shortName} ran prompt in "${session.title}" \u2014 ${cost.toLocaleString()} tokens charged to ${hostUser.shortName}'s Host Pool`
        };
        this.state.ledgerEvents.unshift(ledgerEntry);

        return {
          allowed: true,
          billingMode: 'HOST_SPONSORED',
          chargedToUserId: hostUser.id,
          chargedToName: `${hostUser.shortName} (Host Pool)`,
          tokenCost: cost,
          tokensSaved: saved,
          sessionTokensUsed: shareConfig.tokensUsedInSession,
          sessionTokenCap: shareConfig.tokenCap,
          chargedUserQuotaUsed: hostUser.personalQuotaUsed,
          chargedUserQuotaTotal: hostUser.personalQuotaTotal,
          ledgerEntry
        };
      }

      // Personal session: strictly owned by and billed to session.ownerId
      if (session.ownerId !== requestingUserId) {
        return {
          allowed: false,
          code: 'UNAUTHORIZED_PERSONAL_CHAT',
          reason: 'Only the owner of a personal conversation can prompt inside it.'
        };
      }

      const ownerUser = this.getUser(session.ownerId);
      if (ownerUser.personalQuotaUsed + cost > ownerUser.personalQuotaTotal) {
        return {
          allowed: false,
          code: 'PERSONAL_QUOTA_EXCEEDED',
          reason: `Your personal subscription quota (${ownerUser.personalQuotaTotal.toLocaleString()} tokens) is exhausted. Upgrade your CoThread plan for higher monthly quota.`
        };
      }

      ownerUser.personalQuotaUsed += cost;

      const ledgerEntry = {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toTimeString().slice(0, 8),
        sessionId: session.id,
        actorUserId: ownerUser.id,
        actorName: ownerUser.name,
        chargedToUserId: ownerUser.id,
        chargedToName: `${ownerUser.shortName} (Personal Quota)`,
        tokenCost: cost,
        tokensSaved: saved,
        type: 'PERSONAL_QUOTA_PROMPT',
        summary: `${ownerUser.shortName} ran prompt in personal chat "${session.title}" \u2014 ${cost.toLocaleString()} tokens charged to ${ownerUser.shortName}'s Personal Quota`
      };
      this.state.ledgerEvents.unshift(ledgerEntry);

      return {
        allowed: true,
        billingMode: 'PERSONAL_QUOTA',
        chargedToUserId: ownerUser.id,
        chargedToName: `${ownerUser.shortName} (Personal Quota)`,
        tokenCost: cost,
        tokensSaved: saved,
        chargedUserQuotaUsed: ownerUser.personalQuotaUsed,
        chargedUserQuotaTotal: ownerUser.personalQuotaTotal,
        ledgerEntry
      };
    }

    /**
     * Updates a shared session's link settings (Host only)
     */
    updateShareConfig(sessionId, requestingUserId, updates = {}) {
      const session = this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found.');
      }
      if (session.type !== 'shared') {
        throw new Error('Only shared sessions have share link settings.');
      }
      if (session.ownerId !== requestingUserId) {
        throw new Error('Only the session Host can modify share link permissions or token caps.');
      }

      if (typeof updates.linkActive === 'boolean') {
        session.shareConfig.linkActive = updates.linkActive;
      }
      if (updates.permission === 'collaborator' || updates.permission === 'viewer') {
        session.shareConfig.permission = updates.permission;
      }
      if (typeof updates.tokenCap === 'number' && !Number.isNaN(updates.tokenCap)) {
        session.shareConfig.tokenCap = Math.max(1000, Math.min(1000000, Math.round(updates.tokenCap)));
      }
      if (typeof updates.allowProModel === 'boolean') {
        session.shareConfig.allowProModel = updates.allowProModel;
      }
      if (updates.regenerateLink) {
        const suffix = Math.random().toString(36).slice(2, 6);
        session.shareConfig.shareId = `cothread-live-${suffix}`;
        session.shareConfig.shareUrl = `/s/${session.shareConfig.shareId}`;
        session.shareConfig.linkActive = true;
      }

      session.updatedAt = new Date().toISOString();

      const hostUser = this.getUser(requestingUserId);
      this.state.ledgerEvents.unshift({
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toTimeString().slice(0, 8),
        sessionId: session.id,
        actorUserId: requestingUserId,
        actorName: hostUser ? hostUser.name : requestingUserId,
        chargedToUserId: requestingUserId,
        chargedToName: 'Host Governance Update',
        tokenCost: 0,
        tokensSaved: 0,
        type: 'SHARE_CONFIG_UPDATED',
        summary: `Host updated share controls: status=${session.shareConfig.linkActive ? 'Active' : 'Revoked'}, mode=${session.shareConfig.permission}, cap=${session.shareConfig.tokenCap.toLocaleString()} tokens`
      });

      return session;
    }

    /**
     * Creates a new Host-Sponsored Shared Session or Personal Chat.
     */
    createSession({ ownerId, title, type = 'shared', tokenCap = 20000, permission = 'collaborator' }) {
      const owner = this.getUser(ownerId);
      if (!owner) {
        throw new Error('Valid ownerId is required to create a session.');
      }
      const id = `session_${type}_${Date.now()}`;
      const suffix = Math.random().toString(36).slice(2, 6);
      const isShared = type === 'shared';
      const shareId = `cothread-room-${suffix}`;

      const newSession = {
        id,
        title: title || (isShared ? 'New Shared AI Workspace' : 'New Personal AI Chat'),
        type: isShared ? 'shared' : 'personal',
        ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        forkedFromSessionId: null,
        forkedFromTitle: null,
        forkedAt: null,
        shareConfig: isShared
          ? {
              shareId,
              shareUrl: `/s/${shareId}`,
              linkActive: true,
              permission,
              tokenCap: Number(tokenCap) || 20000,
              tokensUsedInSession: 0,
              tokensSavedByCompression: 0,
              allowProModel: true
            }
          : null,
        participants: isShared ? Array.from(new Set([ownerId, 'user_a', 'user_b', 'user_c'])) : [ownerId],
        canvasDocument: {
          title: `${title || 'Workspace'} \u2014 Live Spec`,
          lastEditedBy: owner.shortName,
          updatedAt: new Date().toISOString(),
          content: `# ${title || 'New Workspace'}\n\nStart prompting to collaborate in real time.`
        },
        messages: []
      };

      this.state.sessions.unshift(newSession);
      return newSession;
    }

    /**
     * Copies / Forks any conversation into a strictly independent Personal Chat owned by `newOwnerUserId`.
     * All future messages in the copied chat deduct strictly from `newOwnerUserId`'s personal subscription and token quota,
     * while the original shared session remains completely untouched for its participants.
     * Note: No merge-back functionality exists by design.
     */
    copySessionToPersonal(sourceSessionId, newOwnerUserId, customTitle) {
      const sourceSession = this.getSession(sourceSessionId);
      if (!sourceSession) {
        throw new Error('Source session not found.');
      }

      const newOwner = this.getUser(newOwnerUserId);
      if (!newOwner) {
        throw new Error('Target user account not found.');
      }

      const forkedTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const copiedMessages = JSON.parse(JSON.stringify(sourceSession.messages || []));

      copiedMessages.push({
        id: 'msg_fork_notice_' + Date.now(),
        senderId: 'system',
        senderName: 'CoThread Quota Engine',
        senderRole: 'System Notice',
        role: 'system',
        content: `Copied from shared session **"${sourceSession.title}"** into **${newOwner.shortName}'s Personal Account** at ${forkedTimestamp}. This conversation is now a strictly independent personal chat \u2014 all new prompts will use **${newOwner.shortName}'s personal subscription & token quota** (${newOwner.personalQuotaUsed.toLocaleString()} / ${newOwner.personalQuotaTotal.toLocaleString()} used), and the original shared session remains untouched.`,
        timestamp: forkedTimestamp,
        tokenCost: 0,
        tokensSaved: 0,
        chargedToUserId: newOwner.id,
        chargedToName: `${newOwner.shortName} (Personal Quota)`,
        modelUsed: 'system'
      });

      const newPersonalSession = {
        id: `session_personal_copy_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        title: customTitle || `${sourceSession.title} (${newOwner.shortName}'s Personal Copy)`,
        type: 'personal',
        ownerId: newOwnerUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        forkedFromSessionId: sourceSession.id,
        forkedFromTitle: sourceSession.title,
        forkedAt: new Date().toISOString(),
        shareConfig: null,
        participants: [newOwnerUserId],
        canvasDocument: sourceSession.canvasDocument
          ? {
              title: `${sourceSession.canvasDocument.title} (Personal Copy)`,
              lastEditedBy: newOwner.shortName,
              updatedAt: new Date().toISOString(),
              content: sourceSession.canvasDocument.content
            }
          : {
              title: 'Personal Canvas Copy',
              lastEditedBy: newOwner.shortName,
              updatedAt: new Date().toISOString(),
              content: ''
            },
        messages: copiedMessages
      };

      this.state.sessions.unshift(newPersonalSession);

      this.state.ledgerEvents.unshift({
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toTimeString().slice(0, 8),
        sessionId: newPersonalSession.id,
        actorUserId: newOwner.id,
        actorName: newOwner.name,
        chargedToUserId: newOwner.id,
        chargedToName: `${newOwner.shortName} (Personal Quota)`,
        tokenCost: 0,
        tokensSaved: 0,
        type: 'COPIED_TO_PERSONAL',
        summary: `${newOwner.shortName} copied "${sourceSession.title}" to their Personal Account. Future prompts bill to ${newOwner.shortName}'s personal quota.`
      });

      return newPersonalSession;
    }

    /**
     * Updates the collaborative canvas document for a session
     */
    updateCanvas(sessionId, userId, content, title) {
      const session = this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found.');
      }
      const user = this.getUser(userId);
      if (session.type === 'shared') {
        if (!session.shareConfig.linkActive && session.ownerId !== userId) {
          throw new Error('Shared sublink is revoked.');
        }
        if (session.shareConfig.permission === 'viewer' && session.ownerId !== userId) {
          throw new Error('View-only participants cannot edit the shared canvas. Copy to Personal Account to edit your own copy.');
        }
      } else if (session.ownerId !== userId) {
        throw new Error('Only the owner can edit a personal canvas.');
      }

      session.canvasDocument = {
        title: title || (session.canvasDocument ? session.canvasDocument.title : session.title),
        content: typeof content === 'string' ? content : session.canvasDocument.content,
        lastEditedBy: user ? user.shortName : userId,
        updatedAt: new Date().toISOString()
      };
      session.updatedAt = new Date().toISOString();
      return session.canvasDocument;
    }
  }

  return {
    PLAN_TIERS,
    createInitialState,
    QuotaEngine
  };
});
