"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

interface Command {
  id: string;
  label: string;
  icon: string;
  href: string;
  shortcut?: string;
}

const commands: Command[] = [
  { id: "dashboard", label: "Go to Dashboard", icon: "🚀", href: "/dashboard" },
  { id: "integrations", label: "Configure Integrations (Salesforce / HubSpot)", icon: "🔌", href: "/integrations" },
  { id: "pricing", label: "View Pricing", icon: "💳", href: "/pricing" },
  { id: "docs", label: "Documentation", icon: "📄", href: "/api-docs" },
  { id: "app", label: "Open App", icon: "🎙️", href: "/app" },
  { id: "settings", label: "Settings", icon: "⚙️", href: "/settings" },
  { id: "billing", label: "Billing", icon: "💳", href: "/billing" },
  { id: "team", label: "Team", icon: "👥", href: "/team" },
  { id: "changelog", label: "Changelog", icon: "📋", href: "/changelog" },
  { id: "status", label: "System Status", icon: "🔵", href: "/status" },
];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const activeIndexRef = useRef(0);

  const filtered = query.trim()
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={() => { setOpen(false); setQuery(""); }}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-lg overflow-hidden",
          "bg-gray-950 border border-gray-800 rounded-xl shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-150",
        )}
      >
        <div className="flex items-center gap-3 border-b border-gray-800 px-4">
          <span className="text-white/40 text-sm">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-white/30 outline-none"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-white/30">
              No results found.
            </p>
          )}
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => handleSelect(cmd.href)}
              onMouseEnter={() => { activeIndexRef.current = commands.indexOf(cmd); }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                "text-white/70 hover:text-white hover:bg-white/5",
              )}
            >
              <span className="text-base leading-none">{cmd.icon}</span>
              <span className="flex-1">{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
