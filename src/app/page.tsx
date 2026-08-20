"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "ai/react";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "@/components/Sidebar";
import ModelSelector from "@/components/ModelSelector";
import SettingsModal from "@/components/SettingsModal";
import { ChatSession, AppSettings, Message, DEFAULT_MODELS, Attachment } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Send,
  Paperclip,
  StopCircle,
  Bot,
  User,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";

const STORAGE_KEY = "myaistation_sessions";
const SETTINGS_KEY = "myaistation_settings";

const defaultSettings: AppSettings = {
  openCodeApiKey: "",
  githubToken: "",
  defaultModel: "big-pickle",
  theme: "light",
};

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [model, setModel] = useState(defaultSettings.defaultModel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed: ChatSession[] = JSON.parse(s);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentId(parsed[0].id);
      }
      const st = localStorage.getItem(SETTINGS_KEY);
      if (st) {
        const parsedSettings = JSON.parse(st);
        setSettings(parsedSettings);
        setModel(parsedSettings.defaultModel || "big-pickle");
      }
    } catch {}
  }, []);

  // Persist sessions
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === currentId);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    error,
  } = useChat({
    api: "/api/chat",
    body: {
      model,
      apiKey: settings.openCodeApiKey,
      githubToken: settings.githubToken,
    },
    initialMessages: currentSession?.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })) || [],
    onFinish: (message) => {
      // Update session after response
      if (!currentId) return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentId) return s;
          const newMsgs: Message[] = [
            ...s.messages,
            {
              id: message.id,
              role: "assistant",
              content: message.content,
              createdAt: new Date().toISOString(),
            },
          ];
          return {
            ...s,
            messages: newMsgs,
            updatedAt: new Date().toISOString(),
            title:
              s.title === "New Chat" && s.messages.length <= 1
                ? (s.messages[0]?.content || "Chat").slice(0, 40)
                : s.title,
          };
        })
      );
    },
  });

  // Sync messages when switching sessions
  useEffect(() => {
    if (currentSession) {
      setMessages(
        currentSession.messages.map((m) => ({
          id: m.id,
          role: m.role as any,
          content: m.content,
        }))
      );
      setModel(currentSession.model);
    } else {
      setMessages([]);
    }
  }, [currentId]); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = useCallback(() => {
    const id = uuidv4();
    const newSession: ChatSession = {
      id,
      title: "New Chat",
      messages: [],
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentId(id);
    setMessages([]);
    setAttachments([]);
  }, [model, setMessages]);

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrentId(remaining[0]?.id || null);
    }
  };

  const saveSettings = (s: AppSettings) => {
    setSettings(s);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    if (s.defaultModel) setModel(s.defaultModel);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: Attachment[] = [];
    for (const file of Array.from(files)) {
      const att: Attachment = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
      };
      if (file.type.startsWith("text/") || file.name.match(/\.(ts|tsx|js|jsx|json|md|py|css|html|txt)$/i)) {
        att.content = await file.text();
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        att.content = await new Promise((res) => {
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      newAtts.push(att);
    }
    setAttachments((prev) => [...prev, ...newAtts]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    if (!settings.openCodeApiKey) {
      setShowSettings(true);
      return;
    }

    // Ensure we have a session
    let sid = currentId;
    if (!sid) {
      const id = uuidv4();
      const newSession: ChatSession = {
        id,
        title: input.slice(0, 40) || "New Chat",
        messages: [],
        model,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentId(id);
      sid = id;
    }

    // Build content with attachments
    let content = input;
    if (attachments.length > 0) {
      const attText = attachments
        .map((a) => {
          if (a.content && !a.type.startsWith("image/")) {
            return `\n\n[File: ${a.name}]\n\`\`\`\n${a.content.slice(0, 8000)}\n\`\`\``;
          }
          return `\n[Attached: ${a.name}]`;
        })
        .join("");
      content += attText;
    }

    // Add user message to session
    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      attachments: attachments.length ? attachments : undefined,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sid
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              updatedAt: new Date().toISOString(),
              title: s.title === "New Chat" ? content.slice(0, 40) : s.title,
              model,
            }
          : s
      )
    );

    setAttachments([]);
    handleSubmit(e, { data: { content } });
  };

  const modelName =
    DEFAULT_MODELS.find((m) => m.id === model)?.name || model;

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={setCurrentId}
        onNew={createNewChat}
        onDelete={deleteSession}
        onOpenSettings={() => setShowSettings(true)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        modelName={modelName}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-white">
          <ModelSelector value={model} onChange={setModel} />
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            {settings.githubToken ? (
              <span className="flex items-center gap-1 text-[var(--duo-green)] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--duo-green)]" />
                GitHub connected
              </span>
            ) : (
              <button
                onClick={() => setShowSettings(true)}
                className="text-[var(--duo-blue)] font-semibold hover:underline"
              >
                Connect GitHub
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-[var(--chat-bg)]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white text-4xl font-extrabold shadow-lg mb-6">
                M
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--text)] mb-2">
                Welcome to MyAIStation!
              </h2>
              <p className="text-[var(--text-muted)] max-w-md mb-6">
                Chat with powerful OpenCode Zen models. Upload files, edit code, and work
                directly inside your GitHub repositories — all with a fun Duolingo vibe.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "List my GitHub repos",
                  "Explain this code",
                  "Create a new React component",
                  "Help me debug",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-4 py-2 rounded-2xl border-2 border-[var(--border)] bg-white font-semibold text-sm hover:border-[var(--duo-green)] hover:text-[var(--duo-green-dark)] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-3 message-enter max-w-3xl mx-auto",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white shrink-0 shadow">
                  <Bot size={18} />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[80%] shadow-sm",
                  m.role === "user"
                    ? "bg-[var(--duo-blue)] text-white rounded-br-md"
                    : "bg-white border border-[var(--border)] text-[var(--text)] rounded-bl-md"
                )}
              >
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">
                  {m.content}
                </div>
              </div>
              {m.role === "user" && (
                <div className="w-9 h-9 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white shrink-0 shadow">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-3xl mx-auto">
              <div className="w-9 h-9 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white shrink-0">
                <Bot size={18} />
              </div>
              <div className="bg-white border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--duo-green)] typing-dot" />
                <span className="w-2 h-2 rounded-full bg-[var(--duo-green)] typing-dot" />
                <span className="w-2 h-2 rounded-full bg-[var(--duo-green)] typing-dot" />
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-3xl mx-auto text-center text-red-500 text-sm font-semibold">
              {error.message}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--border)] bg-white p-4">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 max-w-3xl mx-auto">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] text-sm font-medium"
                >
                  {a.type.startsWith("image/") ? (
                    <ImageIcon size={14} />
                  ) : (
                    <FileText size={14} />
                  )}
                  <span className="truncate max-w-[120px]">{a.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                    className="text-[var(--text-muted)] hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="max-w-3xl mx-auto flex items-end gap-2"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--duo-green)] text-[var(--text-muted)] hover:text-[var(--duo-green)] transition-colors"
              title="Upload files or folders"
            >
              <Paperclip size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e as any);
                  }
                }}
                placeholder="Ask anything, or upload files & work with GitHub..."
                rows={1}
                className="w-full resize-none px-4 py-3 pr-12 rounded-2xl border-2 border-[var(--border)] focus:border-[var(--duo-green)] outline-none font-medium text-[15px] max-h-40 overflow-y-auto"
                style={{ minHeight: "52px" }}
              />
            </div>

            {isLoading ? (
              <button
                type="button"
                onClick={stop}
                className="p-3 rounded-2xl bg-[var(--duo-red)] text-white shadow-md"
              >
                <StopCircle size={22} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && attachments.length === 0}
                className="p-3 rounded-2xl bg-[var(--duo-green)] text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 active:scale-95 transition-all"
              >
                <Send size={22} />
              </button>
            )}
          </form>
          <p className="text-center text-xs text-[var(--text-muted)] mt-2">
            Powered by OpenCode Zen · GitHub tools enabled with your token
          </p>
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
