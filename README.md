# Personal Assistant UI

A mobile-friendly chat UI for your Claude-powered personal assistant. Built with Next.js 15, streaming responses, and deployed on Vercel.

## Features

- Real-time streaming responses with live text rendering
- Tool use indicators ("Searching the web...", "Running code...")
- File downloads when the agent produces outputs (xlsx, docx, pptx, etc.)
- Persistent memory across conversations (via Managed Agents memory store)
- Mobile-first, works as a home screen app on iOS/Android
- API key stays server-side — never exposed to the browser

## Prerequisites

You need to have already run `setup.py` from the `personal-assistant/` folder to provision your agent. The IDs it creates go in your `.env.local`.

## Local Development

### 1. Install dependencies

```bash
cd personal-assistant-ui
npm install
```

### 2. Configure environment

```bash
copy .env.example .env.local
```

Edit `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
AGENT_ID=agent_...        # from personal-assistant/.env
ENVIRONMENT_ID=env_...    # from personal-assistant/.env
MEMORY_STORE_ID=memstore_...  # from personal-assistant/.env
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel via GitHub

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "feat: personal assistant chat UI"

# Create repo (requires GitHub CLI: https://cli.github.com)
gh repo create personal-assistant-ui --public --source=. --push

# Or manually: create repo on github.com, then:
# git remote add origin https://github.com/YOUR_USERNAME/personal-assistant-ui.git
# git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Add New Project** → **Import Git Repository**
3. Select `personal-assistant-ui`
4. Before deploying, click **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` — mark as **Sensitive** ✓
   - `AGENT_ID`
   - `ENVIRONMENT_ID`
   - `MEMORY_STORE_ID`
5. Click **Deploy**

That's it. Vercel auto-deploys on every push to `main`.

## Mobile — Add to Home Screen

On iOS Safari: Share → Add to Home Screen  
On Android Chrome: Menu → Add to Home Screen

The app uses `100dvh` and `safe-area-inset` so it fills the screen correctly without the browser chrome.

## Project Structure

```
app/
  api/
    session/route.ts    — creates Managed Agents session
    chat/route.ts       — SSE streaming proxy (never exposes API key)
    files/route.ts      — list & download agent output files
  layout.tsx            — root layout + mobile viewport config
  page.tsx              — renders <ChatInterface>
  globals.css           — Tailwind + blink animation

components/
  ChatInterface.tsx     — root: wires session, chat state, UI
  MessageList.tsx       — scrollable messages, auto-scroll
  MessageBubble.tsx     — user (blue) / assistant (grey) bubbles
  ToolUseIndicator.tsx  — animated pill during tool use
  ChatInput.tsx         — textarea, Enter to send, Stop button
  FileDownloadList.tsx  — download links after agent produces files

hooks/
  useSession.ts         — creates/persists session in sessionStorage
  useChat.ts            — message state + SSE streaming logic

lib/
  anthropic.ts          — server-only SDK singleton
  types.ts              — shared TypeScript types
  tool-labels.ts        — tool name → human label mapping
```

## Updating the Agent

To change the agent's behavior (system prompt, tools, model), update `setup.py` in the `personal-assistant/` folder and re-run it with the `--update` flag, or use the Anthropic CLI:

```bash
# Update agent via CLI (from personal-assistant/)
ant beta:agents update --agent-id $AGENT_ID --version N < agent.yaml
```

The UI auto-uses the latest agent version — no UI changes needed.
