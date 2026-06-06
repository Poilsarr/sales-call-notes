import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const TRACES_SAMPLE_RATE = 0.1;

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const CLERK_SESSION_PATTERN = /__session=[^;]+/gi;
const AUTH_HEADER_PATTERN = /(authorization|cookie|x-api-key)\s*:\s*[^\s,;]+/gi;

const scrubString = (value: string): string =>
  value
    .replace(EMAIL_REGEX, "[redacted-email]")
    .replace(CLERK_SESSION_PATTERN, "__session=[redacted]")
    .replace(AUTH_HEADER_PATTERN, "$1: [redacted]");

const scrubValue = (value: unknown): unknown => {
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map(scrubValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = scrubValue(v);
    }
    return out;
  }
  return value;
};

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    debug: false,
    beforeSend(event) {
      if (event.message) event.message = scrubString(event.message);
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value) ex.value = scrubString(ex.value);
        }
      }
      if (event.request?.cookies) event.request.cookies = scrubValue(event.request.cookies) as Record<string, string>;
      if (event.request?.headers) {
        event.request.headers = scrubValue(event.request.headers) as Record<string, string>;
      }
      if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
      if (event.contexts) event.contexts = scrubValue(event.contexts) as Record<string, never>;
      if (event.user?.email) event.user.email = "[redacted]";
      if (event.user?.ip_address) delete event.user.ip_address;
      return event;
    },
  });
}
