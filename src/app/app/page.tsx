'use client';

import { StatCard, BentoGrid } from '@/components/bento-stats';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-400">Overview of your call analytics and performance</p>
      </div>

      <BentoGrid>
        <StatCard
          title="Total Calls"
          value={127}
          subtitle="Last 30 days"
          trend="up"
          delay={0}
        />
        <StatCard
          title="Avg Health Score"
          value="78%"
          subtitle="Across all calls"
          trend="up"
          delay={0.1}
        />
        <StatCard
          title="Pending Actions"
          value={12}
          subtitle="Require attention"
          trend="neutral"
          delay={0.2}
        />
        <StatCard
          title="Avg Close Rate"
          value="34%"
          subtitle="Enrollment calls"
          trend="up"
          delay={0.3}
        />
        <StatCard
          title="Avg Talk Ratio"
          value="42/58"
          subtitle="Rep/Prospect"
          trend="neutral"
          delay={0.4}
        />
        <StatCard
          title="Objections Handled"
          value="89%"
          subtitle="Resolution rate"
          trend="up"
          delay={0.5}
        />
      </BentoGrid>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="doppel-outer"
      >
        <div className="doppel-inner p-6">
          <h2 className="text-lg font-medium text-white mb-4">Recent Calls</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-zinc-800">
              <div>
                <p className="text-white font-medium">Clean Sky Energy - Janine Corriere</p>
                <p className="text-sm text-zinc-500">Today at 2:15 PM</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                85% Health
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
