export type Role = "user" | "assistant" | "system" | "tool";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  attachments?: Attachment[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  url?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  openCodeApiKey: string;
  githubToken: string;
  defaultModel: string;
  theme: "light" | "dark";
}

export const DEFAULT_MODELS = [
  { id: "gpt-5.2", name: "GPT 5.2", provider: "openai", endpoint: "responses" },
  { id: "gpt-5.1-codex", name: "GPT 5.1 Codex", provider: "openai", endpoint: "responses" },
  { id: "gpt-5-nano", name: "GPT 5 Nano", provider: "openai", endpoint: "responses" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "anthropic", endpoint: "messages" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic", endpoint: "messages" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", provider: "anthropic", endpoint: "messages" },
  { id: "big-pickle", name: "Big Pickle (Free)", provider: "openai-compatible", endpoint: "chat/completions" },
  { id: "glm-4.6", name: "GLM 4.6", provider: "openai-compatible", endpoint: "chat/completions" },
  { id: "kimi-k2", name: "Kimi K2", provider: "openai-compatible", endpoint: "chat/completions" },
  { id: "qwen3-coder", name: "Qwen3 Coder", provider: "openai-compatible", endpoint: "chat/completions" },
  { id: "grok-code", name: "Grok Code Fast", provider: "openai-compatible", endpoint: "chat/completions" },
];
