'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';

interface CallTitleEditorProps {
  displayName: string;
  onSave: (title: string | null) => Promise<boolean>;
  disabled?: boolean;
  onClose?: () => void;
}

export function CallTitleEditor({ displayName, onSave, disabled, onClose }: CallTitleEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pencilRef = useRef<HTMLButtonElement>(null);
  const wasEditingRef = useRef(false);

  useEffect(() => {
    if (editing) {
      setValue(displayName);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, displayName]);

  useEffect(() => {
    if (wasEditingRef.current && !editing) pencilRef.current?.focus();
    wasEditingRef.current = editing;
  }, [editing]);

  const close = () => {
    setEditing(false);
    setSaving(false);
    onClose?.();
  };

  const save = async () => {
    if (saving) return;
    const trimmed = value.trim();
    const next = trimmed.length === 0 ? null : trimmed;
    setSaving(true);
    const ok = await onSave(next);
    setSaving(false);
    if (ok) close();
  };

  if (editing) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-2 min-w-0"
        onBlur={(e) => {
          if (saving) return;
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
        }}
      >
        <input
          ref={inputRef}
          value={value}
          maxLength={120}
          dir="auto"
          aria-label="Call title"
          disabled={saving}
          className="min-w-0 flex-1 rounded-md bg-zinc-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-emerald-500/50"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) void save();
            if (e.key === 'Escape') close();
          }}
        />
        <button
          aria-label="Save title"
          disabled={saving}
          className="shrink-0 p-1.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
          onClick={() => void save()}
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          aria-label="Cancel"
          disabled={saving}
          className="shrink-0 p-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          onClick={close}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      ref={pencilRef}
      aria-label="Rename call"
      disabled={disabled}
      className="shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
  );
}
