import * as Sentry from "@sentry/nextjs";

export function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; code?: string; error?: { code?: string } };
  if (e.status === 429) return true;
  if (e.code === "insufficient_quota") return true;
  if (e.error?.code === "insufficient_quota") return true;
  return false;
}

export function quotaErrorResponse() {
  return new Response(
    JSON.stringify({
      error: "service_overloaded",
      message: "Our AI provider is rate-limited. Please retry in a minute.",
      retryAfterSeconds: 60,
    }),
    { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
  );
}

export function captureQuotaEvent(err: unknown, context: string) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureException(err, {
    tags: { kind: "quota_exceeded", context },
    level: "warning",
  });
}
