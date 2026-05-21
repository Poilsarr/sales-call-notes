'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download } from 'lucide-react';

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
}

export function TranscriptViewer({ segments }: { segments: TranscriptSegment[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredSegments = segments.filter(s => 
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">Transcript</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-48"
            />
          </div>
          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <Download className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        {filteredSegments.map((segment, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-3"
          >
            <span className="text-xs text-zinc-500 font-mono mt-1">
              {formatTime(segment.timestamp)}
            </span>
            <div className="flex-1">
              <span className="text-xs font-medium text-emerald-400">{segment.speaker}</span>
              <p className="text-sm text-zinc-300 mt-1">{segment.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
