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
  Menu,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [model, setModel] = useState(defaultSettings.defaultModel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    initialMessages:
      currentSession?.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })) || [],
    onFinish: (message) => {
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
      if (
        file.type.startsWith("text/") ||
        file.name.match(/\.(ts|tsx|js|jsx|json|md|py|css|html|txt)$/i)
      ) {
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

  const modelName = DEFAULT_MODELS.find((m) => m.id === model)?.name || model;

  return (
    <div className="flex h-[100dvh] bg-[var(--bg)] overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={setCurrentId}
        onNew={createNewChat}
        onDelete={deleteSession}
        onOpenSettings={() => setShowSettings(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        modelName={modelName}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Minimal top bar */}
        <header className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)] bg-white shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text)] md:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <ModelSelector value={model} onChange={setModel} />
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)] shrink-0">
            {settings.githubToken ? (
              <span className="flex items-center gap-1 text-[var(--duo-green)] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--duo-green)]" />
                GitHub
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
        <div className="flex-1 overflow-y-auto px-3 py-4 pb-28 space-y-4 bg-[var(--chat-bg)]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-14 h-14 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white text-2xl font-extrabold shadow-md mb-4">
                M
              </div>
              <h2 className="text-xl font-extrabold text-[var(--text)] mb-1.5">
                MyAIStation
              </h2>
              <p className="text-sm text-[var(--text-muted)] max-w-xs mb-5">
                Chat with OpenCode Zen • Upload files • Work in your GitHub
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "List my repos",
                  "Explain this code",
                  "Create a component",
                  "Help me debug",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-2xl border border-[var(--border)] bg-white font-semibold text-xs hover:border-[var(--duo-green)] hover:text-[var(--duo-green-dark)] transition-colors"
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
                "flex gap-2 message-enter max-w-2xl mx-auto",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                  <Bot size={14} />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 max-w-[85%] shadow-sm text-[14px] leading-relaxed",
                  m.role === "user"
                    ? "bg-[var(--duo-blue)] text-white rounded-br-md"
                    : "bg-white border border-[var(--border)] text-[var(--text)] rounded-bl-md"
                )}
              >
                <div className="whitespace-pre-wrap font-medium">{m.content}</div>
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-[var(--duo-blue)] flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="w-7 h-7 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-white border border-[var(--border)] rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--duo-green)] typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--duo-green)] typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--duo-green)] typing-dot" />
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto text-center text-red-500 text-xs font-semibold">
              {error.message}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating input bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-2 pointer-events-none safe-area-pb">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur border border-[var(--border)] text-xs font-medium shadow-sm"
                  >
                    {a.type.startsWith("image/") ? (
                      <ImageIcon size={12} />
                    ) : (
                      <FileText size={12} />
                    )}
                    <span className="truncate max-w-[100px]">{a.name}</span>
                    <button
                      onClick={() =>
                        setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                      }
                      className="text-[var(--text-muted)] hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="flex items-end gap-2 bg-white/95 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-lg p-2"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--duo-green)] transition-colors shrink-0"
                title="Upload files"
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e as any);
                  }
                }}
                placeholder="Message..."
                rows={1}
                className="flex-1 resize-none px-2 py-2.5 bg-transparent outline-none font-medium text-[14px] max-h-32 overflow-y-auto"
                style={{ minHeight: "40px" }}
              />

              {isLoading ? (
                <button
                  type="button"
                  onClick={stop}
                  className="p-2.5 rounded-xl bg-[var(--duo-red)] text-white shadow-sm shrink-0"
                >
                  <StopCircle size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && attachments.length === 0}
                  className="p-2.5 rounded-xl bg-[var(--duo-green)] text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 active:scale-95 transition-all shrink-0"
                >
                  <Send size={20} />
                </button>
              )}
            </form>
          </div>
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
