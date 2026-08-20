import { NextRequest } from "next/server";
import { streamText, generateText, tool, CoreMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * OpenAI-compatible Chat Completions endpoint
 *
 * POST /api/v1/chat/completions
 *
 * Headers:
 *   Authorization: Bearer <opencode-api-key>
 *   Content-Type: application/json
 *
 * Env vars (Vercel):
 *   OPENCODE_API_KEY  - OpenCode Zen key
 *   GITHUB_TOKEN      - GitHub PAT with repo scope
 */

function getApiKey(req: NextRequest, bodyKey?: string): string {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return bodyKey || process.env.OPENCODE_API_KEY || process.env.OPENCODE_ZEN_API_KEY || "";
}

function buildGitHubTools(token: string) {
  const octokit = new Octokit({ auth: token });
  const tools: Record<string, any> = {};

  tools.list_repos = tool({
    description: "List repositories for the authenticated GitHub user",
    parameters: z.object({
      type: z.enum(["all", "owner", "public", "private", "member"]).optional().default("owner"),
      per_page: z.number().optional().default(30),
    }),
    execute: async ({ type, per_page }) => {
      const { data } = await octokit.repos.listForAuthenticatedUser({
        type: type as any,
        per_page,
        sort: "updated",
      });
      return data.map((r) => ({
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        updated_at: r.updated_at,
      }));
    },
  });

  tools.get_file = tool({
    description: "Get the contents of a file from a GitHub repository",
    parameters: z.object({
      owner: z.string().describe("Repository owner"),
      repo: z.string().describe("Repository name"),
      path: z.string().describe("File path"),
      ref: z.string().optional().describe("Branch or commit"),
    }),
    execute: async ({ owner, repo, path, ref }) => {
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path, ref });
        if (Array.isArray(data)) return { error: "Path is a directory. Use list_dir." };
        if (data.type !== "file" || !("content" in data)) return { error: "Not a file" };
        return {
          path: data.path,
          sha: data.sha,
          size: data.size,
          content: Buffer.from(data.content, "base64").toString("utf-8").slice(0, 100000),
        };
      } catch (e: any) {
        return { error: e.message };
      }
    },
  });

  tools.list_dir = tool({
    description: "List files and folders in a GitHub repository path",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      path: z.string().optional().default(""),
      ref: z.string().optional(),
    }),
    execute: async ({ owner, repo, path, ref }) => {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: path || "",
          ref,
        });
        if (!Array.isArray(data)) return { error: "Not a directory" };
        return data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type,
          size: item.size,
          sha: item.sha,
        }));
      } catch (e: any) {
        return { error: e.message };
      }
    },
  });

  tools.create_or_update_file = tool({
    description: "Create a new file or update an existing file in a GitHub repo. For updates pass the current SHA.",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      path: z.string(),
      content: z.string().describe("Full file content as plain text"),
      message: z.string().describe("Commit message"),
      branch: z.string().optional().default("main"),
      sha: z.string().optional().describe("Required when updating an existing file"),
    }),
    execute: async ({ owner, repo, path, content, message, branch, sha }) => {
      try {
        const { data } = await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message,
          content: Buffer.from(content).toString("base64"),
          branch,
          sha,
        });
        return {
          success: true,
          commit: data.commit.sha,
          html_url: data.content?.html_url,
        };
      } catch (e: any) {
        return { error: e.message };
      }
    },
  });

  tools.create_repo = tool({
    description: "Create a new GitHub repository for the authenticated user",
    parameters: z.object({
      name: z.string(),
      description: z.string().optional(),
      private: z.boolean().optional().default(false),
      auto_init: z.boolean().optional().default(true),
    }),
    execute: async ({ name, description, private: isPrivate, auto_init }) => {
      try {
        const { data } = await octokit.repos.createForAuthenticatedUser({
          name,
          description,
          private: isPrivate,
          auto_init,
        });
        return { success: true, full_name: data.full_name, html_url: data.html_url };
      } catch (e: any) {
        return { error: e.message };
      }
    },
  });

  tools.search_code = tool({
    description: "Search code across the authenticated user's repositories",
    parameters: z.object({
      query: z.string().describe("Search query e.g. 'function foo language:ts'"),
    }),
    execute: async ({ query }) => {
      try {
        const { data } = await octokit.search.code({
          q: `${query} user:@me`,
          per_page: 10,
        });
        return data.items.map((item) => ({
          name: item.name,
          path: item.path,
          repo: item.repository.full_name,
          url: item.html_url,
        }));
      } catch (e: any) {
        return { error: e.message };
      }
    },
  });

  tools.delete_file = tool({
    description: "Delete a file from a GitHub repository",
    parameters: z.object({
      owner: z.string(),
      repo: z.string(),
      path: z.string(),
      message: z.string(),
      sha: z.string().describe("Current file SHA"),
      branch: z.string().optional().default("main"),
    }),
    execute: async ({ owner, repo, path, message, sha, branch }) => {
      try {
        const { data } = await octokit.repos.deleteFile({
          owner,
          repo,
          path,
          message,
          sha,
          branch,
        });
        return { success: true, commit: data.commit.sha };
      } catch (e: any) {
        return { error: e.message };
      }
    },
  });

  return tools;
}

