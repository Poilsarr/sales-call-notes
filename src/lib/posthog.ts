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
  capture("$pageview", { $current_url: window.location.href, pathname });
}
