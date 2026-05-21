'use client';

import { motion } from 'framer-motion';
import { CheckCircle, TrendingUp } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: {
    executiveSummary: string;
    healthScore: number;
    actionItems: Array<{ task: string; owner: string; priority: string }>;
    keyDecisions: string[];
    nextSteps: Array<{ step: string; date: string }>;
  };
}

export function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Executive Summary</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">{analysis.executiveSummary}</p>
      </div>
      
      <div className="doppel-outer">
        <div className="doppel-inner p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Health Score</span>
            <span className="text-2xl font-semibold text-emerald-400">{analysis.healthScore}%</span>
          </div>
          <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.healthScore}%` }}
              transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Action Items
        </h3>
        <div className="space-y-2">
          {analysis.actionItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-zinc-800/50 rounded-lg">
              <span className="text-sm text-zinc-300">{item.task}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                item.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                'bg-zinc-700 text-zinc-400'
              }`}>
                {item.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Key Decisions
        </h3>
        <ul className="space-y-2">
          {analysis.keyDecisions.map((decision, index) => (
            <li key={index} className="text-sm text-zinc-400 flex items-start gap-2">
              <span className="text-emerald-400 mt-1">•</span>
              {decision}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
