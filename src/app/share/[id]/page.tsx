import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TranscriptViewer } from '@/components/transcript-viewer';
import { AnalysisPanel } from '@/components/analysis-panel';
import type { Metadata } from 'next';

interface SharePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const call = await prisma.call.findUnique({
    where: { id: params.id, isPublic: true },
    select: { filename: true, summary: true },
  });

  if (!call) return { title: 'Call Not Found' };

  return {
    title: `${call.filename} | Gauge`,
    description: call.summary?.slice(0, 160) || 'Sales call analysis',
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const call = await prisma.call.findUnique({
    where: { id: params.id, isPublic: true },
    include: {
      actionItems: true,
      decisions: true,
      nextSteps: true,
      analytics: true,
      insight: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!call) notFound();

  const segments = (call.transcript || '')
    .split('\n\n')
    .filter(Boolean)
    .map((text, i) => {
      const [speaker, ...content] = text.split(': ');
      return {
        speaker: speaker || 'Unknown',
        text: content.join(': ') || text,
        timestamp: i * 10,
      };
    });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 pb-6 border-b border-zinc-800">
          <h1 className="text-3xl font-bold mb-2">{call.filename}</h1>
          <p className="text-zinc-400">
            Recorded by {call.user.name || call.user.email} on{' '}
            {new Date(call.createdAt).toLocaleDateString()}
          </p>
          {call.healthScore !== null && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2">
              <span className="text-sm text-emerald-400">Health Score</span>
              <span className="text-lg font-bold text-emerald-400">{call.healthScore.toFixed(0)}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Transcript</h2>
            <div className="max-h-[600px] overflow-y-auto">
              <TranscriptViewer segments={segments} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis</h2>
            <AnalysisPanel
              analysis={{
                executiveSummary: call.summary || '',
                healthScore: call.healthScore || 0,
                actionItems: call.actionItems.map((item) => ({
                  task: item.task,
                  owner: item.owner || 'Unknown',
                  priority: 'medium',
                })),
                keyDecisions: call.decisions.map((d) => d.content),
                nextSteps: call.nextSteps.map((s) => ({
                  step: s.step,
                  date: s.date || 'TBD',
                })),
                salesScorecard: call.insight?.salesScorecard,
                interruptions: call.analytics?.interruptions || 0,
                questionsAsked: call.analytics?.questionsAsked || 0,
                speakerMetrics: call.analytics?.speakerMetrics as any[] || [],
              }}
            />
          </div>
        </div>

        <footer className="text-center py-8 border-t border-zinc-800">
          <p className="text-zinc-400 text-sm">
            Powered by{' '}
            <a href="/" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Gauge
            </a>
            {' '}— AI-powered sales call analysis
          </p>
        </footer>
      </div>
    </div>
  );
}
