"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Nav from "@/components/nav";
import Link from "next/link";
import { Users, Plus, X, Mail, Crown, Shield, UserPlus, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  teamRole: string;
  avatar: string | null;
}

interface SharedCall {
  id: string;
  filename: string;
  createdAt: string;
  healthScore: number | null;
  ownerName: string | null;
  assigneeName: string | null;
  commentCount: number;
}

export default function TeamPage() {
  const { user } = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sharedCalls, setSharedCalls] = useState<SharedCall[]>([]);
  const [teamAnalytics, setTeamAnalytics] = useState({
    sharedCalls: 0,
    avgHealthScore: 0,
    openActionItems: 0,
    assignedCalls: 0,
  });
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members ?? []);
        setTeamName(data.teamName);
        setSharedCalls(data.sharedCalls ?? []);
        setTeamAnalytics(data.teamAnalytics ?? {
          sharedCalls: 0,
          avgHealthScore: 0,
          openActionItems: 0,
          assignedCalls: 0,
        });
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members ?? []);
        setTeamName(data.teamName);
        setInviteEmail("");
        setSuccess("Member invited!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    setRemoving(memberId);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) {
        setMembers(members.filter(m => m.id !== memberId));
        setSuccess("Member removed");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError("Failed to remove member");
    } finally {
      setRemoving(null);
    }
  };

  const currentUserMember = members.find(m => m.email === user?.primaryEmailAddress?.toString());
  const isAdmin = currentUserMember?.teamRole === "ADMIN";
  const otherMembers = members.filter(m => m.email !== user?.primaryEmailAddress?.toString());

  if (loading) {
    return (
      <main className="min-h-screen bg-linear-black text-white">
        <Nav />
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
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
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-linear-indigo" />
              <h1 className="text-3xl font-medium tracking-tight">Team</h1>
            </div>
            <p className="text-white/40 text-sm">
              {teamName ? `${teamName} — ` : ""}Manage your workspace members and permissions.
            </p>
          </div>
          <span className="px-3 py-1 bg-linear-indigo/10 text-linear-indigo rounded-full text-[10px] font-bold uppercase tracking-wider">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {isAdmin && (
          <div className="p-6 rounded-2xl linear-surface linear-border mb-6">
            <h2 className="text-sm font-medium mb-4">Invite member</h2>
            <div className="flex gap-2">
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && inviteMember()}
                placeholder="colleague@company.com"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-linear-indigo/50"
              />
              <button onClick={inviteMember} disabled={inviting}
                className="flex items-center gap-2 px-5 py-2.5 bg-linear-indigo rounded-xl text-xs font-semibold hover:bg-linear-indigo/80 transition disabled:opacity-50">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Invite
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Shared calls" value={teamAnalytics.sharedCalls} />
          <SummaryCard label="Avg health" value={`${teamAnalytics.avgHealthScore}%`} />
          <SummaryCard label="Open actions" value={teamAnalytics.openActionItems} />
          <SummaryCard label="Assigned calls" value={teamAnalytics.assignedCalls} />
        </div>

        <div className="p-6 rounded-2xl linear-surface linear-border">
          <h2 className="text-sm font-medium mb-4">Members</h2>
          <div className="space-y-2">
            {currentUserMember && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-linear-indigo/5 border border-linear-indigo/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-linear-indigo/20 flex items-center justify-center text-xs font-bold text-linear-indigo">
                    {currentUserMember.name?.split(" ").map(n => n[0]).join("").slice(0, 2) ?? "?"}
                  </div>
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      {currentUserMember.name ?? "You"}
                      {currentUserMember.teamRole === "ADMIN" && <Crown className="w-3 h-3 text-yellow-400" />}
                      <span className="text-[10px] text-white/30">(you)</span>
                    </div>
                    <div className="text-[11px] text-white/40">{currentUserMember.email}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${
                  currentUserMember.teamRole === "ADMIN" ? "bg-yellow-500/10 text-yellow-400" : "bg-white/5 text-white/40"
                }`}>{currentUserMember.teamRole}</span>
              </div>
            )}

            {otherMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-linear-indigo/20 flex items-center justify-center text-xs font-bold text-linear-indigo">
                    {m.name?.split(" ").map(n => n[0]).join("").slice(0, 2) ?? "?"}
                  </div>
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      {m.name ?? "Unnamed"}
                      {m.teamRole === "ADMIN" && <Crown className="w-3 h-3 text-yellow-400" />}
                    </div>
                    <div className="text-[11px] text-white/40">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${
                    m.teamRole === "ADMIN" ? "bg-yellow-500/10 text-yellow-400" : "bg-white/5 text-white/40"
                  }`}>{m.teamRole}</span>
                  {isAdmin && (
                    <button onClick={() => removeMember(m.id)} disabled={removing === m.id}
                      className="p-1 hover:bg-white/5 rounded-lg transition">
                      {removing === m.id
                        ? <Loader2 className="w-3 h-3 animate-spin text-red-400/60" />
                        : <X className="w-3 h-3 text-red-400/60" />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && !error && (
              <p className="text-sm text-white/30 text-center py-8">No team members yet.</p>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl linear-surface linear-border mt-6">
          <h2 className="text-sm font-medium mb-4">Shared Calls</h2>
          <div className="space-y-3">
            {sharedCalls.length === 0 ? (
              <p className="text-sm text-white/30">No shared calls yet. Shared call summaries and assignments will appear here.</p>
            ) : (
              sharedCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/app/calls/${call.id}`}
                  className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 px-4 py-3 hover:bg-white/10 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{call.filename}</p>
                    <p className="text-[11px] text-white/40">
                      {call.ownerName ? `Owner: ${call.ownerName}` : 'Owner unavailable'}
                      {call.assigneeName ? ` · Assigned: ${call.assigneeName}` : ''}
                      {` · ${call.commentCount} comments`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-400">{call.healthScore ? `${Math.round(call.healthScore)}%` : 'N/A'}</div>
                    <div className="text-[11px] text-white/30">{new Date(call.createdAt).toLocaleDateString()}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl linear-surface linear-border px-4 py-5">
      <div className="text-[11px] uppercase tracking-widest text-white/35 mb-2">{label}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
