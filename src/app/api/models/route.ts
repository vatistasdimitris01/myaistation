import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") || "";
  try {
    const res = await fetch("https://opencode.ai/zen/v1/models", {
      headers: apiKey
        ? { Authorization: `Bearer ${apiKey}` }
        : { Authorization: "Bearer public" },
    });
    if (!res.ok) {
      return Response.json({ models: [] }, { status: 200 });
    }
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ models: [] });
  }
}
