export type SLOMetric =
  | "transcription_latency"
  | "analysis_latency"
  | "crm_sync_success"
  | "crm_sync_failure";

export function trackSLO(
  metric: SLOMetric,
  value: number,
  tags?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;

  try {
    import("@vercel/analytics")
      .then(({ track }) => {
        track(metric, { value, ...tags, timestamp: Date.now() });
      })
      .catch(() => {});
  } catch {
    // Fail silently - analytics should never break the app
  }
}

export function trackTranscriptionLatency(
  durationMs: number,
  fileSizeBytes?: number,
): void {
  trackSLO("transcription_latency", durationMs, {
    fileSize: fileSizeBytes ?? 0,
  });
}

export function trackAnalysisLatency(
  durationMs: number,
  model?: string,
): void {
  trackSLO("analysis_latency", durationMs, { model: model ?? "default" });
}

export function trackCrmSyncSuccess(
  provider: string,
  durationMs: number,
): void {
  trackSLO("crm_sync_success", durationMs, { provider });
}

export function trackCrmSyncFailure(
  provider: string,
  errorCode: string,
): void {
  trackSLO("crm_sync_failure", 1, { provider, errorCode });
}

export type MarketingEvent =
  | "pricing_cta_click"
  | "pricing_plan_selected"
  | "pricing_calculator_used"
  | "pricing_exit_intent_shown"
  | "pricing_exit_intent_click";

export function trackEvent(
  event: MarketingEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;

  try {
    import("@vercel/analytics")
      .then(({ track }) => {
        track(event, { ...properties, timestamp: Date.now() });
      })
      .catch(() => {});
  } catch {
    // Fail silently - analytics should never break the app
  }
}
