import { NextRequest } from "next/server";
import { streamText, tool, CoreMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { Octokit } from "@octokit/rest";

export const maxDuration = 60;

const OPENCODE_BASE = "https://opencode.ai/zen/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      model = "big-pickle",
      apiKey,
      githubToken,
    } = body as {
      messages: CoreMessage[];
      model: string;
      apiKey?: string;
      githubToken?: string;
    };

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenCode Zen API key is required. Add it in Settings." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine provider based on model
    const isAnthropic = model.startsWith("claude-");
    const isOpenAIStyle = model.startsWith("gpt-");

    let modelInstance;

    if (isAnthropic) {
      const anthropic = createAnthropic({
        apiKey,
        baseURL: `${OPENCODE_BASE}/messages`,
      });
      modelInstance = anthropic(model);
    } else {
      // OpenAI compatible / responses
      const openai = createOpenAI({
        apiKey,
        baseURL: isOpenAIStyle
          ? `${OPENCODE_BASE}/responses`
          : `${OPENCODE_BASE}/chat/completions`,
        compatibility: isOpenAIStyle ? "strict" : "compatible",
      });
      modelInstance = openai(model);
    }

    // GitHub tools if token provided
    const tools: Record<string, any> = {};

    if (githubToken) {
      const octokit = new Octokit({ auth: githubToken });

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
          path: z.string().describe("Path to the file"),
          ref: z.string().optional().describe("Branch or commit ref"),
        }),
        execute: async ({ owner, repo, path, ref }) => {
          try {
            const { data } = await octokit.repos.getContent({
              owner,
              repo,
              path,
              ref,
            });
            if (Array.isArray(data)) {
              return { error: "Path is a directory. Use list_dir instead." };
            }
            if (data.type !== "file" || !("content" in data)) {
              return { error: "Not a file" };
            }
            const content = Buffer.from(data.content, "base64").toString("utf-8");
            return {
              path: data.path,
              sha: data.sha,
              size: data.size,
              content: content.slice(0, 100000), // limit
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
            if (!Array.isArray(data)) {
              return { error: "Not a directory" };
            }
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
        description:
          "Create a new file or update an existing file in a GitHub repository. For updates, provide the current SHA.",
        parameters: z.object({
          owner: z.string(),
          repo: z.string(),
          path: z.string(),
          content: z.string().describe("Full file content as plain text"),
          message: z.string().describe("Commit message"),
          branch: z.string().optional().default("main"),
          sha: z.string().optional().describe("Required if updating existing file"),
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
            return {
              success: true,
              full_name: data.full_name,
              html_url: data.html_url,
            };
          } catch (e: any) {
            return { error: e.message };
          }
        },
      });

      tools.search_code = tool({
        description: "Search code across the authenticated user's repositories",
        parameters: z.object({
          query: z.string().describe("Search query, e.g. 'function foo language:ts'"),
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
    }

    // System prompt
    const systemPrompt = `You are MyAIStation, a friendly, energetic AI coding assistant with a Duolingo-inspired personality.
You help users with coding, GitHub operations, file management, and general questions.
Be encouraging, clear, and concise. Use short paragraphs.
When using tools, explain what you are doing in a fun way.
You have full access to the user's GitHub account when a token is provided (list repos, read/write files, create repos, search code).
Always confirm before destructive actions if unsure.
Current model: ${model}`;

    const result = streamText({
      model: modelInstance,
      system: systemPrompt,
      messages,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      maxSteps: 5,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
