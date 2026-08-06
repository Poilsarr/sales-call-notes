"use client";

import { useEffect, useState, useMemo } from "react";
import { Upload, Mic, Brain, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/**
 * Transcription progress panel — replaces the silent toast.promise() during
 * the 30-90s transcription wait (the #1 activation leak from DESIGN_UX_AUDIT.md).
 *
 * Shows a multi-stage progress indicator with estimated time remaining:
 *   1. Uploading (0-20%)
 *   2. Transcribing (20-70%)
 *   3. Analyzing (70-95%)
 *   4. Done (100%)
 *
 * ETA is computed from file size: ~3s per MB baseline.
 */

export type ProcessingStage = "idle" | "uploading" | "transcribing" | "analyzing" | "done" | "error";

interface TranscriptionProgressProps {
  stage: ProcessingStage;
  /** File size in MB, used for ETA estimation */
  fileSizeMB?: number;
  /** Error message to display when stage is "error" */
  errorMessage?: string;
  /** Called when the user dismisses the panel after completion or error */
  onDismiss?: () => void;
  /** Called when the user clicks "View call" after completion */
  onViewCall?: () => void;
}

const STAGES = [
  { key: "uploading" as const, label: "Uploading", icon: Upload, pctRange: [0, 20] },
  { key: "transcribing" as const, label: "Transcribing", icon: Mic, pctRange: [20, 70] },
  { key: "analyzing" as const, label: "Analyzing", icon: Brain, pctRange: [70, 95] },
  { key: "done" as const, label: "Complete", icon: CheckCircle, pctRange: [95, 100] },
];

function getStageIndex(stage: ProcessingStage): number {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx === -1 ? -1 : idx;
}

export function TranscriptionProgress({
  stage,
  fileSizeMB = 5,
  errorMessage,
  onDismiss,
  onViewCall,
}: TranscriptionProgressProps) {
  const [elapsed, setElapsed] = useState(0);
  const [animatedPct, setAnimatedPct] = useState(0);

  // Estimated total time in seconds: ~3s per MB, minimum 15s
  const estimatedTotalSeconds = useMemo(
    () => Math.max(15, Math.round(fileSizeMB * 3)),
    [fileSizeMB],
  );

  // Timer that counts elapsed seconds
  useEffect(() => {
    if (stage === "idle" || stage === "done" || stage === "error") {
      return;
    }
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // Animate progress based on stage
  useEffect(() => {
    const stageIdx = getStageIndex(stage);
    if (stage === "done") {
      setAnimatedPct(100);
      return;
    }
    if (stage === "error" || stage === "idle") {
      return;
    }
    if (stageIdx === -1) return;

    const [min, max] = STAGES[stageIdx].pctRange;
    // Ease progress within the stage based on elapsed time
    const stageDurationEstimate = ((max - min) / 100) * estimatedTotalSeconds;
    const stageProgress = Math.min(1, elapsed / Math.max(1, stageDurationEstimate));
    // Use an ease-out curve so it slows down as it approaches the max
    const eased = 1 - Math.pow(1 - stageProgress, 2);
    setAnimatedPct(Math.round(min + (max - min) * eased));
  }, [stage, elapsed, estimatedTotalSeconds]);

  const remaining = Math.max(0, estimatedTotalSeconds - elapsed);
  const currentStageIdx = getStageIndex(stage);

  // Format ETA
  const etaText = useMemo(() => {
    if (stage === "done") return "Complete";
    if (stage === "error") return "Failed";
    if (remaining <= 5) return "Almost done...";
    if (remaining < 60) return `~${remaining}s remaining`;
    const mins = Math.ceil(remaining / 60);
    return `~${mins} min remaining`;
  }, [stage, remaining]);

  // Stage description
  const stageDescription = useMemo(() => {
    switch (stage) {
      case "uploading":
        return "Uploading your audio file securely...";
      case "transcribing": {
        const estMinutes = Math.ceil(fileSizeMB / 2);
        return `Transcribing audio${estMinutes > 1 ? ` (~${estMinutes} minutes of audio)` : ""}...`;
      }
      case "analyzing":
        return "AI is extracting insights, action items & competitive signals...";
      case "done":
        return "Your call has been processed and is ready to view.";
      case "error":
        return errorMessage || "Something went wrong during processing.";
      default:
        return "";
    }
  }, [stage, fileSizeMB, errorMessage]);

  if (stage === "idle") return null;

  return (
    <div className="doppel-outer-dark animate-in slide-in-from-bottom-4 duration-500">
      <div className="doppel-inner-dark p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stage === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : stage === "done" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-[#F26522] animate-spin" />
            )}
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/40 font-mono">
              {stage === "error" ? "Processing failed" : stage === "done" ? "Processing complete" : "Processing call"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-white/30">{etaText}</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                stage === "error"
                  ? "bg-red-500"
                  : stage === "done"
                    ? "bg-emerald-500"
                    : "bg-[#F26522]"
              }`}
              style={{ width: `${animatedPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-white/30 font-mono">
            <span>{animatedPct}%</span>
            <span>{stageDescription}</span>
          </div>
        </div>

        {/* Stage indicators */}
        <div className="flex items-center gap-1">
          {STAGES.map((s, i) => {
            const isActive = s.key === stage;
            const isComplete = currentStageIdx > i || stage === "done";
            const isFuture = currentStageIdx < i && stage !== "done";
            const Icon = s.icon;

            return (
              <div key={s.key} className="flex-1 flex items-center gap-1">
                <div
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-[#F26522]/10 text-[#F26522]"
                      : isComplete
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/[0.02] text-white/20"
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? "animate-pulse" : ""}`} />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-px transition-colors duration-300 ${
                      isComplete ? "bg-emerald-500/30" : isFuture ? "bg-white/5" : "bg-[#F26522]/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {(stage === "done" || stage === "error") && (
          <div className="flex items-center gap-3 pt-2">
            {stage === "done" && onViewCall && (
              <button
                onClick={onViewCall}
                className="px-4 py-2 rounded-full bg-[#C94F17] hover:bg-[#A84310] text-white text-xs font-semibold transition-colors"
              >
                View call →
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium transition-colors"
              >
                {stage === "error" ? "Try again" : "Dismiss"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
