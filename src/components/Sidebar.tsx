"use client";

import { cn } from "@/lib/utils";
import { ChatSession } from "@/lib/types";
import {
  MessageSquarePlus,
  Settings,
  Trash2,
  X,
  Github,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SidebarProps {
  sessions: ChatSession[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  modelName: string;
}

export default function Sidebar({
  sessions,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onOpenSettings,
  mobileOpen,
  onCloseMobile,
  modelName,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          // Mobile: full screen panel
          "fixed inset-0 z-50 flex flex-col bg-[var(--sidebar-bg)] transition-transform duration-300 ease-out",
          // Desktop: normal side panel
          "md:static md:inset-auto md:w-[280px] md:border-r md:border-[var(--border)] md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
              M
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-lg leading-tight text-[var(--text)] truncate">
                MyAIStation
              </h1>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {modelName}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] md:hidden"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-4">
          <button
            onClick={() => {
              onNew();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 btn-duo text-sm py-3"
          >
            <MessageSquarePlus size={20} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {sessions.length === 0 && (
            <p className="text-center text-sm text-[var(--text-muted)] py-8 px-4">
              No chats yet
            </p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-2xl px-3.5 py-3 cursor-pointer transition-colors",
                currentId === s.id
                  ? "bg-[var(--duo-green)]/15 text-[var(--duo-green-dark)]"
                  : "hover:bg-[var(--bg-secondary)] text-[var(--text)]"
              )}
              onClick={() => {
                onSelect(s.id);
                onCloseMobile();
              }}
            >
              <Sparkles
                size={16}
                className={cn(
                  "shrink-0",
                  currentId === s.id ? "text-[var(--duo-green)]" : "text-[var(--text-muted)]"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{s.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatDate(s.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] space-y-1 shrink-0 safe-area-pb">
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 hover:bg-[var(--bg-secondary)] text-[var(--text)] transition-colors"
          >
            <Settings size={20} />
            <span className="font-semibold text-sm">Settings</span>
          </button>
          <div className="flex items-center gap-2 px-3.5 py-2 text-xs text-[var(--text-muted)]">
            <Github size={14} />
            <span>GitHub tools ready</span>
          </div>
        </div>
      </aside>
    </>
  );
}
