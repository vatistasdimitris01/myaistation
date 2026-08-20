"use client";

import { AppSettings } from "@/lib/types";
import { X, Key, Github, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [local, setLocal] = useState(settings);
  const [showZen, setShowZen] = useState(false);
  const [showGh, setShowGh] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-[var(--border)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--duo-green)] text-white">
          <h2 className="font-extrabold text-xl">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* OpenCode Zen Key */}
          <div>
            <label className="flex items-center gap-2 font-bold text-sm text-[var(--text)] mb-2">
              <Key size={16} className="text-[var(--duo-green)]" />
              OpenCode Zen API Key
            </label>
            <div className="relative">
              <input
                type={showZen ? "text" : "password"}
                value={local.openCodeApiKey}
                onChange={(e) => setLocal({ ...local, openCodeApiKey: e.target.value })}
                placeholder="Paste your key from opencode.ai/auth"
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-[var(--border)] focus:border-[var(--duo-green)] outline-none font-medium text-sm"
              />
              <button
                type="button"
                onClick={() => setShowZen(!showZen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showZen ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Get it free at{" "}
              <a
                href="https://opencode.ai/auth"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--duo-blue)] underline"
              >
                opencode.ai/auth
              </a>
            </p>
          </div>

          {/* GitHub Token */}
          <div>
            <label className="flex items-center gap-2 font-bold text-sm text-[var(--text)] mb-2">
              <Github size={16} className="text-[var(--text)]" />
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showGh ? "text" : "password"}
                value={local.githubToken}
                onChange={(e) => setLocal({ ...local, githubToken: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-[var(--border)] focus:border-[var(--duo-green)] outline-none font-medium text-sm"
              />
              <button
                type="button"
                onClick={() => setShowGh(!showGh)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showGh ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Needs <code className="bg-[var(--bg-secondary)] px-1 rounded">repo</code> scope for full
              access. Create at{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--duo-blue)] underline"
              >
                github.com/settings/tokens
              </a>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(local);
                onClose();
              }}
              className="flex-1 btn-duo"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
