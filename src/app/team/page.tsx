"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Nav from "@/components/nav";
import { Users, Plus, X, Mail, Crown, Shield, UserPlus } from "lucide-react";

export default function TeamPage() {
  const { user } = useUser();
  const [members, setMembers] = useState([
    { id: "1", name: user?.fullName || "You", email: user?.primaryEmailAddress?.toString() || "", role: "Admin" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");

  const inviteMember = () => {
    if (!inviteEmail.trim()) return;
    setMembers([...members, { id: Date.now().toString(), name: inviteEmail.split("@")[0], email: inviteEmail, role: "Member" }]);
    setInviteEmail("");
  };

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
            <p className="text-white/40 text-sm">Manage your workspace members and permissions.</p>
          </div>
          <span className="px-3 py-1 bg-linear-indigo/10 text-linear-indigo rounded-full text-[10px] font-bold uppercase tracking-wider">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>

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
            <button onClick={inviteMember}
              className="flex items-center gap-2 px-5 py-2.5 bg-linear-indigo rounded-xl text-xs font-semibold hover:bg-linear-indigo/80 transition">
              <UserPlus className="w-4 h-4" /> Invite
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl linear-surface linear-border">
          <h2 className="text-sm font-medium mb-4">Members</h2>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-linear-indigo/20 flex items-center justify-center text-xs font-bold text-linear-indigo">
                    {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      {m.name}
                      {m.role === "Admin" && <Crown className="w-3 h-3 text-yellow-400" />}
                    </div>
                    <div className="text-[11px] text-white/40">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${
                    m.role === "Admin" ? "bg-yellow-500/10 text-yellow-400" : "bg-white/5 text-white/40"
                  }`}>{m.role}</span>
                  {i > 0 && (
                    <button className="p-1 hover:bg-white/5 rounded-lg transition">
                      <X className="w-3 h-3 text-red-400/60" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
