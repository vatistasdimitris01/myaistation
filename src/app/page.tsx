export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 p-6 md:p-12 max-w-3xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-2">MyAIStation API</h1>
      <p className="text-zinc-500 mb-8">
        OpenAI-compatible gateway to OpenCode Zen with full GitHub tools.
      </p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-base mb-2">Endpoint</h2>
          <code className="block bg-zinc-100 rounded-lg px-3 py-2 text-xs break-all">
            POST /api/v1/chat/completions
          </code>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">cURL</h2>
          <pre className="bg-zinc-100 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{`curl https://YOUR-APP.vercel.app/api/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_OPENCODE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "big-pickle",
    "messages": [
      { "role": "user", "content": "List my GitHub repos" }
    ],
    "stream": false
  }'`}</pre>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">JavaScript / fetch</h2>
          <pre className="bg-zinc-100 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{`const res = await fetch("https://YOUR-APP.vercel.app/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.OPENCODE_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "big-pickle",
    messages: [
      { role: "user", content: "Create a file hello.md in myaistation" }
    ],
    stream: false,
  }),
});
const data = await res.json();
console.log(data.choices[0].message.content);`}</pre>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">OpenAI SDK (drop-in)</h2>
          <pre className="bg-zinc-100 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENCODE_API_KEY,
  baseURL: "https://YOUR-APP.vercel.app/api/v1",
});

const chat = await client.chat.completions.create({
  model: "big-pickle",
  messages: [{ role: "user", content: "What repos do I have?" }],
});`}</pre>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Env vars (Vercel)</h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600">
            <li><code>OPENCODE_API_KEY</code> — your OpenCode Zen key</li>
            <li><code>GITHUB_TOKEN</code> — GitHub PAT with <code>repo</code> scope (enables tools)</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Built-in GitHub tools</h2>
          <p className="text-zinc-600 mb-1">When GITHUB_TOKEN is set, the model can call:</p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600">
            <li>list_repos · get_file · list_dir</li>
            <li>create_or_update_file · delete_file</li>
            <li>create_repo · search_code</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Models</h2>
          <p className="text-zinc-600">
            big-pickle · claude-sonnet-4 · gpt-4.1 · gpt-4o · glm-4.5 · kimi-k2 · qwen3-coder · grok-code
          </p>
          <p className="text-zinc-400 mt-1 text-xs">GET /api/v1/models</p>
        </div>
      </section>
    </main>
  );
}
