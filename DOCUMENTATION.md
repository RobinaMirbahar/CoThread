# CoThread — Architecture & Implementation Documentation

## 1. Executive Summary & Overview

**CoThread** is a collaborative AI workspace platform built on Google Cloud Run, Cloud Firestore, and the Google GenAI SDK. Designed with the familiarity of consumer AI apps (Claude, Gemini, ChatGPT) and the real-time multiplayer capabilities of Google Docs, CoThread enables software teams to co-prompt Gemini agents, compress team banter automatically, and maintain synchronized code and architectural artifacts.

This document details the latest architectural enhancements, authentication system, Gemini dynamic model discovery, session memory isolation, and streamlined workspace UX.

---

## 2. Authentication & User Management Engine (Mini-DB)

### 2.1 Persistent Local User Database
To replace static mock accounts with fully functional authentication, a persistent client-side user database was implemented:
- **Storage**: Persisted securely under `cothread_minidb_users` in browser storage.
- **Seeded Default Accounts**:
  - **Muhammad Hasnain (Co-Builder)**:
    - **Username**: `HasnainKK`
    - **Email**: `rashidhasnain0601@gmail.com`
    - **Password**: `admin123`
    - **Role**: Co-Builder & Collaborator
  - **Robina Mirbahar (Project Lead & Host)**:
    - **Username**: `Robina`
    - **Email**: `robina@cothread.ai`
    - **Password**: `admin123`
    - **Role**: Project Lead & Host
- **Self-Registration (Sign Up)**:
  - Any new user can register by providing their Full Name, Username, Email, Password, and their Google Gemini API Key.
  - Accounts are instantly provisioned with isolated workspace state and quota tracking.

### 2.2 Isolated Session Memory & Workspace Partitioning
- **Session Isolation**: Each user session is completely partitioned by `userId`.
- When logging in as `Hasnain KK`, the application directly loads Hasnain's private workspace and message history rather than exposing generic or shared developer threads.
- Cross-user session leakage is strictly prevented through user-scoped session queries (`getUserSessions(userId)`).

---

## 3. Gemini AI Integration & Dynamic Model Discovery Engine

### 3.1 Seamless API Key Management
- **Key Storage**: User Gemini API keys are saved in `localStorage` under `cothread_gemini_api_key`.
- **Zero-Reprompt Experience**: Once an API key is provided during sign-up or via the account settings, the user is never prompted again.
- **Sidebar Key Access**: A dedicated key button (`🔑`) is neatly integrated into the account footer on the sidebar, allowing quick updates or key testing without cluttering top-level navigation.

### 3.2 Dynamic Model Scanning Algorithm
Instead of hardcoding static model names (e.g. Gemini 4 or 3.8), CoThread features an automated model scanner:
- When an API key is connected, the app probes the Google Gemini API to discover supported models available for the account.
- Successfully verified models (e.g. `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-flash`) dynamically populate the model selector dropdown inside the composer dock.
- Provides fallback model mapping when working offline or prior to API connection.

### 3.3 Real-Time Token Utilization Telemetry
- A live token usage meter is displayed directly inside the account footer in the sidebar.
- Displays used tokens against the user's quota allocation (`used / total`) with an interactive progress fill bar.

---

## 4. Workspace & Chat UX Enhancements

### 4.1 Fresh Login Experience
- **Immediate New Chat**: Upon login, users are always greeted with a clean, brand-new chat session rather than jumping into prior conversations.
- **Collapsed Sidebar**: The sidebar is collapsed by default on desktop upon login, creating a focused, home-screen-like environment matching modern AI chat interfaces.

### 4.2 Strict Unprompted Chat Cleanup
To prevent sidebar clutter from abandoned drafts:
- **No Saving Without Human Prompts**: Chats where the user hasn't sent any prompt are never persisted to `localStorage`.
- **Sidebar Filtering**: Empty or unprompted `New Chat` sessions are excluded from the **RECENT CHATS** list.
- **Automatic Pruning on Switch**: Switching away from an empty `New Chat` immediately prunes it from active memory.

### 4.3 Deep Chat Branching
- **Complete Context Duplication**: Clicking **Branch Chat** (or **Branch from here** on a message) deep-copies the entire conversation trajectory up to that point.
- **Artifact & Storage Cloning**: All message history, participant metadata, and linked canvas documents are replicated into the newly branched session.
- The new branch is automatically titled with a suffix (e.g., `Workspace (Branch 1)`) and switched to seamlessly.

### 4.4 Top-Right Share Button & Live Collaborator Presence
- **Optimal Positioning**: Positioned prominently on the top-right side below the top navigation bar inside the chat column header.
- **Conditional Visibility**: In a fresh `New Chat`, the Share button remains hidden until the user submits their first prompt.
- **Multiplayer Collaboration**:
  - **Private Collaboration**: Invite colleagues by email to join the live room with real-time presence indicators.
  - **Public Link (Copy to Chat)**: Allows external viewers to inspect the full agent trajectory and fork an independent copy into their private workspace with one click.
  - **Live Presence Stack**: Displays avatar badges of other active collaborators directly beside the Share button.

### 4.5 Streamlined Interface & Marketing Cleanup
- Removed outdated pricing tables and non-functional "Open Chat" buttons from the marketing page.
- Removed extraneous top navigation badges ("✦ Gemini Agent", "⚡ Inspector", chat titles, and static model labels) to maintain a minimalist aesthetic.

---

## 5. Technical Implementation Details

### Files Modified & Architecture Alignment:
| File | Role & Key Changes |
| :--- | :--- |
| `public/app.js` & `app.js` | Core application logic: Mini-DB auth, dynamic model scanner, session isolation, unprompted chat pruning, share modal logic, and branching. |
| `public/styles.css` & `styles.css` | Neo-brutalist styling: `.chat-pane-header-actions`, `.chat-pane-share-btn`, token utilization bar, presence stack, and responsive layouts. |
| `public/index.html` & `index.html` | Markup updates: Auth modal with Gemini API key input, workspace stage structure, and share dialogs. |
| `server.js` | Cloud Run server setup, static asset routing, and health checks. |
| `src/ai/gemini-service.js` | Gemini API service wrapper with dynamic model resolution. |
| `src/core/quota-engine.js` | Token quota tracking and compression algorithms. |

---

## 6. Verification & Quality Assurance

- **Syntax Verification**: Passed Node.js syntax checks across all modified JavaScript files (`node -c public/app.js; node -c app.js`).
- **Synchronized Assets**: Verified 100% parity between root and `public/` copies of `app.js`, `styles.css`, and `index.html`.
- **Runtime Validation**: Validated local Cloud Run server running on port `8080` with zero console errors.
