"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { ProcessingState, Result, CallRecord } from "@/types";
import { compressAudio } from "@/lib/audio-compress";
import {
  Upload, FileAudio, History, X, Eye, Brain,
  FileText, Target, Layers, Mic, BarChart3,
  Shield, Share2, Copy, Download, Square, ArrowRight,
  Users, Zap, MessageSquare
} from "lucide-react";

export default function AppInterface({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ProcessingState>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState("");
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "history" | "record">("upload");
  const [resultTab, setResultTab] = useState<"transcript" | "synthesis" | "actions">("transcript");
  const { user } = useUser();
  const userId = user?.id || "";
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    if (userId) fetchHistory(userId);
  }, [userId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) interval = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [recording]);

  async function fetchHistory(id: string) {
    try {
      const res = await fetch(`/api/history?userId=${id}`);
      const data = await res.json();
      setHistory(data);
    } catch { console.error("History fetch failed"); }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const recordedFile = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
        setRecordingDuration(0);
        if (!userId) { setState("error"); setProgress("Please sign in to record."); return; }
        setState("transcribing");
        setProgress("Processing recording...");
        const fd = new FormData();
        fd.append("file", recordedFile);
        fd.append("userId", userId);
        try {
          const res = await fetch("/api/analyze", { method: "POST", body: fd });
          if (res.status === 401) { setState("error"); setProgress("Please sign in."); return; }
          if (res.ok) { const data = await res.json(); setResult(data); setState("done"); fetchHistory(userId); }
          else throw new Error();
        } catch { setState("error"); setProgress("Recording analysis failed."); }
      };
      recorder.start(1000);
      setMediaRecorder(recorder);
      setRecording(true);
    } catch { setState("error"); setProgress("Microphone access denied."); }
  };

  const stopRecording = () => { if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop(); setRecording(false); };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!userId) {
      setState("error");
      setProgress("Please sign in to analyze calls.");
      return;
    }
    setState("transcribing");
    setProgress("Compressing audio for upload...");
    try {
      let uploadFile = file;
      if (file.size > 4 * 1024 * 1024) {
        setProgress("File too large, compressing audio...");
        uploadFile = await compressAudio(file);
      }
      setProgress("Uploading and initiating Whisper engine...");
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("userId", userId);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const responseText = await res.text();
      if (res.status === 401) { setState("error"); setProgress("Please sign in to analyze calls."); return; }
      if (res.status === 413) { setState("error"); setProgress("File too large after compression."); return; }
      if (!res.ok) {
        try {
          const err = JSON.parse(responseText);
          throw new Error(err.error || "Analysis failed");
        } catch (e: any) {
          if (e instanceof SyntaxError) {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
          throw new Error(e.message || `Server error: ${res.status}`);
        }
      }
      const data = JSON.parse(responseText);
      setResult(data);
      setState("done");
      fetchHistory(userId);
    } catch (e: any) {
      console.error("Analyze error:", e);
      setState("error");
      setProgress(e.message || "Analysis failed.");
    }
  };

  const copyShareLink = () => {
    if (result?.transcript) {
      const text = `Transcript:\n${result.transcript}\n\nSummary:\n${result.summary}\n\nAction Items:\n${(result.actionItems || []).map(i => `- ${i.task} (${i.owner})`).join("\n")}`;
      navigator.clipboard.writeText(text);
    }
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[60] bg-[#050505] text-white flex animate-in fade-in duration-300">
      <aside className="w-64 border-r border-white/5 flex flex-col shrink-0 bg-[#0a0a0b]">
        <div className="p-6 flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-lg bg-[#5e6ad2] rotate-45" />
          <span className="font-display text-sm font-semibold tracking-tight">CallNote<span className="text-white/40 font-medium">Pro</span></span>
        </div>
        <div className="flex-1 px-3 space-y-1 mt-4">
          {[
            { tab: "upload" as const, icon: <Upload strokeWidth={1} className="w-4 h-4" />, label: "Upload Call" },
            { tab: "record" as const, icon: <Mic strokeWidth={1} className="w-4 h-4" />, label: "Record" },
            { tab: "history" as const, icon: <History strokeWidth={1} className="w-4 h-4" />, label: "History" },
          ].map(({ tab, icon, label }) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setState("idle"); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
              {icon}{label}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-8 shrink-0 bg-[#0a0a0b]">
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-[0.15em]">
            {activeTab === "upload" ? "Analysis Terminal" : activeTab === "record" ? "Live Recording" : "Call Archive"}
          </span>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all duration-500">
            <X strokeWidth={1} className="w-4 h-4 text-white/30" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[#050505]">
          <div className="max-w-5xl mx-auto">
            {activeTab === "record" && (
              <div className="flex flex-col items-center justify-center py-24">
                {!recording ? (
                  <div className="text-center">
                    <div className="doppel-outer w-32 h-32 mx-auto mb-8">
                      <div className="doppel-inner w-full h-full flex items-center justify-center">
                        <Mic strokeWidth={1} className="w-10 h-10 text-red-400/60" />
                      </div>
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight mb-3">Record a call</h3>
                    <p className="text-sm text-white/30 mb-10 max-w-md mx-auto">Record directly from your browser. The recording will be transcribed and analyzed automatically.</p>
                    <button onClick={startRecording}
                      className="btn-island flex items-center gap-3 bg-red-500/80 text-white hover:bg-red-500 mx-auto px-8 py-4">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Start Recording
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="doppel-outer w-32 h-32 mx-auto mb-8 border-red-500/30">
                      <div className="doppel-inner w-full h-full flex items-center justify-center bg-red-500/5">
                        <Mic strokeWidth={1} className="w-10 h-10 text-red-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="font-mono text-5xl font-light tracking-tight mb-3 text-red-400/80">{formatDuration(recordingDuration)}</div>
                    <p className="text-sm text-white/30 mb-10">Recording in progress...</p>
                    <button onClick={stopRecording}
                      className="btn-island flex items-center gap-3 bg-white text-[#050505] hover:bg-white/90 mx-auto px-8 py-4">
                      <Square strokeWidth={1.5} className="w-4 h-4" />
                      Stop Recording
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "upload" && (
              <div className="space-y-8">
                {state === "idle" && (
                  <div className="flex flex-col items-center justify-center py-24">
                    <div onClick={() => document.getElementById("fu")?.click()}
                      className="doppel-outer w-full max-w-xl cursor-pointer group">
                      <div className="doppel-inner p-12 md:p-16 flex flex-col items-center justify-center text-center min-h-[280px] group-hover:bg-white/[0.03] transition-all duration-700">
                        <Upload strokeWidth={1} className="w-6 h-6 text-white/20 group-hover:text-[#5e6ad2] transition-all duration-700 mb-5" />
                        <h3 className="font-display text-lg font-semibold tracking-tight mb-2">Drop your call recording</h3>
                        <p className="text-xs text-white/30 mb-6">MP3, WAV, M4A, WebM supported</p>
                        <input type="file" id="fu" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} accept="audio/*" />
                        <span className="px-6 py-2.5 bg-white/10 text-white rounded-full text-[11px] font-medium hover:bg-white/20 transition-all duration-500">Select File</span>
                      </div>
                    </div>
                    {file && (
                      <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mt-6">
                        <FileAudio strokeWidth={1} className="w-4 h-4 text-[#5e6ad2]" />
                        <span className="text-xs font-medium">{file.name}</span>
                        <button onClick={handleAnalyze} className="ml-3 px-4 py-1.5 bg-[#5e6ad2] text-white rounded-full text-[10px] font-bold hover:bg-[#5e6ad2]/80 transition-all duration-500">Analyze Now</button>
                      </div>
                    )}
                  </div>
                )}

                {(state === "transcribing" || state === "analyzing") && (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="doppel-outer w-24 h-24 mx-auto mb-8">
                      <div className="doppel-inner w-full h-full flex items-center justify-center">
                        <div className="w-10 h-10 border-2 border-[#5e6ad2] border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                    <p className="text-sm text-white/30 font-[425]">{progress}</p>
                  </div>
                )}

                {state === "done" && result && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                        {([["transcript", "Transcript"], ["synthesis", "Synthesis"], ["actions", "Actions"]] as const).map(([key, label]) => (
                          <button key={key} onClick={() => setResultTab(key)}
                            className={`px-4 py-2 rounded-lg text-[11px] font-medium transition-all duration-300 ${resultTab === key ? "bg-[#5e6ad2] text-white" : "text-white/40 hover:text-white"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={copyShareLink}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/40 hover:text-white hover:bg-white/10 transition-all duration-500">
                          <Copy strokeWidth={1} className="w-3 h-3" /> Copy
                        </button>
                        <button onClick={() => {
                          const text = resultTab === "transcript" ? result.transcript : `Summary:\n${result.summary}`;
                          const blob = new Blob([text], { type: "text/plain" });
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = resultTab === "transcript" ? "transcript.txt" : "call-notes.txt";
                          a.click();
                        }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/40 hover:text-white hover:bg-white/10 transition-all duration-500">
                          <Download strokeWidth={1} className="w-3 h-3" /> Export
                        </button>
                      </div>
                    </div>

                    {resultTab === "transcript" && result.segments && result.segments.length > 0 && (
                      <div className="space-y-1">
                        {result.segments.map((seg, i) => (
                          <div key={i} className="doppel-outer">
                            <div className="doppel-inner p-5 flex gap-4">
                              <div className="text-[11px] text-white/25 font-mono w-16 shrink-0 pt-0.5">
                                {formatTime(seg.start)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold mb-1.5"
                                  style={{ color: seg.speaker.includes('00') || seg.speaker === 'SPEAKER_00' ? '#5e6ad2' : '#22d3a8' }}>
                                  {seg.speaker === 'SPEAKER_00' || seg.speaker === 'Agent' ? 'Agent' : seg.speaker === 'SPEAKER_01' || seg.speaker === 'Prospect' ? 'Prospect' : seg.speaker}
                                </div>
                                <p className="text-sm text-white/80 font-[425] leading-relaxed">{seg.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {resultTab === "transcript" && (!result.segments || result.segments.length === 0) && result.transcript && (
                      <div className="doppel-outer">
                        <div className="doppel-inner p-8">
                          <pre className="text-sm text-white/70 font-[425] leading-relaxed whitespace-pre-wrap">{result.transcript}</pre>
                        </div>
                      </div>
                    )}

                    {resultTab === "synthesis" && (
                      <div className="doppel-outer">
                        <div className="doppel-inner p-8 md:p-10">
                          <div className="flex items-center gap-2 text-[10px] font-medium text-[#5e6ad2] uppercase tracking-[0.15em] mb-5">
                            <FileText strokeWidth={1} className="w-3.5 h-3.5" /> Synthesis
                          </div>
                          <p className="text-lg md:text-xl font-[425] leading-relaxed text-white/80">{result.summary}</p>
                        </div>
                      </div>
                    )}

                    {resultTab === "actions" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="doppel-outer">
                          <div className="doppel-inner p-8">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-[#5e6ad2] uppercase tracking-[0.15em] mb-6">
                              <Target strokeWidth={1} className="w-3.5 h-3.5" /> Action Items
                            </div>
                            <div className="space-y-2">{(result.actionItems || []).map((item, i) => (
                              <div key={i} className="flex justify-between p-3 rounded-xl bg-white/5 text-xs">
                                <span className="text-white/70">{item?.task || ""}</span>
                                <span className="text-white/30">{item?.owner || ""}</span>
                              </div>
                            ))}</div>
                          </div>
                        </div>
                        <div className="doppel-outer">
                          <div className="doppel-inner p-8">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-[#5e6ad2] uppercase tracking-[0.15em] mb-6">
                              <Layers strokeWidth={1} className="w-3.5 h-3.5" /> Key Decisions
                            </div>
                            <div className="space-y-2">{(result.keyDecisions || []).map((d, i) => {
                              const decisionText = typeof d === 'string' ? d : [d.who, d.what, d.by].filter(Boolean).join(' — ');
                              return (
                                <div key={i} className="flex items-start gap-3 text-sm font-[425] text-white/50">
                                  <div className="w-1 h-1 rounded-full bg-[#5e6ad2] mt-2 shrink-0" />{decisionText}
                                </div>
                              );
                            })}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {state === "error" && (
                  <div className="text-center py-24 text-red-400/60 text-sm">{progress}</div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-24 text-white/20">
                    <History strokeWidth={1} className="w-8 h-8 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No calls yet. Upload or record your first call.</p>
                  </div>
                ) : (
                  history.map((record) => (
                    <div key={record.id}
                      className="doppel-outer group cursor-pointer"
                      onClick={() => {
                        const segments = (record.transcript || '').split('\n\n').filter(Boolean).map((block, i) => {
                          const [speaker, ...textParts] = block.split(': ');
                          return {
                            speaker: speaker || 'Unknown',
                            text: textParts.join(': '),
                            start: i * 10,
                            end: (i + 1) * 10,
                          };
                        });
                        setResult({
                          transcript: record.transcript || "",
                          segments: (record as any).segments || segments,
                          summary: record.summary || "",
                          actionItems: record.actionItems || [],
                          keyDecisions: record.keyDecisions || [],
                          nextSteps: record.nextSteps || [],
                          healthScore: (record as any).healthScore,
                        });
                        setResultTab("transcript");
                        setState("done");
                        setActiveTab("upload");
                      }}>
                      <div className="doppel-inner p-5 flex items-center justify-between group-hover:bg-white/[0.02] transition-all duration-700">
                        <div className="flex items-center gap-4">
                          <FileAudio strokeWidth={1} className="w-5 h-5 text-white/20" />
                          <div>
                            <div className="text-sm font-medium">{record.filename}</div>
                            <div className="text-[11px] text-white/20">{new Date(record.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Eye strokeWidth={1} className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-all duration-500" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}