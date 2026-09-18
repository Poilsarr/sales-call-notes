'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import {
  BOT_NAME,
  QUICK_REPLIES,
  SUPPORT_EMAIL,
  findSupportAnswer,
} from '@/lib/support-bot';

interface ChatMsg {
  role: 'user' | 'bot';
  text: string;
}

/**
 * Floating support chatbot — fixed to the bottom-right of the viewport so it
 * NEVER requires scrolling to reach. `position: fixed` keeps it intact in
 * place on every page while the user scrolls.
 *
 * Answers are resolved synchronously via `findSupportAnswer` (no fetch, no
 * delay). To change answers, edit `src/lib/support-bot.ts`.
 */
export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'bot',
      text: `Hi! I'm ${BOT_NAME} assistant. Ask me anything — features, pricing, integrations, or support. You can always reach our team at ${SUPPORT_EMAIL}.`,
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      // Focus input after the open animation so typing can start immediately.
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open ]);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    // Instant local answer — no fetch, no artificial delay.
    const { answer } = findSupportAnswer(text);
    setMessages((prev) => [...prev, { role: 'user', text }, { role: 'bot', text: answer }]);
    setInput('');
  }, []);

  /** Render emails/URLs as clickable links inside bot + user bubbles. */
  const renderText = (text: string) => {
    const parts = text.split(/(\S+@\S+\.\S+|https?:\/\/\S+)/g);
    return parts.map((part, i) => {
      if (/^\S+@\S+\.\S+$/.test(part)) {
        return (
          <a
            key={i}
            href={`mailto:${part.replace(/[.,!?;]+$/, '')}`}
            className="underline underline-offset-2 break-words hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      if (/^https?:\/\/\S+/.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-words hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Chat panel — fixed above the launcher, always in the same place */}
      {open && (
        <div
          role="dialog"
          aria-label={`${BOT_NAME} support chat`}
          className="fixed bottom-24 right-4 sm:right-5 z-[90] flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl w-[calc(100vw-2rem)] max-w-[370px] h-[520px] max-h-[70vh]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#0a0a0b] px-4 py-3.5 shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F26522] text-white font-bold text-lg">
              G
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">{BOT_NAME}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-400 leading-tight">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online — replies instantly
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-2.5 bg-[#fafafa]" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#0a0a0b] text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-black/[0.07] shadow-sm rounded-bl-md'
                  }`}
                >
                  {renderText(m.text)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="flex gap-1.5 overflow-x-auto px-3 py-2 border-t border-black/[0.06] bg-white shrink-0">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11.5px] font-medium text-gray-700 hover:border-[#F26522] hover:text-[#F26522] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-black/[0.06] bg-white p-2.5 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              aria-label="Type your message"
              className="flex-1 min-w-0 rounded-full border border-black/10 bg-[#f5f5f5] px-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522] focus:bg-white"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F26522] text-white hover:bg-[#e05a1a] transition-colors disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Launcher — fixed bottom-right, never moves on scroll.
          Lifted on small screens (bottom-20) to clear the centered sticky
          CTA pills (sticky-marketing/pricing-cta, z-70) that span full width
          after 600px scroll; sm+ keeps the corner free at bottom-5. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        aria-expanded={open}
        className="fixed bottom-20 right-4 sm:bottom-5 sm:right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[#0a0a0b] text-white shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:bg-[#F26522] transition-colors"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
          </span>
        )}
      </button>
    </>
  );
}
