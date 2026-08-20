# MyAIStation API

OpenAI-compatible gateway to **OpenCode Zen** with full **GitHub tools**.

## Quick start

1. Deploy to Vercel
2. Set env vars:
   - `OPENCODE_API_KEY` — from [opencode.ai/auth](https://opencode.ai/auth)
   - `GITHUB_TOKEN` — GitHub PAT with `repo` scope
3. Call the endpoint from any app

## Endpoint

```
POST https://YOUR-APP.vercel.app/api/v1/chat/completions
```

### Headers
```
Authorization: Bearer <OPENCODE_API_KEY>
Content-Type: application/json
```

### Body
```json
{
  "model": "big-pickle",
  "messages": [
    { "role": "user", "content": "List my GitHub repos" }
  ],
  "stream": false
}
```

## Use with OpenAI SDK

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENCODE_API_KEY,
  baseURL: "https://YOUR-APP.vercel.app/api/v1",
});

const res = await client.chat.completions.create({
  model: "big-pickle",
  messages: [{ role: "user", content: "Create README.md in myaistation" }],
});
```

## JavaScript fetch

```js
const res = await fetch("https://YOUR-APP.vercel.app/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + process.env.OPENCODE_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "big-pickle",
    messages: [{ role: "user", content: "List my repos" }],
    stream: false,
  }),
});
const data = await res.json();
console.log(data.choices[0].message.content);
```

## GitHub tools (auto when GITHUB_TOKEN is set)

| Tool | Description |
|------|-------------|
| `list_repos` | List your repositories |
| `get_file` | Read a file |
| `list_dir` | List directory contents |
| `create_or_update_file` | Create or edit a file |
| `delete_file` | Delete a file |
| `create_repo` | Create a new repository |
| `search_code` | Search code across your repos |

## Models

`big-pickle` · `claude-sonnet-4-20250514` · `gpt-4.1` · `gpt-4o` · `glm-4.5` · `kimi-k2` · `qwen3-coder` · `grok-code`

List: `GET /api/v1/models`
