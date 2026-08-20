"use client";

import { cn } from "@/lib/utils";
import { ChatSession } from "@/lib/types";
import { X, Settings, Plus } from "lucide-react";
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
  userName?: string;
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
  userName = "You",
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-white transition-transform duration-300 ease-out",
          "md:static md:w-[300px] md:border-r md:border-[var(--border)] md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-4 safe-area-pt pb-3 pt-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center text-sm font-semibold text-[var(--text)]">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-[17px] text-[var(--text)]">{userName}</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[var(--text)] md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-1 pb-1">
          <p className="text-[13px] text-[var(--text-muted)] font-medium">Conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {sessions.length === 0 && (
            <p className="text-center text-sm text-[var(--text-muted)] py-12">No conversations yet</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s.id);
                onCloseMobile();
              }}
              className={cn(
                "w-full text-left px-3 py-3.5 rounded-xl transition-colors",
                currentId === s.id ? "bg-[#f5f5f7]" : "active:bg-[#f5f5f7]"
              )}
            >
              <p className="text-[16px] font-medium text-[var(--text)] truncate leading-snug">
                {s.title || "New conversation"}
              </p>
              <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{formatDate(s.updatedAt)}</p>
            </button>
          ))}
        </div>

        <div className="px-4 safe-area-pb pt-2 border-t border-[var(--border)] flex items-center gap-2">
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-11 h-11 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[var(--text)] shrink-0"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => {
              onNew();
              onCloseMobile();
            }}
            className="flex-1 h-11 rounded-full bg-[#f5f5f7] flex items-center justify-center gap-2 text-[var(--text)] font-medium text-[15px]"
          >
            <Plus size={18} />
            New conversation
          </button>
        </div>
      </aside>
    </>
  );
}
