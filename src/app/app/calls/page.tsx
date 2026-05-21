'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, Phone } from 'lucide-react';

const mockCalls = [
  { id: '1', customer: 'Janine Corriere', company: 'Clean Sky Energy', date: 'Today at 2:15 PM', healthScore: 85, status: 'completed' },
  { id: '2', customer: 'John Smith', company: 'Solar Plus', date: 'Yesterday at 10:30 AM', healthScore: 72, status: 'completed' },
  { id: '3', customer: 'Sarah Johnson', company: 'Green Energy Co', date: '2 days ago', healthScore: 91, status: 'completed' },
];

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCalls = mockCalls.filter(call =>
    call.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Calls</h1>
          <p className="text-zinc-400">Browse and search your call history</p>
        </div>
        <Link href="/app/record" className="btn-island">
          Record Call
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">
          <Filter className="w-5 h-5 text-zinc-400" />
        </button>
      </div>
      
      <div className="space-y-3">
        {filteredCalls.map((call, index) => (
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
                      <p className="text-white font-medium">{call.customer}</p>
                      <p className="text-sm text-zinc-500">{call.company} • {call.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      call.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                      call.healthScore >= 60 ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {call.healthScore}% Health
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
