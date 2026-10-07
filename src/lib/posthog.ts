type PostHogProperties = Record<string, string | number | boolean | null | undefined | object>;

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");

function getDistinctId() {
  const storageKey = "gauge_posthog_distinct_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(storageKey, id);
  return id;
}

function capture(event: string, properties: PostHogProperties = {}) {
  if (!key || typeof window === "undefined") return;

  void fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      api_key: key,
      event,
      properties: {
        distinct_id: getDistinctId(),
        $lib: "gauge-web",
        ...properties,
      },
    }),
  }).catch(() => {});
}

export function getPostHogDistinctId(): string | null {
  if (typeof window === "undefined") return null;
  return getDistinctId();
}

export function identifyPostHogLead(email: string) {
  if (typeof window === "undefined") return;
  const anonymousId = getDistinctId();
  capture("$identify", {
    distinct_id: anonymousId,
    $anon_distinct_id: anonymousId,
    $set: { email },
  });
  // Deliberately keep the anonymous distinct_id in storage — do NOT
  // overwrite it with the email. The person is identified via $set
  // while the same distinct_id continues to be used for events.
}

export function identifyPostHogUser(userId: string, email?: string) {
  const anonymousId = typeof window !== "undefined" ? window.localStorage.getItem("gauge_posthog_distinct_id") : null;
  capture("$identify", {
    distinct_id: userId,
    $anon_distinct_id: anonymousId ?? undefined,
    $set: email ? { email } : undefined,
  });
  if (typeof window !== "undefined") window.localStorage.setItem("gauge_posthog_distinct_id", userId);
}

export function resetPostHogUser() {
  if (typeof window !== "undefined") window.localStorage.removeItem("gauge_posthog_distinct_id");
}

export function capturePostHogEvent(event: string, properties?: PostHogProperties) {
  capture(event, properties);
}

export function capturePostHogPageview(pathname: string) {
  if (typeof window === "undefined") return;
  const properties: PostHogProperties = {
    $current_url: window.location.href.slice(0, 1024),
    pathname,
  };

  const referrer = (document.referrer || "").slice(0, 1024);
  if (referrer) {
    properties.$referrer = referrer;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ] as const;
    for (const k of utmKeys) {
      const v = params.get(k);
      if (v) {
        properties[k] = v.slice(0, 128);
      }
    }
  } catch {
    // URLSearchParams should never throw for location.search, but
    // analytics must never break the app.
  }

  if (typeof window.innerWidth === "number") {
    properties.viewport_w = window.innerWidth;
  }
  if (typeof window.innerHeight === "number") {
    properties.viewport_h = window.innerHeight;
  }

  capture("$pageview", properties);
}
