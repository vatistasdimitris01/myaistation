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
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] transition-transform duration-300 ease-out md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header - minimal */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
              M
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-base leading-tight text-[var(--text)] truncate">
                MyAIStation
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {modelName}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNew();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 btn-duo text-sm py-2.5"
          >
            <MessageSquarePlus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions - minimal list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {sessions.length === 0 && (
            <p className="text-center text-xs text-[var(--text-muted)] py-6 px-3">
              No chats yet
            </p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group relative flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-colors",
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
                size={14}
                className={cn(
                  "shrink-0",
                  currentId === s.id ? "text-[var(--duo-green)]" : "text-[var(--text-muted)]"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] truncate">{s.title}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {formatDate(s.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-red-500 transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer - minimal */}
        <div className="p-3 border-t border-[var(--border)] space-y-0.5">
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[var(--bg-secondary)] text-[var(--text)] transition-colors"
          >
            <Settings size={18} />
            <span className="font-semibold text-sm">Settings</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--text-muted)]">
            <Github size={12} />
            <span>GitHub tools ready</span>
          </div>
        </div>
      </aside>
    </>
  );
}
