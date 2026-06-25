'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Clipboard, X } from 'lucide-react';
import { toast } from 'sonner';

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
}

export function TranscriptViewer({ segments }: { segments: TranscriptSegment[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);

  const filteredSegments = segments.filter(s =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute the selected snippet based on range timestamps.
  // We snap to the segment whose timestamp is closest to the pick.
  const selectedSnippet = useMemo(() => {
    if (rangeStart === null || rangeEnd === null) return null;
    const lo = Math.min(rangeStart, rangeEnd);
    const hi = Math.max(rangeStart, rangeEnd);
    const picked = segments.filter(s => s.timestamp >= lo && s.timestamp <= hi);
    return picked.length > 0 ? picked : null;
  }, [rangeStart, rangeEnd, segments]);

  const copySnippet = async () => {
    if (!selectedSnippet || selectedSnippet.length === 0) return;
    const start = selectedSnippet[0].timestamp;
    const end = selectedSnippet[selectedSnippet.length - 1].timestamp;
    const dur = Math.round(end - start);
    const lines = selectedSnippet.map(
      (s) => `[${formatTime(s.timestamp)}] ${s.speaker}: ${s.text}`
    );
    const text = `📞 Call snippet (${selectedSnippet.length} turn${selectedSnippet.length === 1 ? '' : 's'}, ${dur}s)\n\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${selectedSnippet.length} turn${selectedSnippet.length === 1 ? '' : 's'} to clipboard`);
    } catch {
      toast.error('Could not copy. Select the text manually.');
    }
  };

  const onSegmentClick = (timestamp: number) => {
    if (rangeStart === null || (rangeStart !== null && rangeEnd !== null)) {
      // Start a new range
      setRangeStart(timestamp);
      setRangeEnd(null);
    } else {
      // Complete the range
      setRangeEnd(timestamp);
    }
  };

  const clearSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
  };

  const inRange = (timestamp: number) => {
    if (rangeStart === null) return false;
    if (rangeEnd === null) return timestamp === rangeStart;
    const lo = Math.min(rangeStart, rangeEnd);
    const hi = Math.max(rangeStart, rangeEnd);
    return timestamp >= lo && timestamp <= hi;
  };

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

      {selectedSnippet && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between"
        >
          <span className="text-xs text-emerald-300">
            {selectedSnippet.length} turn{selectedSnippet.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={copySnippet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition"
            >
              <Clipboard className="w-3.5 h-3.5" />
              Copy snippet
            </button>
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-full hover:bg-emerald-500/20 transition"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5 text-emerald-300" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredSegments.map((segment, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => onSegmentClick(segment.timestamp)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.6) }}
            className={`w-full text-left flex gap-3 p-2 rounded-lg transition-colors ${
              inRange(segment.timestamp)
                ? 'bg-emerald-500/15 border border-emerald-500/40'
                : 'hover:bg-zinc-800/60 border border-transparent'
            } ${rangeStart === segment.timestamp && rangeEnd === null ? 'ring-1 ring-emerald-400' : ''}`}
          >
            <span className="text-xs text-zinc-500 font-mono mt-1 shrink-0">
              {formatTime(segment.timestamp)}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-emerald-400">{segment.speaker}</span>
              <p className="text-sm text-zinc-300 mt-1">{segment.text}</p>
            </div>
          </motion.button>
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
