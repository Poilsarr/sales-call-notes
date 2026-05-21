'use client';

import { TranscriptViewer } from '@/components/transcript-viewer';
import { AnalysisPanel } from '@/components/analysis-panel';
import { ChatSidebar } from '@/components/chat-sidebar';
import { motion } from 'framer-motion';

const mockSegments = [
  { speaker: 'Speaker A', text: 'Hello, this is Jesus with Clean Sky Energy.', timestamp: 0 },
  { speaker: 'Speaker B', text: 'Hi, yes this is Janine.', timestamp: 5 },
  { speaker: 'Speaker A', text: 'I am calling about a price protected renewable electricity plan.', timestamp: 10 },
];

const mockAnalysis = {
  executiveSummary: 'The customer, Janine Corriere, was contacted about enrolling in a 12-month renewable electricity plan with Clean Sky Energy. She qualified for the plan and provided necessary information including account number and service address.',
  healthScore: 85,
  actionItems: [
    { task: 'Send welcome package', owner: 'Clean Sky Energy', priority: 'high' },
    { task: 'Process enrollment', owner: 'System', priority: 'medium' },
  ],
  keyDecisions: [
    'Customer enrolled in 12-month renewable electricity plan',
    'Customer qualified for $50 Visa gift card incentive',
  ],
  nextSteps: [
    { step: 'Send welcome package', date: 'Within 5 business days' },
    { step: 'Follow up call', date: '30 days before contract end' },
  ],
};

export default function CallDetailPage({ params }: { params: { id: string } }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-4rem)] flex gap-6"
    >
      <div className="w-[40%] doppel-outer">
        <div className="doppel-inner p-6 h-full overflow-hidden flex flex-col">
          <TranscriptViewer segments={mockSegments} />
        </div>
      </div>
      
      <div className="w-[35%] doppel-outer">
        <div className="doppel-inner p-6 h-full overflow-y-auto">
          <AnalysisPanel analysis={mockAnalysis} />
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
