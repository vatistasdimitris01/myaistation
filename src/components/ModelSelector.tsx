"use client";

import { DEFAULT_MODELS } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = DEFAULT_MODELS.find((m) => m.id === value) || DEFAULT_MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-[var(--border)] bg-white hover:bg-[var(--bg-secondary)] font-bold text-xs sm:text-sm text-[var(--text)] transition-colors max-w-full"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--duo-green)] shrink-0" />
        <span className="truncate">{current.name}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-56 max-h-72 overflow-y-auto bg-white border border-[var(--border)] rounded-2xl shadow-xl z-50 py-1.5">
          {DEFAULT_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-[var(--duo-green)]/10 transition-colors",
                m.id === value && "bg-[var(--duo-green)]/15 text-[var(--duo-green-dark)]"
              )}
            >
              <div className="truncate">{m.name}</div>
              <div className="text-[10px] font-normal text-[var(--text-muted)]">
                {m.provider}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
