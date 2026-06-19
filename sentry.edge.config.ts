import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const TRACES_SAMPLE_RATE = 0.1;

const SECRET_KEY_PATTERNS = [
  /DATABASE_URL\s*[:=]\s*[^\s,;'"]+/gi,
  /CLERK_SECRET_KEY\s*[:=]\s*[^\s,;'"]+/gi,
  /OPENAI_API_KEY\s*[:=]\s*[^\s,;'"]+/gi,
  /GROQ_API_KEY\s*[:=]\s*[^\s,;'"]+/gi,
  /HUBSPOT_CLIENT_SECRET\s*[:=]\s*[^\s,;'"]+/gi,
  /SALESFORCE_CLIENT_SECRET\s*[:=]\s*[^\s,;'"]+/gi,
  /TEAMS_CLIENT_SECRET\s*[:=]\s*[^\s,;'"]+/gi,
  /GOOGLE_CLIENT_SECRET\s*[:=]\s*[^\s,;'"]+/gi,
  /SENTRY_AUTH_TOKEN\s*[:=]\s*[^\s,;'"]+/gi,
  /UPSTASH_REDIS_REST_TOKEN\s*[:=]\s*[^\s,;'"]+/gi,
];

const URL_EMBEDDED_SECRET = /(postgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@)/gi;
const BEARER_TOKEN = /Bearer\s+[A-Za-z0-9._\-+/=]{8,}/gi;
const CLERK_SESSION_PATTERN = /__session=[^;]+/gi;

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const scrubString = (value: string): string => {
  let out = value;
  for (const pattern of SECRET_KEY_PATTERNS) {
    out = out.replace(pattern, (match) => {
      const eq = match.indexOf("=") >= 0 ? "=" : ":";
      const name = match.split(/[:=]/)[0];
      return `${name}${eq}[redacted]`;
    });
  }
  out = out.replace(URL_EMBEDDED_SECRET, "$1[redacted]@");
  out = out.replace(BEARER_TOKEN, "Bearer [redacted]");
  out = out.replace(CLERK_SESSION_PATTERN, "__session=[redacted]");
  out = out.replace(EMAIL_PATTERN, "[redacted-email]");
  return out;
};

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
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.SENTRY_RELEASE || "dev",
    environment: process.env.VERCEL_ENV || process.env.SENTRY_ENV || process.env.NODE_ENV || "development",
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
      if (event.request?.query_string) {
        event.request.query_string = scrubString(
          typeof event.request.query_string === "string"
            ? event.request.query_string
            : JSON.stringify(event.request.query_string),
        );
      }
      if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
      if (event.contexts) event.contexts = scrubValue(event.contexts) as Record<string, never>;
      if (event.breadcrumbs) {
        for (const b of event.breadcrumbs) {
          if (b.message) b.message = scrubString(b.message);
          if (b.data) b.data = scrubValue(b.data) as Record<string, unknown>;
        }
      }
      if (event.user?.email) event.user.email = "[redacted]";
      if (event.user?.ip_address) delete event.user.ip_address;
      return event;
    },
  });
}
