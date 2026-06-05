'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, Phone, Download } from 'lucide-react';
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
    fetch(`/api/history?userId=${user.id}`)
      .then(r => r.json())
      .then(data => setCalls(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load calls'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filteredCalls = calls.filter(call =>
    (call.filename || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (call.summary && call.summary.toLowerCase().includes(searchQuery.toLowerCase()))
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
            placeholder="Search calls by filename or summary..."
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
          <p className="text-zinc-500 text-center py-12">
            {calls.length === 0 ? 'No calls found. Upload your first call to get started.' : 'No calls match your search.'}
          </p>
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
