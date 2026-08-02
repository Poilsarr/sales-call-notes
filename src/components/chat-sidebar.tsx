'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Send, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  relevantCalls?: Array<{ id: string; filename: string; date: string; summary: string | null }>;
}

export function ChatSidebar() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageKeyRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const quickQueries = [
    'What objections were raised in my recent calls?',
    'Show all commitments from last week',
    'Which calls had budget mentioned?',
    'Summarize key decisions across calls',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.id) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg, _key: ++messageKeyRef.current } as any]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg, userId: user.id }),
      });
      const data = await res.json();
      // ponytail: show server error message instead of generic fallback
      const content = !res.ok && data.error
        ? `Error: ${data.error}`
        : data.answer || 'No response available.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        relevantCalls: data.relevantCalls,
        _key: ++messageKeyRef.current,
      } as any]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ponytail: column must `h-full` (already on parent), messages area needs `min-h-0` so the bounded flex-1 scroll stops at the parent height instead of growing forever; input form stays pinned to bottom regardless of message count.
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <MessageSquare className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-medium text-white">AI Chat</h2>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((msg) => (
          <motion.div
            key={(msg as any)._key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-500/10 text-emerald-100 ml-8' 
                : 'bg-zinc-800 text-zinc-300 mr-8'
            }`}
          >
            <p>{msg.content}</p>
            {msg.relevantCalls && msg.relevantCalls.length > 0 && (
              <div className="mt-2 pt-2 border-t border-zinc-700">
                <p className="text-xs text-zinc-500 mb-1">Referenced calls:</p>
                {msg.relevantCalls.map(call => (
                  <Link
                    key={call.id}
                    href={`/app/calls/${call.id}`}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mb-1"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{call.filename}</span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm" aria-label="Loading response">
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="space-y-2 mb-4 shrink-0">
        {quickQueries.map((query, index) => (
          <button
            key={index}
            onClick={() => setInput(query)}
            className="w-full text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-2 rounded-lg transition-colors"
          >
            {query}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this call..."
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
