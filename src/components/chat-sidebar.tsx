'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';

export function ChatSidebar() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickQueries = [
    'What objections were raised?',
    'Show all commitments',
    'What is the talk ratio?',
    'Summarize key decisions',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'This is a simulated response. In production, this would call the /api/chat endpoint.' }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-medium text-white">AI Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-500/10 text-emerald-100 ml-8' 
                : 'bg-zinc-800 text-zinc-300 mr-8'
            }`}
          >
            {msg.content}
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
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
      
      <form onSubmit={handleSubmit} className="flex gap-2">
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
