'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquarePlus, Share2, UserRoundCheck } from 'lucide-react';

import { TranscriptViewer } from '@/components/transcript-viewer';
import { AnalysisPanel } from '@/components/analysis-panel';
import { ChatSidebar } from '@/components/chat-sidebar';
import type { CollaborationComment, SpeakerMetric } from '@/types';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
}

interface CallData {
  id: string;
  transcript: string;
  summary: string;
  healthScore: number;
  actionItems: any[];
  decisions: any[];
  nextSteps: any[];
  sharedWithTeam: boolean;
  assignee: TeamMember | null;
  owner: TeamMember;
  comments: CollaborationComment[];
  canManageCollaboration: boolean;
  analytics?: {
    interruptions?: number | null;
    questionsAsked?: number | null;
    speakerMetrics?: SpeakerMetric[] | null;
  } | null;
}

export default function CallDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<CallData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    async function fetchCall() {
      try {
        const [callRes, teamRes] = await Promise.all([
          fetch(`/api/history/${params.id}`),
          fetch('/api/team'),
        ]);
        const call = await callRes.json();
        const team = await teamRes.json();

        if (!callRes.ok) throw new Error(call.error || 'Failed to load call');
        setData({
          id: call.id,
          transcript: call.transcript,
          summary: call.summary,
          healthScore: call.healthScore || 0,
          actionItems: call.actionItems || [],
          decisions: call.decisions || [],
          nextSteps: call.nextSteps || [],
          sharedWithTeam: call.sharedWithTeam || false,
          assignee: call.assignee || null,
          owner: call.user,
          comments: call.comments || [],
          canManageCollaboration: call.canManageCollaboration || false,
          analytics: call.analytics || null,
        });
        setTeamMembers(team.members || []);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load call';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchCall();
  }, [params.id]);

  const segments = useMemo(() => {
    return (data?.transcript || '')
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
  }, [data?.transcript]);

  const updateCollaboration = async (payload: Record<string, unknown>) => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/history/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to update collaboration settings');

      setData((current) =>
        current
          ? {
              ...current,
              sharedWithTeam:
                typeof updated.sharedWithTeam === 'boolean'
                  ? updated.sharedWithTeam
                  : current.sharedWithTeam,
              assignee: updated.assignee ?? current.assignee,
            }
          : current,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update collaboration settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const addComment = async () => {
    if (!commentBody.trim()) return;

    setSavingComment(true);
    try {
      const res = await fetch(`/api/history/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: commentBody }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Failed to save comment');

      setData((current) =>
        current
          ? {
              ...current,
              comments: [...current.comments, created],
            }
          : current,
      );
      setCommentBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save comment');
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (error) return <div className="h-screen flex items-center justify-center text-white">{error}</div>;
  if (!data) return <div className="h-screen flex items-center justify-center text-white">Call not found</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-4rem)] grid grid-cols-1 xl:grid-cols-[0.95fr_0.95fr_0.7fr] gap-6"
    >
      <div className="doppel-outer">
        <div className="doppel-inner p-6 lg:h-full overflow-hidden flex flex-col">
          <TranscriptViewer segments={segments} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="doppel-outer">
          <div className="doppel-inner p-6 lg:h-full overflow-y-auto">
            <AnalysisPanel
              analysis={{
                executiveSummary: data.summary,
                healthScore: data.healthScore,
                actionItems: data.actionItems.map((item: any) => ({
                  task: item.task || item.content,
                  owner: item.owner || 'Unknown',
                  priority: item.priority || 'medium',
                })),
                keyDecisions: data.decisions.map((d: any) => d.content || d),
                nextSteps: data.nextSteps.map((s: any) => ({
                  step: s.step || s.content,
                  date: s.date || 'TBD',
                })),
                interruptions: data.analytics?.interruptions || 0,
                questionsAsked: data.analytics?.questionsAsked || 0,
                speakerMetrics: data.analytics?.speakerMetrics || [],
              }}
            />
          </div>
        </div>

        <div className="doppel-outer">
          <div className="doppel-inner p-6 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-medium">Collaboration</h2>
            </div>
            <p className="text-sm text-zinc-400">
              Owner: {data.owner.name || data.owner.email}
            </p>

            {data.canManageCollaboration && (
              <>
                <label className="flex items-center justify-between gap-4 rounded-lg bg-zinc-900/70 px-4 py-3 text-sm">
                  <span className="text-zinc-300">Share this call with the team</span>
                  <input
                    type="checkbox"
                    checked={data.sharedWithTeam}
                    disabled={savingSettings}
                    onChange={(e) => void updateCollaboration({ sharedWithTeam: e.target.checked })}
                    className="h-4 w-4 accent-emerald-500"
                  />
                </label>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 flex items-center gap-2">
                    <UserRoundCheck className="w-4 h-4" />
                    Assign owner
                  </label>
                  <select
                    value={data.assignee?.id || ''}
                    disabled={savingSettings}
                    onChange={(e) =>
                      void updateCollaboration({
                        assigneeId: e.target.value ? e.target.value : null,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {!data.canManageCollaboration && data.assignee && (
              <p className="text-sm text-zinc-300">
                Assigned to {data.assignee.name || data.assignee.email}
              </p>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
                Comments
              </div>
              <div className="max-h-56 overflow-y-auto space-y-3">
                {data.comments.length === 0 ? (
                  <p className="text-sm text-zinc-500">No comments yet.</p>
                ) : (
                  data.comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg bg-zinc-900/70 px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                        <span>{comment.author.name || comment.author.email}</span>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-zinc-200">{comment.body}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a note for your team..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white min-h-[96px]"
                />
                <button
                  onClick={() => void addComment()}
                  disabled={savingComment || !commentBody.trim()}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {savingComment ? 'Saving...' : 'Add comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="doppel-outer">
        <div className="doppel-inner p-6 lg:h-full overflow-hidden flex flex-col">
          <ChatSidebar />
        </div>
      </div>
    </motion.div>
  );
}
