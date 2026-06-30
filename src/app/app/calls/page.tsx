'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, Phone, Download, Upload, Mic, Chrome } from 'lucide-react';
import UpgradePrompt from '@/components/upgrade-prompt';
import { toast } from 'sonner';

interface CallEntry {
  id: string;
  filename: string;
  createdAt: string;
  healthScore: number | null;
  sentiment: string | null;
  summary: string | null;
  actionItems: Array<{ task: string; owner: string; due: string | null }>;
  sharedWithTeam?: boolean;
  ownerName?: string | null;
  assigneeName?: string | null;
}

export default function CallsPage() {
  const { user } = useUser();
  const [calls, setCalls] = useState<CallEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const url = searchQuery.trim()
      ? `/api/history?userId=${user.id}&q=${encodeURIComponent(searchQuery.trim())}`
      : `/api/history?userId=${user.id}`;
    fetch(url)
      .then(r => r.json())
      .then(data => setCalls(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load calls'))
      .finally(() => setLoading(false));
  }, [user?.id, searchQuery]);

  // Server-side search already filtered; the client-side filter below
  // remains as a defensive narrowing on filename/summary (matches what
  // users would expect from the visible placeholder).
  const filteredCalls = calls.filter(call =>
    !searchQuery.trim() ||
    (call.filename || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (call.summary && call.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    // The full transcript match comes back from the server; this catches
    // case-insensitive hits in filename/summary even if server missed.
    false
  );

  const exportCSV = () => {
    const headers = 'Filename,Date,Health Score,Sentiment,Action Items,Summary\n';
    const rows = calls.map(c =>
      `"${c.filename}","${new Date(c.createdAt).toLocaleDateString()}",${c.healthScore ?? ''},"${c.sentiment ?? ''}",${c.actionItems.length},"${(c.summary || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calls-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${calls.length} calls to CSV`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Calls</h1>
          <p className="text-zinc-400">Browse and search your call history</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="rounded-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={calls.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link href="/app/record" className="btn-island">
            Record Call
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search all calls (filename, transcript, summary)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button onClick={() => searchRef.current?.focus()} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">
          <Filter className="w-5 h-5 text-zinc-400" />
        </button>
      </div>
      
      <UpgradePrompt feature="crm_sync" featureName="CRM Sync" minimal />

      <div className="space-y-3">
        {loading ? (
          <p className="text-zinc-500 text-center py-12">Loading calls...</p>
        ) : filteredCalls.length === 0 ? (
          // Visual empty state — same pattern as the /app dashboard
          // recent-calls empty state. Was a one-liner that made the
          // page feel "unbuilt". Now: header with icon + h-line +
          // body + 3 numbered onboarding steps (Upload, Record, Chrome
          // extension), the most impactful (Upload) styled as the
          // primary action. Distinguishes "no calls yet" (empty data)
          // from "no search results" (defensive).
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 sm:p-8">
            {calls.length === 0 ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-[#F26522]/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#F26522]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-white">
                      No calls yet.
                    </p>
                    <p className="text-[12.5px] text-zinc-500 mt-0.5">
                      Every call you upload shows up here, fully transcribed and searchable.
                    </p>
                  </div>
                </div>
                <ol className="space-y-2.5 text-[13px]">
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#F26522] text-white text-[11px] font-mono font-semibold flex items-center justify-center">
                      1
                    </span>
                    <Link
                      href="/app/record"
                      className="flex-1 flex items-center justify-between"
                    >
                      <span className="text-white font-medium inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#F26522]" />
                        Upload an MP3 / paste a URL
                      </span>
                      <span className="text-[11px] text-zinc-500">~30s</span>
                    </Link>
                  </li>
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-mono font-semibold flex items-center justify-center">
                      2
                    </span>
                    <Link
                      href="/app/record"
                      className="flex-1 flex items-center justify-between"
                    >
                      <span className="text-white font-medium inline-flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-zinc-300" />
                        Record a call in the browser
                      </span>
                      <span className="text-[11px] text-zinc-500">live transcript</span>
                    </Link>
                  </li>
                  <li className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-mono font-semibold flex items-center justify-center">
                      3
                    </span>
                    <Link
                      href="/extension"
                      className="flex-1 flex items-center justify-between"
                    >
                      <span className="text-white font-medium inline-flex items-center gap-1.5">
                        <Chrome className="w-3.5 h-3.5 text-zinc-300" />
                        Capture live from Google Meet
                      </span>
                      <span className="text-[11px] text-zinc-500">auto-save</span>
                    </Link>
                  </li>
                </ol>
              </>
            ) : (
              // Defensive: the server returned calls but the client-side
              // filter excluded all of them. Plain "no results" state.
              <p className="text-zinc-500 text-center py-6">
                No calls match &ldquo;{searchQuery}&rdquo;. Try a shorter search.
              </p>
            )}
          </div>
        ) : (
          filteredCalls.map((call, index) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/app/calls/${call.id}`}>
                <div className="doppel-outer hover:ring-emerald-500/30 transition-all cursor-pointer">
                  <div className="doppel-inner p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{call.filename}</p>
                        <p className="text-sm text-zinc-500">
                          {new Date(call.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {call.actionItems.length > 0 && ` · ${call.actionItems.length} action items`}
                          {call.ownerName && ` · Owner: ${call.ownerName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {call.sharedWithTeam && (
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-300">
                          Shared
                        </span>
                      )}
                      {call.assigneeName && (
                        <span className="px-3 py-1 rounded-full text-sm bg-violet-500/10 text-violet-300">
                          {call.assigneeName}
                        </span>
                      )}
                      {call.healthScore != null && (
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          call.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                          call.healthScore >= 60 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {Math.round(call.healthScore)}% Health
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
