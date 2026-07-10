'use client';

import { motion } from 'framer-motion';
import { CheckCircle, MessageSquareText, TrendingUp, Users2, Target } from 'lucide-react';
import type { SpeakerMetric } from '@/types';

interface Metric {
  score: number;
  evidence: string;
}

function MetricRow({ name, metric }: { name: string; metric: Metric }) {
  const percentage = (metric.score / 10) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{name}</span>
        <span className="text-white font-medium">{metric.score}/10</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: percentage / 100 }}
          style={{ transformOrigin: "left" }}
          className={`h-full ${percentage > 70 ? 'bg-emerald-500' : percentage > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
        />
      </div>
      <p className="text-[11px] text-zinc-500 italic leading-tight">{metric.evidence || 'No evidence found'}</p>
    </div>
  );
}

function FrameworkGroup({ title, metrics }: { title: string; metrics: Record<string, Metric> }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-emerald-500" />
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {Object.entries(metrics).map(([name, metric]) => (
          <MetricRow key={name} name={name} metric={metric} />
        ))}
      </div>
    </div>
  );
}

interface AnalysisPanelProps {

  analysis: {
    executiveSummary: string;
    healthScore: number;
    actionItems: Array<{ task: string; owner: string; priority: string }>;
    keyDecisions: string[];
    nextSteps: Array<{ step: string; date: string }>;
    interruptions?: number;
    questionsAsked?: number;
    speakerMetrics?: SpeakerMetric[];
    salesScorecard?: any;
  };
}

export function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-3">Executive Summary</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">{analysis.executiveSummary}</p>
      </div>

      {analysis.salesScorecard && (
        <div className="doppel-outer">
          <div className="doppel-inner p-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Sales Qualification
              </h2>
              <div className="text-right">
                <span className="text-xs text-zinc-500 block uppercase font-bold">Overall Score</span>
                <span className="text-2xl font-bold text-emerald-400">{analysis.salesScorecard.overallScore}%</span>
              </div>
            </div>

            <div className="space-y-8">
              {analysis.salesScorecard.meddic && (
                <FrameworkGroup
                  title="MEDDIC"
                  metrics={analysis.salesScorecard.meddic}
                />
              )}
              {analysis.salesScorecard.bant && (
                <FrameworkGroup
                  title="BANT"
                  metrics={analysis.salesScorecard.bant}
                />
              )}
              {analysis.salesScorecard.spin && (
                <FrameworkGroup
                  title="SPIN"
                  metrics={analysis.salesScorecard.spin}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="doppel-outer">
        <div className="doppel-inner p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Health Score</span>
            <span className="text-2xl font-semibold text-emerald-400">{analysis.healthScore}%</span>
          </div>
          <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: analysis.healthScore / 100 }}
              transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
              style={{ transformOrigin: "left" }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="doppel-outer">
          <div className="doppel-inner p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Users2 className="w-4 h-4" />
              Interruptions
            </div>
            <div className="text-2xl font-semibold text-white">{analysis.interruptions ?? 0}</div>
          </div>
        </div>
        <div className="doppel-outer">
          <div className="doppel-inner p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <MessageSquareText className="w-4 h-4" />
              Questions Asked
            </div>
            <div className="text-2xl font-semibold text-white">{analysis.questionsAsked ?? 0}</div>
          </div>
        </div>
      </div>

      {analysis.speakerMetrics && analysis.speakerMetrics.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Speaker Analytics</h3>
          <div className="space-y-2">
            {analysis.speakerMetrics.map((speaker) => (
              <div key={speaker.speaker} className="rounded-lg bg-zinc-800/50 px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">{speaker.speaker}</span>
                  <span className="text-xs text-zinc-400">{Math.round(speaker.talkRatio * 100)}% talk ratio</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400">
                  <span>{speaker.questionsAsked} questions</span>
                  <span>{speaker.interruptions} interruptions</span>
                  <span className="capitalize">{speaker.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
