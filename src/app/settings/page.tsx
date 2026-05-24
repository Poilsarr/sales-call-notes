"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Nav from "@/components/nav";
import { Calendar, Link2, CheckCircle, ExternalLink, Loader2, Brain, MessageSquare, Send, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatResult, setChatResult] = useState<{ answer: string; relevantCalls: any[] } | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const connectCalendar = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, "_blank");
      } else {
        toast.error("Failed to get calendar auth URL");
      }
    } catch {
      toast.error("Could not connect to calendar service");
    }
    setConnecting(false);
  };

  const askChat = async () => {
    if (!chatQuery.trim() || !user?.id) return;
    setChatLoading(true);
    setChatResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: chatQuery, userId: user.id }),
      });
      const data = await res.json();
      setChatResult(data);
    } catch {
      setChatResult({ answer: "Failed to query meetings. Please try again.", relevantCalls: [] });
    }
    setChatLoading(false);
  };

  return (
    <main className="min-h-screen bg-linear-black text-white">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <h1 className="text-3xl font-medium tracking-tight mb-10">Settings</h1>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl linear-surface linear-border">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-linear-indigo" />
                  <h2 className="text-lg font-medium">Calendar Integration</h2>
                </div>
                <p className="text-sm text-white/50">Auto-detect meetings from your calendar and join them for transcription.</p>
              </div>
              {calendarConnected ? (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </div>
              ) : null}
            </div>

            {calendarConnected ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-linear-indigo" />
                  <span className="text-white/70">Google Calendar connected</span>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  CallNote Pro will automatically detect upcoming meetings with Zoom, Google Meet, and Microsoft Teams links.
                </p>
              </div>
            ) : (
              <button onClick={connectCalendar} disabled={connecting}
                className="flex items-center gap-2 px-6 py-3 bg-white text-linear-black rounded-full text-xs font-semibold hover:bg-white/90 transition disabled:opacity-50">
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {connecting ? "Connecting..." : "Connect Google Calendar"}
              </button>
            )}
          </div>

          <div className="p-6 rounded-2xl linear-surface linear-border">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-linear-indigo" />
              <h2 className="text-lg font-medium">AI Meeting Assistant</h2>
            </div>
            <p className="text-sm text-white/50 mb-4">Ask questions about your meeting history. Get instant answers with source calls.</p>

            <div className="flex gap-2 mb-4">
              <input
                value={chatQuery}
                onChange={e => setChatQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && askChat()}
                placeholder='Ask anything... e.g., "What objections came up last week?"'
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-linear-indigo/50"
              />
              <button onClick={askChat} disabled={chatLoading || !chatQuery.trim()}
                className="px-5 py-3 bg-linear-indigo rounded-xl text-xs font-semibold hover:bg-linear-indigo/80 transition disabled:opacity-50">
                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {chatResult && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-start gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-linear-indigo shrink-0 mt-0.5" />
                  <p className="text-sm text-white/80 leading-relaxed">{chatResult.answer}</p>
                </div>
                {chatResult.relevantCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-[11px] text-white/40 uppercase tracking-wider mb-2">Source calls</div>
                    {chatResult.relevantCalls.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-2 text-xs text-white/60 py-1">
                        <FileText className="w-3 h-3" />
                        <span>{c.filename}</span>
                        <span className="text-white/30">{new Date(c.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[11px] text-white/30 mt-2">
                  Searched {chatResult.relevantCalls.length > 0 ? chatResult.relevantCalls.length : "0"} calls
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl linear-surface linear-border">
            <div className="flex items-center gap-3 mb-4">
              <Link2 className="w-5 h-5 text-linear-indigo" />
              <h2 className="text-lg font-medium">Integrations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: "HubSpot", status: "Live" },
                { name: "Salesforce", status: "Live" },
                { name: "Microsoft Teams", status: "Live" },
                { name: "Google Meet", status: "Coming Soon" },
                { name: "Zoom", status: "Coming Soon" },
                { name: "Slack", status: "Coming Soon" },
              ].map((int, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium">{int.name}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    int.status === "Live" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                  }`}>{int.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
