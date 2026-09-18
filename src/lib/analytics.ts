import { capturePostHogEvent } from "@/lib/posthog";

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
  | "pricing_exit_intent_click"
  | "hero_view"
  | "cta_click"
  | "film_play"
  | "film_close"
  | "film_end"
  | "section_view";

export type HeroViewProperties = {
  variant: string;
};

export type CtaClickProperties = {
  id: string;
  section: string;
  signedIn: boolean;
};

export type FilmEventProperties = {
  film: string;
  duration_s: number;
};

export type SectionViewProperties = {
  section: string;
};

export function trackEvent(
  event: "hero_view",
  properties: HeroViewProperties,
): void;
export function trackEvent(
  event: "cta_click",
  properties: CtaClickProperties,
): void;
export function trackEvent(
  event: "film_play" | "film_close" | "film_end",
  properties: FilmEventProperties,
): void;
export function trackEvent(
  event: "section_view",
  properties: SectionViewProperties,
): void;
export function trackEvent(
  event: MarketingEvent,
  properties?: Record<string, string | number | boolean>,
): void;
export function trackEvent(
  event: MarketingEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;

  try {
    import("@vercel/analytics")
      .then(({ track }) => {
        track(event, { ...properties, timestamp: Date.now() });
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
          capturePostHogEvent(event, { ...properties, timestamp: Date.now() });
        }
      })
      .catch(() => {});
  } catch {
    // Fail silently - analytics should never break the app
  }
}
