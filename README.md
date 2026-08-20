# MyAIStation 🎯

**Duolingo-style AI chat station** powered by [OpenCode Zen](https://opencode.ai/zen) + full GitHub tool use.

Chat like ChatGPT / Grok, but with a playful green Duolingo vibe, sidebars, model selection, file & folder uploads, and direct access to **your GitHub account** (list repos, read/write files, create repos, search code).

## Features

- 🎨 **Duolingo-inspired UI** — bright green, rounded buttons, fun animations, Nunito font
- 💬 **Streaming chat** like ChatGPT / Grok
- 🤖 **Model selector** — GPT-5.x, Claude 4.x, Big Pickle (free), GLM, Kimi, Qwen3 Coder, Grok Code, etc. via OpenCode Zen
- 📂 **File & folder upload** — attach code, text, images to the conversation
- 🛠️ **Full AI tool use** with GitHub:
  - List your repositories
  - Read / list files & folders
  - Create or update files (with commit)
  - Create new repositories
  - Search code across your repos
- ⚙️ Settings for OpenCode Zen API key + GitHub PAT (stored locally in browser)
- 📱 Responsive sidebar (collapsible)
- 🚀 **Vercel-ready** Next.js 15 App Router

## Quick Start

```bash
git clone https://github.com/vatistasdimitris01/myaistation.git
cd myaistation
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

1. Click **Settings** → paste your **OpenCode Zen API key** (get one at [opencode.ai/auth](https://opencode.ai/auth))
2. (Optional) Paste a **GitHub Personal Access Token** with `repo` scope
3. Start chatting!

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vatistasdimitris01/myaistation)

Or:

```bash
npx vercel
```

No server-side secrets required — API keys stay in the browser / are sent only to your own API routes.

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v4
- Vercel AI SDK (`ai` + `@ai-sdk/openai` / `@ai-sdk/anthropic`)
- Octokit for GitHub tools
- Lucide icons

## OpenCode Zen Endpoints used

- `https://opencode.ai/zen/v1/responses` (GPT models)
- `https://opencode.ai/zen/v1/messages` (Claude)
- `https://opencode.ai/zen/v1/chat/completions` (OpenAI-compatible models)
- Models list: `https://opencode.ai/zen/v1/models`

## License

MIT
