# CoThread — AI Builder Cup 2026 Proposal Deck & 3-Minute Live Demo Script

This guide contains:
1. **Part 1: Slide-by-Slide Content for the Mandatory PDF Proposal Deck** (ready to copy directly into Google Slides / Canva and export as PDF).
2. **Part 2: Choreographed 3-Minute Two-Person Live Video Demo Script** for **Robina Mirbahar (Project Lead & Host)** and **Hasnain (Team Collaborator)** with exact clicks, lines, and timing cues.

---

# Part 1: Mandatory PDF Proposal Deck (Slide-by-Slide Blueprint)

## Slide 1 — Title & Executive Vision
- **Project Name**: **CoThread** — *Enterprise Collaborative AI Platform*
- **Tagline**: *Multiplayer Gemini Sublinks with Host-Sponsored Token Quotas & Instant Personal Continuation*
- **Project Lead & Principal AI Architect**: **Robina Mirbahar** ([@RobinaMirbahar](https://github.com/RobinaMirbahar) • `robina@cothread.ai`)
- **Team**: **Robina Mirbahar** ([@RobinaMirbahar](https://github.com/RobinaMirbahar) — **Project Lead, Principal Architect & Host**) & **Muhammad Hasnain** ([@hasnain-kk](https://github.com/hasnain-kk) — **Co-Builder & Collaborator**)
- **Event**: Google Cloud AI Builder Cup 2026
- **Core Google Cloud Stack**: Google Cloud Run • Cloud Firestore (`firestore.rules`) • Google ADK (`CoThreadADKOrchestrator`) • Model Context Protocol (MCP Server) • Firebase Studio (`.idx`) • `@google/genai` SDK (`gemini-3.8-flash`, `gemini-4-argon`, `gemini-3.5-flash-lite`)

---

## Slide 2 — The Problem: Enterprise AI Web Apps Are Trapped in Single-Player Silos
- **Copy-Paste Chaos**: Platforms like `gemini.google.com` and `chatgpt.com` are built for one user at a time. When two engineers debug an incident with AI, one person prompts alone and pastes screenshots into Slack.
- **Subscription & Quota Mismatch**: An engineering lead on a **Pro (`250k tokens`)** or **Enterprise (`1M tokens`)** tier cannot invite a **Starter (`25k tokens`)** teammate into the same live `gemini-4-argon` thread.
- **Dead Snapshot Links**: Existing "Share Chat" links only export a static transcript—colleagues cannot co-prompt live in the same context window, and hosts have no way to govern permissions or token spend.

---

## Slide 3 — The Solution: CoThread Enterprise SaaS Workspace
- **1. Zero-API-Key SaaS Sign-In**: Users sign in with **Google OAuth ("Continue with Google")** or **Work Email & Password**. CoThread's backend manages the master `GEMINI_API_KEY` on Google Cloud Run and automatically assigns software token quotas by tier (`Starter 25k`, `Pro 250k`, `Enterprise 1M`) persisted in **Cloud Firestore**.
- **2. Live Collaborative Sublinks (`/s/cothread-...`)**: Any thread can be shared via a dedicated sublink. Signed-in colleagues join the exact same live session with presence avatars, typing indicators, and synchronized token streaming.
- **3. Host-Sponsored Quota & Live Permissions**: Inside a shared sublink, prompts are billed against **the Host's software-assigned token quota** (bounded by a configurable session cap) while the Host controls **`Can Prompt`** vs. **`View Only`** roles in real time.
- **4. "Continue Independently (Copy to My Chats)"**: Any participant can copy the conversation into their private workspace with one click—switching all future token deductions to **their own software-assigned account quota** (strictly independent, with no merge-back clutter).

---

## Slide 4 — Technical Architecture on Google Cloud Run
- **Serverless Compute & Database**: Containerized Node.js 22 Alpine service deployed on **Google Cloud Run** (`PORT=8080`) backed by **Cloud Firestore** (`users`, `sessions`, `quota_ledger`) and production `firestore.rules`.
- **Google ADK Multi-Agent & `@google/genai` Engine**: `CoThreadADKOrchestrator` coordinates three Gemini models using the master Cloud Run environment key:
  - `gemini-3.8-flash`: Fast collaborative default for real-time team ideation.
  - `gemini-4-argon`: Deep reasoning model unlocked for teammates via Host Sponsorship.
  - `gemini-3.5-flash-lite`: High-efficiency context compression sub-agent (`ContextCompressionSubAgent`) saving ~41% of Host tokens.
- **MCP Server & Firebase Studio**: Built-in JSON-RPC 2.0 **Model Context Protocol (MCP) Server** (`src/mcp/cothread-mcp-server.js`) exposing 5 tools (`cothread_list_sessions`, `cothread_check_quota`, `cothread_create_shared_session`, `cothread_prompt_adk_agent`, `cothread_fork_to_personal`) registered in `.idx/mcp.json`.

---

## Slide 5 — Enterprise Quota & Permission Lifecycle
| Stage | Authenticated User | Software Quota Charged | Role & Capability |
| :--- | :--- | :--- | :--- |
| **1. Start Thread** | **Robina Mirbahar (Project Lead • Host • Pro Plan)** | **Robina's `250k` Pro Quota** | Room Owner • Selects `gemini-4-argon` & generates `/s/cothread-...` |
| **2. Co-Prompt via Sublink** | **Hasnain (Collaborator • Starter Plan)** | **Sponsored by Robina's `250k` Host Quota** (Hasnain's `25k` untouched) | `Can Prompt` • Collaborates live on `gemini-4-argon` |
| **3. Live Governance** | **Robina Mirbahar (Project Lead • Host)** | No charge | Toggles Collaborator to `View Only` or adjusts Session Token Cap |
| **4. Continue Independently** | **Hasnain (Private Workspace)** | **Hasnain's `25k` Starter Quota** | Private Owner • Copies thread to **"My Chats"** & prompts independently |

---

## Slide 6 — Business Impact & Enterprise Roadmap
- **True SaaS Unit Economics**: Matches how modern teams buy software (`Starter 25k`, `Pro 250k`, `Enterprise 1M`)—zero client-side API keys, instant seat onboarding, and viral sublink collaboration.
- **High-Impact Use Cases**: Live incident war-rooms, senior-to-junior pair architecture reviews, and client consulting workshops.
- **Next Milestones**:
  - Google Workspace domain-level SSO & Cloud Firestore persistent organization audit logs.
  - Multimodal shared sublinks for collaborative PDF, architecture diagram, and repository analysis.

---
---

# Part 2: 3-Minute Two-Person Live Video Demo Script

### Demo Setup Checklist (Before Recording)
1. Open **CoThread** in two side-by-side browser windows (or click **`◫ Dual Pane`** in the top header):
   - **Left Window**: **Robina Mirbahar (Project Lead & Host)** signed in on the **Pro Plan (`250,000` Software Token Quota)**.
   - **Right Window**: **Hasnain (Collaborator)** signed in on the **Starter Plan (`25,000` Software Token Quota)**.
2. Notice neither user ever enters an API key—both sign in cleanly via **Google OAuth ("Continue with Google")** or **Work Email**.

---

### [0:00 – 0:35] SaaS Sign-In & Starting a Host-Sponsored Thread
- **Robina Mirbahar (Lead & Host)** *(speaking)*:
  > "Platforms like `gemini.google.com` and `chatgpt.com` changed how individuals work, but they are still single-player. When my team and I design a system together, we're stuck pasting screenshots into Slack. Today I'm introducing **CoThread**—an enterprise collaborative AI platform built on **Google Cloud Run**, **Cloud Firestore**, **Google ADK**, and **MCP**."
- **Robina Mirbahar (Lead & Host)** *(exact clicks)*:
  1. Show the CoThread landing page and click **"Start CoThreading"** (or **"Continue with Google"**) as **Robina Mirbahar (`robina@cothread.ai` • Pro Tier — `250,000 tokens`)**.
  > "Notice there are no API keys for users to manage. CoThread's Cloud Run backend manages the master Gemini connection and automatically provisions my Pro account with a 250,000-token software quota in Cloud Firestore."
  2. Select **`gemini-4-argon`** in the top model selector and submit: *"Design a fault-tolerant webhook ingestion pipeline on Google Cloud Run in 4 concise bullet points."*
  3. Point to the **Pro 250k Quota Meter** updating live as Google ADK streams the response.

---

### [0:35 – 1:20] Sharing the `/s/cothread-...` Sublink & Co-Prompting on Host Quota
- **Robina Mirbahar (Lead & Host)** *(exact clicks & speaking)*:
  1. Click **"🔗 Share & Quota"** in the session header.
  2. Show the generated sublink (`/s/cothread-...`), confirm permission is set to **`Can Prompt AI (Uses Host Quota)`**, set the **Shared Session Token Cap** to **`25,000 tokens`**, and click **"Copy Link"**.
  > "As the Host, I'm generating a live `/s/cothread-...` sublink with `Can Prompt` access and a 25k session cap, and sharing it with my teammate."
- **Hasnain (Collaborator)** *(exact clicks & speaking)*:
  1. Click **`◫ Dual Pane`** in the top bar (or open the `/s/cothread-...` sublink in the right window) signed in as **Hasnain (Starter Tier — `25,000 tokens`)**.
  2. Point out the live presence avatars showing both **Robina Mirbahar (Host)** and **Hasnain** in the room, plus the badge: **"HOST QUOTA • Sponsored by Robina"**.
  > "I'm on the Starter 25k plan, which normally doesn't include `gemini-4-argon`. Because I joined via Robina's sublink, I see the live thread immediately and my prompts here are sponsored by her Host Pro quota."
  3. Hasnain types: *"Add an exponential backoff retry strategy and Dead Letter Topic configuration."* and clicks **Ask AI**.
  4. Both screens update simultaneously. Point to the quota bars: **Robina's 250k Host quota and Session Cap deduct the tokens** (while `gemini-3.5-flash-lite` compresses context), and **Hasnain's personal 25k Starter quota stays at 0 used**.

---

### [1:20 – 2:00] Live Permission Enforcement (`Can Prompt` -> `View Only`)
- **Robina Mirbahar (Lead & Host)** *(exact clicks & speaking)*:
  > "As the Host sponsoring this room, I have instant governance over permissions and token spend."
  1. Click **"🔗 Share & Quota"** on Robina's Host window and switch the permission mode to **`View & Team Chat Only (0 Host Tokens)`**.
- **Hasnain (Collaborator)** *(exact clicks & speaking)*:
  1. Point to the right window immediately updating to **`VIEW ONLY`**.
  > "My AI prompt access in the shared room is restricted in real time the moment Robina switches the room to `View Only`. I can still watch the live session, or I can continue independently on my own quota."

---

### [2:00 – 2:40] "Continue Independently (Copy to My Chats)" on Personal Quota
- **Hasnain (Collaborator)** *(exact clicks & speaking)*:
  1. Click **"🔀 Copy to My Chats"** (`Continue Independently`) in the session header.
  2. CoThread clones the full conversation history up to that moment into Hasnain's private **"MY CHATS (PERSONAL QUOTA)"** sidebar and switches the active billing badge to **"MY QUOTA"**.
  > "With one click on **Copy to My Chats**, CoThread forks the entire context into my private `/app` workspace. There's no merge-back—this is now my own independent thread billed strictly to my personal 25k Starter quota."
  3. Hasnain submits a prompt in his private copy: *"Write the Node.js Express handler for this Cloud Run webhook endpoint."*
  4. Show **Hasnain's 25k Starter Quota meter** deducting the tokens while **Robina's shared room and 250k Host quota on the left screen remain completely untouched**.

---

### [2:40 – 3:00] Google Cloud Stack Inspector & Closing Summary
- **Robina Mirbahar (Lead & Host)** *(exact clicks & speaking)*:
  1. Click **`🔌 Google Stack • ADK & MCP`** in the top header to briefly show the live **Cloud Firestore Documents**, **Google ADK Multi-Agent Traces**, and **MCP Server (5 JSON-RPC 2.0 Tools)**.
  > "CoThread is containerized with Docker and deployed on **Google Cloud Run**, backed by **Cloud Firestore**, **Google ADK**, **Model Context Protocol (MCP)**, **Firebase Studio**, and the official `@google/genai` SDK. By combining zero-API-key SaaS authentication, Host-sponsored token quotas, live `/s/` sublinks, and one-click independent continuation, CoThread makes enterprise AI truly multiplayer. Thank you!"
