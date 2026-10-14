# CoThread — AI Builder Cup 2026 Proposal Deck & 3-Minute Live Demo Script

This guide contains:
1. **Part 1: Slide-by-Slide Content for the Mandatory PDF Proposal Deck** (ready to copy directly into Google Slides / Canva and export as PDF).
2. **Part 2: Choreographed 3-Minute Two-Person Live Video Demo Script** for **You (Host)** and **Hasnain (Colleague)** with exact clicks, lines, and timing cues.

---

# Part 1: Mandatory PDF Proposal Deck (Slide-by-Slide Blueprint)

## Slide 1 — Title & Executive Vision
- **Project Name**: **CoThread** — *Enterprise Collaborative AI Platform*
- **Tagline**: *Multiplayer Gemini Sublinks with Host-Sponsored Token Quotas & Instant Personal Continuation*
- **Original Idea & Concept Credit**: **Muhammad Hasnain** ([@hasnain-kk](https://github.com/hasnain-kk) • `hasnainrashi@gmail.com`)
- **Team**: **Robina Mirbahar** ([@RobinaMirbahar](https://github.com/RobinaMirbahar) — Host / Lead Builder) & **Muhammad Hasnain** ([@hasnain-kk](https://github.com/hasnain-kk) — Original Idea Creator / Co-Builder)
- **Event**: Google Cloud AI Builder Cup 2026
- **Core Stack**: Google Cloud Run • `@google/genai` SDK • `gemini-3.8-flash` • `gemini-4-argon` • `gemini-3.5-flash-lite`

---

## Slide 2 — The Problem: Enterprise AI Web Apps Are Trapped in Single-Player Silos
- **Copy-Paste Chaos**: Platforms like `gemini.google.com` and `chatgpt.com` are built for one user at a time. When two engineers debug an incident with AI, one person prompts alone and pastes screenshots into Slack.
- **Subscription & Quota Mismatch**: A tech lead on a **Pro (`250k tokens`)** or **Enterprise (`1M tokens`)** tier cannot invite a **Starter (`25k tokens`)** teammate into the same live `gemini-4-argon` thread.
- **Dead Snapshot Links**: Existing "Share Chat" links only export a static transcript—colleagues cannot co-prompt live in the same context window, and hosts have no way to govern permissions or token spend.

---

## Slide 3 — The Solution: CoThread Enterprise SaaS Workspace
- **1. Zero-API-Key SaaS Sign-In**: Users sign in with **Google OAuth ("Continue with Google")** or **Work Email & Password**. CoThread's backend manages the master `GEMINI_API_KEY` on Google Cloud Run and automatically assigns software token quotas by tier (`Starter 25k`, `Pro 250k`, `Enterprise 1M`).
- **2. Live Collaborative Sublinks (`/s/cothread-...`)**: Any thread can be shared via a dedicated sublink. Signed-in colleagues join the exact same live session with presence avatars, typing indicators, and synchronized token streaming.
- **3. Host-Sponsored Quota & Live Permissions**: Inside a shared sublink, prompts are billed against **the Host's software-assigned token quota** (bounded by a configurable session cap) while the Host controls **`Can Prompt`** vs. **`View Only`** roles in real time.
- **4. "Continue Independently (Copy to My Chats)"**: Any participant can copy the conversation into their private workspace with one click—switching all future token deductions to **their own software-assigned account quota**.

---

## Slide 4 — Technical Architecture on Google Cloud Run
- **Serverless Compute**: Containerized Node.js 22 Alpine service deployed on **Google Cloud Run** (`PORT=8080`, session affinity enabled for real-time streaming).
- **Platform-Managed `@google/genai` Engine**: Backend orchestrates multi-turn context and streaming across three Gemini models using the master Cloud Run environment key:
  - `gemini-3.8-flash`: Fast collaborative default for real-time team ideation.
  - `gemini-4-argon`: Deep reasoning model unlocked for teammates via Host Sponsorship.
  - `gemini-3.5-flash-lite`: High-efficiency model available across all personal tiers.
- **Software Quota Ledger & Access Guard**: Server-side middleware authenticates sessions, enforces `/s/cothread-...` role permissions (`Host` / `Can Prompt` / `View Only`), and atomically deducts `inputTokens + outputTokens` from the active sponsor's software quota.

---

## Slide 5 — Enterprise Quota & Permission Lifecycle
| Stage | Authenticated User | Software Quota Charged | Role & Capability |
| :--- | :--- | :--- | :--- |
| **1. Start Thread** | **You (Host • Pro Plan)** | **Host's `250k` Pro Quota** | Room Owner • Selects `gemini-4-argon` & generates `/s/cothread-...` |
| **2. Co-Prompt via Sublink** | **Hasnain (Colleague • Starter Plan)** | **Sponsored by Host's `250k` Quota** (Hasnain's `25k` untouched) | `Can Prompt` • Collaborates live on `gemini-4-argon` |
| **3. Live Governance** | **You (Host • Pro Plan)** | No charge | Toggles Hasnain to `View Only` or adjusts Session Token Cap |
| **4. Continue Independently** | **Hasnain (Private Workspace)** | **Hasnain's `25k` Starter Quota** | Private Owner • Copies thread to **"My Chats"** & prompts independently |

---

## Slide 6 — Business Impact & Enterprise Roadmap
- **True SaaS Unit Economics**: Matches how modern teams buy software (`Starter 25k`, `Pro 250k`, `Enterprise 1M`)—zero client-side API keys, instant seat onboarding, and viral sublink collaboration.
- **High-Impact Use Cases**: Live incident war-rooms, senior-to-junior pair architecture reviews, and client consulting workshops.
- **Next Milestones**:
  - Google Workspace domain-level SSO & Cloud SQL / Firestore persistent organization audit logs.
  - Multimodal shared sublinks for collaborative PDF, architecture diagram, and repository analysis.

---
---

# Part 2: 3-Minute Two-Person Live Video Demo Script

### Demo Setup Checklist (Before Recording)
1. Open **CoThread** in two side-by-side browser windows (or two laptops on a shared screen):
   - **Left Window**: **You (Host)** signed in on the **Pro Plan (`250,000` Software Token Quota)**.
   - **Right Window**: **Hasnain (Colleague)** signed in on the **Starter Plan (`25,000` Software Token Quota)**.
2. Notice neither user ever enters an API key—both sign in cleanly via **Google OAuth ("Continue with Google")** or **Work Email & Password**.

---

### [0:00 – 0:35] SaaS Sign-In & Starting a Host-Sponsored Thread
- **You (Host)** *(speaking)*:
  > "Platforms like `gemini.google.com` and `chatgpt.com` changed how individuals work, but they are still single-player. When Hasnain and I design a system together, we're stuck pasting screenshots into Slack. Today we're introducing **CoThread**—an enterprise collaborative AI platform running on **Google Cloud Run**."
- **You (Host)** *(exact clicks)*:
  1. Show the CoThread sign-in screen and click **"Continue with Google"** (or sign in with your Work Email) as **You (Pro Tier — `250,000 tokens`)**.
  > "Notice there are no API keys for users to manage. CoThread's Cloud Run backend manages the master Gemini connection and automatically assigns my Pro account a 250,000-token software quota."
  2. Click **"+ New Thread"**, select **`gemini-4-argon`**, and submit: *"Design a fault-tolerant webhook ingestion pipeline on Google Cloud Run in 4 concise bullet points."*
  3. Point to the **Pro 250k Quota Meter** updating live as `@google/genai` streams the response.

---

### [0:35 – 1:20] Sharing the `/s/cothread-...` Sublink & Co-Prompting on Host Quota
- **You (Host)** *(exact clicks & speaking)*:
  1. Click **"Share Thread"** in the top-right header.
  2. Show the generated sublink (`/s/cothread-...`), set the default permission to **`Can Prompt`**, set the **Shared Session Token Cap** to **`25,000 tokens`**, and click **"Copy Sublink"**.
  > "I'm generating a live `/s/cothread-...` sublink with `Can Prompt` access and a 25k session cap, and sending it to Hasnain."
- **Hasnain (Colleague)** *(exact clicks & speaking)*:
  1. In the right window, open the `/s/cothread-...` sublink and sign in with **Google OAuth / Work Email** as **Hasnain (Starter Tier — `25,000 tokens`)**.
  2. Point out the live presence avatars showing both **You** and **Hasnain** in the thread, plus the badge: **"Sponsored by Host's Pro Quota"**.
  > "I'm on the Starter 25k plan, which normally doesn't include `gemini-4-argon`. Because I joined via the Host's sublink, I see the live thread immediately and my prompts here are sponsored by the Host's Pro quota."
  3. Hasnain types: *"Add an exponential backoff retry strategy and Dead Letter Topic configuration."*
  4. **You (Host)** point out the live **"Hasnain is typing..."** indicator on the left window before Hasnain clicks **Send**.
  5. Both screens stream the `gemini-4-argon` response simultaneously. Point to the quota bars: **the Host's 250k quota and Session Cap deduct the tokens**, while **Hasnain's personal 25k Starter quota stays untouched**.

---

### [1:20 – 2:00] Live Permission Enforcement (`Can Prompt` -> `View Only`)
- **You (Host)** *(exact clicks & speaking)*:
  > "As the Host sponsoring this thread, I have instant governance over permissions and token spend."
  1. Open the **Share & Permissions** popover on the Host window and switch **Hasnain** from **`Can Prompt`** to **`View Only`**.
- **Hasnain (Colleague)** *(exact clicks & speaking)*:
  1. Point to the right window immediately updating to **`View Only — Host restricted prompting in this shared thread`**, locking the composer.
  > "My prompt box locked in real time the moment the Host switched me to `View Only`. I can still watch the live session, or I can continue exploring on my own."

---

### [2:00 – 2:40] "Continue Independently (Copy to My Chats)" on Personal Quota
- **Hasnain (Colleague)** *(exact clicks & speaking)*:
  1. Click **"Continue Independently (Copy to My Chats)"** in the top action bar.
  2. CoThread clones the full conversation history up to that moment into Hasnain's private **"My Chats"** sidebar and switches the active billing badge to **"Personal Workspace • Using Your Starter 25k Quota"**.
  > "With one click on **Continue Independently (Copy to My Chats)**, CoThread copies the entire context into my private workspace. There's no merge-back—this is now my own independent thread billed to my personal 25k Starter quota."
  3. Hasnain submits a prompt in his private copy using **`gemini-3.5-flash-lite`**: *"Write the Node.js Express handler for this Cloud Run webhook endpoint."*
  4. Show **Hasnain's 25k Starter Quota meter** deducting the tokens while **the Host's shared thread and 250k quota on the left screen remain completely unchanged**.

---

### [2:40 – 3:00] Google Cloud Run Architecture & Closing Summary
- **You (Host)** *(speaking)*:
  > "CoThread is containerized with Docker and deployed on **Google Cloud Run**, powered by the official `@google/genai` SDK across `gemini-3.8-flash`, `gemini-4-argon`, and `gemini-3.5-flash-lite`. By combining zero-API-key SaaS authentication, software-assigned token quotas, live `/s/cothread-...` sublinks, and one-click independent continuation, CoThread makes enterprise AI truly multiplayer. Thank you!"
