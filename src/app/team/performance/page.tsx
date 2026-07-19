'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/nav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Phone, TrendingUp, Target } from 'lucide-react';

interface CallPerformance {
  id: string;
  filename: string;
  createdAt: string;
  healthScore: number | null;
  sentiment: string | null;
  ownerName: string;
  assigneeName: string | null;
  actionItemCount: number;
  openActionItems: number;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
}

export default function TeamPerformancePage() {
  const { user } = useUser();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && !isSignedIn) router.replace('/sign-in');
  }, [authLoaded, isSignedIn, router]);

  const [calls, setCalls] = useState<CallPerformance[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'health'>('date');
  const [filterOwner, setFilterOwner] = useState<string>('');

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const res = await fetch('/api/team/performance');
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
        setMembers(data.members || []);
      } else if (res.status === 401) {
        router.replace('/sign-in');
      }
    } catch (err) {
      console.error('Failed to fetch performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortedCalls = [...calls]
    .filter((call) => !filterOwner || call.ownerName === filterOwner)
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.healthScore || 0) - (a.healthScore || 0);
    });

  const exportCSV = () => {
    const headers = ['Date', 'Call', 'Owner', 'Assignee', 'Health Score', 'Sentiment', 'Action Items', 'Open'];
    const rows = sortedCalls.map((call) => [
      new Date(call.createdAt).toLocaleDateString(),
      call.filename,
      call.ownerName,
      call.assigneeName || '',
      call.healthScore?.toString() || '',
      call.sentiment || '',
      call.actionItemCount,
      call.openActionItems,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-linear-black text-white">
        <Nav />
        <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-linear-indigo" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-black text-white">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Team Performance</h1>
            <p className="text-white/40 text-sm mt-1">All calls across your workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info">
              <Phone className="w-3 h-3" /> {calls.length} calls
            </Badge>
            <button
              onClick={exportCSV}
              disabled={calls.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition disabled:opacity-50"
            >
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'health')}
                  className="px-3 py-1.5 rounded-lg bg-linear-black border border-linear-secondary text-sm text-white"
                >
                  <option value="date">Date</option>
                  <option value="health">Health Score</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Owner</span>
                <select
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-linear-black border border-linear-secondary text-sm text-white"
                >
                  <option value="">All</option>
                  {Array.from(new Set(calls.map((c) => c.ownerName))).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {sortedCalls.length === 0 ? (
              <div className="p-8 text-center">
                <Phone className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No calls yet</p>
                <p className="text-xs text-white/30 mt-1">Calls shared with the team will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/[0.02] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                        Call
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                        Health
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                        Sentiment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedCalls.map((call) => (
                      <tr key={call.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4 text-sm text-white/60 whitespace-nowrap">
                          {new Date(call.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/app/calls/${call.id}`}
                            className="text-sm font-medium text-white hover:text-linear-indigo transition"
                          >
                            {call.filename}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-white/60">{call.ownerName}</td>
                        <td className="px-6 py-4">
                          {call.healthScore !== null ? (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                               <span className="text-sm text-emerald-400">{Math.round((call.healthScore || 0) * 100)}%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {call.sentiment ? (
                            <Badge
                              variant={
                                call.sentiment === 'positive'
                                  ? 'success'
                                  : call.sentiment === 'negative'
                                  ? 'default'
                                  : 'default'
                              }
                            >
                              {call.sentiment}
                            </Badge>
                          ) : (
                            <span className="text-sm text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-white/60">
                            <Target className="w-3 h-3" />
                            {call.openActionItems}/{call.actionItemCount}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
