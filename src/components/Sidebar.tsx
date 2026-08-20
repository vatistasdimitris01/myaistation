"use client";

import { cn } from "@/lib/utils";
import { ChatSession } from "@/lib/types";
import {
  MessageSquarePlus,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeft,
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
  collapsed: boolean;
  onToggle: () => void;
  modelName: string;
}

export default function Sidebar({
  sessions,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onOpenSettings,
  collapsed,
  onToggle,
  modelName,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-[var(--border)] bg-[var(--sidebar-bg)] transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[280px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[var(--duo-green)] flex items-center justify-center text-white font-extrabold text-lg shadow-md">
              M
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight text-[var(--text)]">
                MyAIStation
              </h1>
              <p className="text-xs text-[var(--text-muted)] truncate max-w-[140px]">
                {modelName}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={onNew}
          className={cn(
            "w-full flex items-center justify-center gap-2 btn-duo",
            collapsed && "px-0"
          )}
        >
          <MessageSquarePlus size={20} />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {sessions.length === 0 && !collapsed && (
          <p className="text-center text-sm text-[var(--text-muted)] py-8 px-4">
            No chats yet. Start a new one!
          </p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={cn(
              "group relative flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors",
              currentId === s.id
                ? "bg-[var(--duo-green)]/15 text-[var(--duo-green-dark)]"
                : "hover:bg-[var(--bg-secondary)] text-[var(--text)]"
            )}
            onClick={() => onSelect(s.id)}
          >
            <Sparkles
              size={16}
              className={cn(
                "shrink-0",
                currentId === s.id ? "text-[var(--duo-green)]" : "text-[var(--text-muted)]"
              )}
            />
            {!collapsed && (
              <>
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
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 text-red-500 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <button
          onClick={onOpenSettings}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--bg-secondary)] text-[var(--text)] transition-colors",
            collapsed && "justify-center"
          )}
        >
          <Settings size={20} />
          {!collapsed && <span className="font-semibold text-sm">Settings</span>}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)]">
            <Github size={14} />
            <span>GitHub tools ready</span>
          </div>
        )}
      </div>
    </aside>
  );
}
