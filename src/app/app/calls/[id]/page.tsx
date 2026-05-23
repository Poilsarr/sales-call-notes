'use client';

import { useEffect, useState } from 'react';
import { TranscriptViewer } from '@/components/transcript-viewer';
import { AnalysisPanel } from '@/components/analysis-panel';
import { ChatSidebar } from '@/components/chat-sidebar';
import { motion } from 'framer-motion';

interface CallData {
  id: string;
  transcript: string;
  summary: string;
  healthScore: number;
  actionItems: any[];
  decisions: any[];
  nextSteps: any[];
}

export default function CallDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCall() {
      try {
        const res = await fetch(`/api/history/${params.id}`);
        const call = await res.json();
        if (call.error) throw new Error(call.error);
        
        setData({
          id: call.id,
          transcript: call.transcript,
          summary: call.summary,
          healthScore: call.healthScore || 0,
          actionItems: call.actionItems || [],
          decisions: call.decisions || [],
          nextSteps: call.nextSteps || [],
        });
      } catch (e) {
        console.error('Error fetching call:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCall();
  }, [params.id]);

  if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!data) return <div className="h-screen flex items-center justify-center text-white">Call not found</div>;

  // Parse the speaker-labeled transcript into segments for the viewer
  const segments = data.transcript.split('\n\n').filter(Boolean).map((text, i) => {
    const [speaker, ...content] = text.split(': ');
    return {
      speaker: speaker || 'Unknown',
      text: content.join(': ') || text,
      timestamp: i * 10, // Approximation as timestamps aren't stored in plain text transcript
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-4rem)] flex gap-6"
    >
      <div className="w-[40%] doppel-outer">
        <div className="doppel-inner p-6 h-full overflow-hidden flex flex-col">
          <TranscriptViewer segments={segments} />
        </div>
      </div>
      
      <div className="w-[35%] doppel-outer">
        <div className="doppel-inner p-6 h-full overflow-y-auto">
          <AnalysisPanel analysis={{
            executiveSummary: data.summary,
            healthScore: data.healthScore,
            actionItems: data.actionItems.map((item: any) => ({
              task: item.task || item.content,
              owner: item.owner || 'Unknown',
              priority: item.priority || 'medium'
            })),
            keyDecisions: data.decisions.map((d: any) => d.content || d),
            nextSteps: data.nextSteps.map((s: any) => ({
              step: s.step || s.content,
              date: s.date || 'TBD'
            })),
          }} />
        </div>
      </div>
      
      <div className="w-[25%] doppel-outer">
        <div className="doppel-inner p-6 h-full overflow-hidden flex flex-col">
          <ChatSidebar />
        </div>
      </div>
    </motion.div>
  );
}
