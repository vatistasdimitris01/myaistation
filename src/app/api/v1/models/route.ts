import { NextResponse } from "next/server";

const MODELS = [
  { id: "big-pickle", object: "model", owned_by: "opencode" },
  { id: "claude-sonnet-4-20250514", object: "model", owned_by: "anthropic" },
  { id: "claude-opus-4-20250514", object: "model", owned_by: "anthropic" },
  { id: "gpt-4.1", object: "model", owned_by: "openai" },
  { id: "gpt-4o", object: "model", owned_by: "openai" },
  { id: "gpt-4o-mini", object: "model", owned_by: "openai" },
  { id: "glm-4.5", object: "model", owned_by: "zhipu" },
  { id: "kimi-k2", object: "model", owned_by: "moonshot" },
  { id: "qwen3-coder", object: "model", owned_by: "alibaba" },
  { id: "grok-code", object: "model", owned_by: "xai" },
];

export async function GET() {
  return NextResponse.json({
    object: "list",
    data: MODELS,
  });
}