function getModelInstance(model: string, apiKey: string) {
  const isAnthropic = model.startsWith("claude-");
  const isOpenAIStyle = model.startsWith("gpt-");

  if (isAnthropic) {
    const anthropic = createAnthropic({
      apiKey,
      baseURL: "https://opencode.ai/zen",
    });
    return anthropic(model);
  }

  if (isOpenAIStyle) {
    const openai = createOpenAI({
      apiKey,
      baseURL: "https://opencode.ai/zen/v1/responses",
    });
    return openai(model);
  }

  const openai = createOpenAI({
    apiKey,
    baseURL: "https://opencode.ai/zen/v1",
    compatibility: "compatible",
  });
  return openai.chat(model);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      model = "big-pickle",
      messages = [],
      stream = true,
      temperature = 0.7,
      max_tokens,
      apiKey: bodyApiKey,
    } = body as {
      model?: string;
      messages?: CoreMessage[];
      stream?: boolean;
      temperature?: number;
      max_tokens?: number;
      apiKey?: string;
    };

    const apiKey = getApiKey(req, bodyApiKey);
    if (!apiKey) {
      return Response.json(
        {
          error: {
            message:
              "API key required. Send Authorization: Bearer <key> or set OPENCODE_API_KEY on Vercel.",
            type: "invalid_request_error",
          },
        },
        { status: 401 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        {
          error: {
            message: "messages array is required",
            type: "invalid_request_error",
          },
        },
        { status: 400 }
      );
    }

    const githubToken = process.env.GITHUB_TOKEN || "";
    const tools = githubToken ? buildGitHubTools(githubToken) : undefined;
    const modelInstance = getModelInstance(model, apiKey);

    const systemPrompt = `You are a helpful AI coding assistant with full access to the user's GitHub account when tools are available.
You can list repos, read/write/delete files, create repositories, and search code.
Be clear and concise. When using tools, briefly explain what you are doing.
Current model: ${model}`;

    if (stream) {
      const result = streamText({
        model: modelInstance,
        system: systemPrompt,
        messages,
        tools,
        maxSteps: 6,
        temperature,
        maxTokens: max_tokens,
      });

      return result.toDataStreamResponse({
        headers: {
          "X-Model": model,
          "X-GitHub-Tools": tools ? "enabled" : "disabled",
        },
      });
    }

    const result = await generateText({
      model: modelInstance,
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 6,
      temperature,
      maxTokens: max_tokens,
    });

    return Response.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: result.text,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: result.usage?.promptTokens ?? 0,
        completion_tokens: result.usage?.completionTokens ?? 0,
        total_tokens: result.usage?.totalTokens ?? 0,
      },
    });
  } catch (error: any) {
    console.error("Chat completions error:", error);
    return Response.json(
      {
        error: {
          message: error.message || "Internal server error",
          type: "server_error",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    name: "MyAIStation OpenCode Zen Gateway",
    version: "1.0.0",
    endpoints: {
      chat: "POST /api/v1/chat/completions",
    },
    models: [
      "big-pickle",
      "claude-sonnet-4-20250514",
      "gpt-4.1",
      "gpt-4o",
      "glm-4.5",
      "kimi-k2",
      "qwen3-coder",
      "grok-code",
    ],
    tools: process.env.GITHUB_TOKEN
      ? ["list_repos", "get_file", "list_dir", "create_or_update_file", "create_repo", "search_code", "delete_file"]
      : [],
    github_tools: !!process.env.GITHUB_TOKEN,
  });
}
