"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Nav from "@/components/nav";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { StatGrid } from "@/components/ui/stat-grid";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Users,
  Plus,
  X,
  Mail,
  Crown,
  Shield,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  Target,
  TrendingUp,
  MoreHorizontal,
  ExternalLink,
  BarChart3,
} from "lucide-react";

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

interface TeamAnalytics {
  sharedCalls: number;
  avgHealthScore: number;
  openActionItems: number;
  assignedCalls: number;
}

const PERMISSIONS = [
  { key: "view_calls", label: "View shared calls", member: true, admin: true },
  { key: "comment", label: "Comment on calls", member: true, admin: true },
  { key: "assign_calls", label: "Assign calls", member: false, admin: true },
  { key: "invite_members", label: "Invite members", member: false, admin: true },
  { key: "remove_members", label: "Remove members", member: false, admin: true },
  { key: "manage_branding", label: "Manage workspace branding", member: false, admin: true },
  { key: "manage_integrations", label: "Manage integrations", member: false, admin: true },
  { key: "export_data", label: "Export workspace data", member: false, admin: true },
];

export default function TeamPage() {
  const { user } = useUser();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && !isSignedIn) router.replace("/sign-in");
  }, [authLoaded, isSignedIn, router]);

  const [members, setMembers] = useState<Member[]>([]);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sharedCalls, setSharedCalls] = useState<SharedCall[]>([]);
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics>({
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
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        /* empty body */
      }
      if (res.ok) {
        setMembers(data?.members ?? []);
        setTeamName(data?.teamName ?? null);
        setSlug(data?.slug ?? null);
        setSharedCalls(data?.sharedCalls ?? []);
        setTeamAnalytics(
          data?.teamAnalytics ?? {
            sharedCalls: 0,
            avgHealthScore: 0,
            openActionItems: 0,
            assignedCalls: 0,
          }
        );
      } else if (res.status === 401) {
        router.replace("/sign-in");
        return;
      } else {
        resetState();
      }
    } catch {
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setMembers([]);
    setSharedCalls([]);
    setTeamAnalytics({
      sharedCalls: 0,
      avgHealthScore: 0,
      openActionItems: 0,
      assignedCalls: 0,
    });
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setError("Please enter a valid email address");
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
        setMembers(members.filter((m) => m.id !== memberId));
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

  const currentUserMember = members.find((m) => m.email === user?.primaryEmailAddress?.toString());
  const isAdmin = currentUserMember?.teamRole === "ADMIN";
  const otherMembers = members.filter((m) => m.email !== user?.primaryEmailAddress?.toString());

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

  const hasTeam = members.length > 0;

  return (
    <main className="min-h-screen bg-linear-black text-white">
      <Nav />
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">{teamName || "Workspace"}</h1>
            <p className="text-white/40 text-sm mt-1">
              {slug ? `${slug} · ` : ""}Manage members, shared calls, and permissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info">
              <Users className="w-3 h-3" /> {members.length} member{members.length !== 1 ? "s" : ""}
            </Badge>
            {isAdmin && (
              <Link
                href="/settings?tab=workspace"
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition flex items-center gap-2"
              >
                Branding <ExternalLink className="w-3 h-3" />
              </Link>
            )}
            <Link
              href="/team/performance"
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition flex items-center gap-2"
            >
              Performance <BarChart3 className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Stats */}
        <Section>
          <StatGrid
            stats={[
              {
                label: "Shared calls",
                value: teamAnalytics.sharedCalls,
                icon: <Phone className="w-4 h-4" />,
              },
              {
                label: "Avg health",
                value: `${teamAnalytics.avgHealthScore}%`,
                icon: <TrendingUp className="w-4 h-4" />,
                change: teamAnalytics.avgHealthScore >= 60 ? "Healthy" : "Needs attention",
                changeType: teamAnalytics.avgHealthScore >= 60 ? "positive" : "negative",
              },
              {
                label: "Open actions",
                value: teamAnalytics.openActionItems,
                icon: <Target className="w-4 h-4" />,
              },
              {
                label: "Assigned calls",
                value: teamAnalytics.assignedCalls,
                icon: <Users className="w-4 h-4" />,
              },
            ]}
          />
        </Section>

        {/* Invite + Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 space-y-6">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-linear-indigo/10 flex items-center justify-center text-linear-indigo">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Invite member</CardTitle>
                      <CardDescription>Invite a teammate by email. They must already have an account.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && inviteMember()}
                      placeholder="colleague@company.com"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-linear-black border border-linear-secondary text-sm text-white placeholder-white/30 focus:outline-none focus:border-linear-indigo/50"
                    />
                    <button
                      onClick={inviteMember}
                      disabled={inviting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-linear-indigo rounded-xl text-xs font-semibold hover:bg-linear-indigo/80 transition disabled:opacity-50"
                    >
                      {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Invite
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Members</CardTitle>
                  <span className="text-xs text-white/40">{members.length} total</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentUserMember && (
                    <MemberRow
                      member={currentUserMember}
                      isCurrentUser
                      isAdmin={isAdmin}
                      onRemove={removeMember}
                      removing={removing}
                    />
                  )}
                  {otherMembers.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      isAdmin={isAdmin}
                      onRemove={removeMember}
                      removing={removing}
                    />
                  ))}

                  {members.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10">
                      <div className="w-12 h-12 rounded-full bg-linear-indigo/10 flex items-center justify-center mb-3">
                        <UserPlus className="w-5 h-5 text-linear-indigo" />
                      </div>
                      <p className="text-sm font-medium text-white/80 mb-1">No teammates yet</p>
                      <p className="text-xs text-white/40 mb-4 max-w-sm">
                        Share call summaries, action items, and coaching insights across your team.
                      </p>
                      <p className="text-xs text-white/30">Create a team by inviting your first member.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: permissions + activity */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-linear-indigo" />
                  <CardTitle>Roles</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PERMISSIONS.map((perm) => (
                    <div key={perm.key} className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{perm.label}</span>
                      <div className="flex gap-2">
                        <span className={perm.member ? "text-emerald-400 text-xs" : "text-white/20 text-xs"}>
                          Member
                        </span>
                        <span className={perm.admin ? "text-linear-indigo text-xs" : "text-white/20 text-xs"}>
                          Admin
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Shared calls */}
        <Section title="Shared calls" description="Recent calls shared with the workspace.">
          <Card>
            <CardContent className="p-0">
              {sharedCalls.length === 0 ? (
                <div className="p-8 text-center">
                  <Phone className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">No shared calls yet.</p>
                  <p className="text-xs text-white/30 mt-1">Share a call from any call detail page.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {sharedCalls.map((call) => (
                    <Link
                      key={call.id}
                      href={`/app/calls/${call.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-linear-indigo/10 flex items-center justify-center text-linear-indigo">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-linear-indigo transition">
                            {call.filename}
                          </p>
                          <p className="text-xs text-white/40">
                            {call.ownerName ? `Owner: ${call.ownerName}` : "Owner unavailable"}
                            {call.assigneeName ? ` · Assigned: ${call.assigneeName}` : ""}
                            {" · "}
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {call.commentCount}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm text-emerald-400">
                          {call.healthScore ? `${Math.round(call.healthScore)}%` : "N/A"}
                        </div>
                        <div className="text-[11px] text-white/30">{new Date(call.createdAt).toLocaleDateString()}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </div>
    </main>
  );
}

function MemberRow({
  member,
  isCurrentUser,
  isAdmin,
  onRemove,
  removing,
}: {
  member: Member;
  isCurrentUser?: boolean;
  isAdmin: boolean;
  onRemove: (id: string) => void;
  removing: string | null;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border ${
        isCurrentUser
          ? "bg-linear-indigo/[0.04] border-linear-indigo/20"
          : "bg-linear-black border-linear-secondary hover:border-white/10"
      } transition`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={member.name} src={member.avatar} size="md" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-white flex items-center gap-2">
            <span className="truncate">{member.name || "Unnamed"}</span>
            {member.teamRole === "ADMIN" && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
            {isCurrentUser && <span className="text-[10px] text-white/30 shrink-0">(you)</span>}
          </div>
          <div className="text-[11px] text-white/40 truncate">{member.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={member.teamRole === "ADMIN" ? "warning" : "default"}>{member.teamRole}</Badge>
        {isAdmin && !isCurrentUser && (
          <button
            onClick={() => onRemove(member.id)}
            disabled={removing === member.id}
            className="p-2 hover:bg-white/5 rounded-lg transition text-white/40 hover:text-red-400"
            aria-label={`Remove ${member.name}`}
          >
            {removing === member.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
