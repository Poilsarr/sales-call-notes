import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  API_KEY_PREFIXES,
  APP_BASE_URL,
  APP_ORIGIN,
  AUDIO_BITRATE_BPS,
  AUDIO_MIME_TYPE,
  CHUNK_SIZE_BYTES,
  CHUNK_TIMESLICE_MS,
  CONSENT_BANNER_ID,
  DOM_ADAPTER,
  DOM_ADAPTER_VERSION,
  MESSAGE_TYPES,
  buildAnalyzeEndpoint,
  buildBearerHeaders,
  buildCallDetailUrl,
  buildCallsEndpoint,
  buildConsentBannerHtml,
  buildKeysExchangeDocsUrl,
  buildManualUploadInstructions,
  buildUploadUrlEndpoint,
  byteOffsetForChunk,
  chunkIndexForByteOffset,
  escapeHtml,
  extractCaptionText,
  fetchWithBackoff,
  findCaptionRoots,
  getChunkPlan,
  getMeetingTitle,
  isValidApiKeyFormat,
  nextBackoffDelay,
  totalChunks,
} from "../../extension/shared.js";

/**
 * Part 3B extension protocol tests (pure logic only).
 *
 * No chrome APIs are touched anywhere in this file: every helper under test
 * is chrome-free (shared.js guards all chrome access behind `typeof chrome`
 * checks) and the suite asserts `globalThis.chrome` stays undefined.
 */
describe("extension 3B protocol: no chrome dependency", () => {
  it("runs without any chrome global present", () => {
    expect((globalThis as Record<string, unknown>).chrome).toBeUndefined();
  });

  it("all pure helpers work with chrome absent", async () => {
    expect((globalThis as Record<string, unknown>).chrome).toBeUndefined();
    expect(chunkIndexForByteOffset(10)).toBe(0);
    expect(nextBackoffDelay(2)).toBe(4000);
    expect(escapeHtml("<b>")).toBe("&lt;b&gt;");
    expect(buildCallDetailUrl("abc")).toBe(`${APP_ORIGIN}/app/calls/abc`);
    expect(isValidApiKeyFormat("cn_live_abcdefghij123")).toBe(true);
    expect(findCaptionRoots(undefined)).toEqual([]);
    expect(getMeetingTitle(undefined)).toBe("");
    expect(buildManualUploadInstructions()).toContain("Manual fallback");
  });
});

describe("extension 3B protocol: chunk-index math", () => {
  it("maps byte offsets to chunk indexes", () => {
    expect(chunkIndexForByteOffset(0)).toBe(0);
    expect(chunkIndexForByteOffset(CHUNK_SIZE_BYTES - 1)).toBe(0);
    expect(chunkIndexForByteOffset(CHUNK_SIZE_BYTES)).toBe(1);
    expect(chunkIndexForByteOffset(CHUNK_SIZE_BYTES * 2 + 99)).toBe(2);
    expect(chunkIndexForByteOffset(1500, 1000)).toBe(1);
  });

  it("rejects nonsense offsets and sizes", () => {
    expect(chunkIndexForByteOffset(-5)).toBe(0);
    expect(chunkIndexForByteOffset(NaN)).toBe(0);
    expect(chunkIndexForByteOffset(100, 0)).toBe(0);
    expect(chunkIndexForByteOffset(100, -2)).toBe(0);
  });

  it("maps chunk indexes back to byte offsets", () => {
    expect(byteOffsetForChunk(0)).toBe(0);
    expect(byteOffsetForChunk(3)).toBe(3 * CHUNK_SIZE_BYTES);
    expect(byteOffsetForChunk(2, 1000)).toBe(2000);
    expect(byteOffsetForChunk(-1)).toBe(0);
  });

  it("counts total chunks with ceiling division", () => {
    expect(totalChunks(0)).toBe(0);
    expect(totalChunks(-10)).toBe(0);
    expect(totalChunks(CHUNK_SIZE_BYTES)).toBe(1);
    expect(totalChunks(CHUNK_SIZE_BYTES + 1)).toBe(2);
    expect(totalChunks(2500, 1000)).toBe(3);
    expect(totalChunks(100, 0)).toBe(0);
  });

  it("builds contiguous chunk plans", () => {
    expect(getChunkPlan(0)).toEqual([]);
    const plan = getChunkPlan(CHUNK_SIZE_BYTES * 2 + 100);
    expect(plan).toHaveLength(3);
    expect(plan[0]).toEqual({ index: 0, start: 0, end: CHUNK_SIZE_BYTES });
    expect(plan[2].end).toBe(CHUNK_SIZE_BYTES * 2 + 100);
    for (let i = 1; i < plan.length; i += 1) {
      expect(plan[i].start).toBe(plan[i - 1].end);
      expect(plan[i].index).toBe(i);
    }
  });
});

describe("extension 3B protocol: backoff", () => {
  it("escalates and caps at 30s", () => {
    expect(nextBackoffDelay(0)).toBe(1000);
    expect(nextBackoffDelay(2)).toBe(4000);
    expect(nextBackoffDelay(5)).toBe(30000);
    expect(nextBackoffDelay(999)).toBe(30000);
  });

  it("handles invalid attempts", () => {
    expect(nextBackoffDelay(NaN)).toBe(1000);
    expect(nextBackoffDelay(-3)).toBe(1000);
    expect(nextBackoffDelay(undefined as unknown as number)).toBe(1000);
  });
});

describe("extension 3B protocol: DOM_ADAPTER selector fallback", () => {
  it("is version-pinned", () => {
    expect(DOM_ADAPTER_VERSION).toBe("2026-09-27-p3b");
    expect(DOM_ADAPTER.version).toBe(DOM_ADAPTER_VERSION);
  });

  it("uses only aria-live regions (no CSS-class dependencies)", () => {
    expect(DOM_ADAPTER.captionSelectors.length).toBeGreaterThan(0);
    for (const selector of DOM_ADAPTER.captionSelectors) {
      expect(selector.includes("aria-live") || selector.includes('role="log"')).toBe(true);
      expect(selector).not.toContain(".");
    }
    expect(DOM_ADAPTER.titleSources).toContain("document.title");
  });

  it("finds + dedupes caption roots across fallback selectors", () => {
    const shared = { textContent: "hello" };
    const doc = {
      querySelectorAll: (selector: string) => {
        if (selector === '[aria-live="polite"]') return [shared];
        if (selector === "[aria-live]") return [shared, { textContent: "other" }];
        return [];
      },
    };
    const roots = findCaptionRoots(doc);
    expect(roots).toHaveLength(2);
    expect(roots[0]).toBe(shared);
  });

  it("skips selectors that throw and handles missing docs", () => {
    const doc = {
      querySelectorAll: () => {
        throw new Error("bad selector");
      },
    };
    expect(findCaptionRoots(doc)).toEqual([]);
    expect(findCaptionRoots(null)).toEqual([]);
    expect(findCaptionRoots(undefined)).toEqual([]);
  });

  it("extracts + bounds caption text", () => {
    expect(extractCaptionText({ innerText: "  hello   world \n" })).toBe("hello world");
    expect(extractCaptionText({ textContent: "fallback" })).toBe("fallback");
    expect(extractCaptionText(null)).toBe("");
    expect(extractCaptionText({ innerText: "x".repeat(5000) }).length).toBeLessThanOrEqual(4000);
  });

  it("reads meeting titles from document.title only", () => {
    expect(getMeetingTitle({ title: "  Acme Discovery  " })).toBe("Acme Discovery");
    expect(getMeetingTitle({ title: "" })).toBe("");
    expect(getMeetingTitle({})).toBe("");
    expect(getMeetingTitle({ title: "x".repeat(500) }).length).toBe(200);
  });
});

describe("extension 3B protocol: banner HTML escaping", () => {
  it("escapes all markup-significant characters", () => {
    expect(escapeHtml(`<a href="x">&'test'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;test&#39;");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("never interpolates raw titles into banner HTML", () => {
    const evil = `<img src=x onerror=alert(1)>`;
    const html = buildConsentBannerHtml(evil);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
    expect(html).toContain("REC");
    expect(CONSENT_BANNER_ID).toBe("gauge-consent-banner");
  });
});

describe("extension 3B protocol: message contract", () => {
  it("keeps the caption message types stable", () => {
    expect(MESSAGE_TYPES.CAPTIONS_UPDATE).toBe("CAPTIONS_UPDATE");
    expect(MESSAGE_TYPES.MEETING_END).toBe("MEETING_END");
  });

  it("defines the recording + offscreen relay types", () => {
    for (const key of [
      "START_RECORDING",
      "STOP_RECORDING",
      "RECORDING_STATUS",
      "OFFSCREEN_START_AUDIO",
      "OFFSCREEN_STOP_AUDIO",
      "OFFSCREEN_CHUNK",
      "OFFSCREEN_DONE",
      "OFFSCREEN_ERROR",
    ] as const) {
      expect(typeof MESSAGE_TYPES[key]).toBe("string");
      expect(MESSAGE_TYPES[key].length).toBeGreaterThan(0);
    }
  });
});

describe("extension 3B protocol: endpoints + Bearer keys", () => {
  it("points at the app origin for upload/analyze/calls", () => {
    expect(APP_ORIGIN).toBe(APP_BASE_URL);
    expect(buildUploadUrlEndpoint()).toBe(`${APP_ORIGIN}/api/upload-url`);
    expect(buildAnalyzeEndpoint()).toBe(`${APP_ORIGIN}/api/analyze`);
    expect(buildCallsEndpoint()).toBe(`${APP_ORIGIN}/api/v1/calls`);
  });

  it("deep-links summaries to /app/calls/{id} with encoding", () => {
    expect(buildCallDetailUrl("call_123")).toBe(`${APP_ORIGIN}/app/calls/call_123`);
    expect(buildCallDetailUrl("a/b?c")).toBe(`${APP_ORIGIN}/app/calls/a%2Fb%3Fc`);
  });

  it("references the keys-exchange endpoint docs-only", () => {
    const url = buildKeysExchangeDocsUrl();
    expect(url).toContain("keys-exchange");
    expect(url).toContain(APP_ORIGIN);
  });

  it("validates cn_live_ / cn_test_ key shapes", () => {
    expect(API_KEY_PREFIXES).toEqual(["cn_live_", "cn_test_"]);
    expect(isValidApiKeyFormat("cn_live_abcdefghij123456")).toBe(true);
    expect(isValidApiKeyFormat("cn_test_abcdefghij123456")).toBe(true);
    expect(isValidApiKeyFormat("cn_live_short")).toBe(false);
    expect(isValidApiKeyFormat("cn_live_")).toBe(false);
    expect(isValidApiKeyFormat("sk-live-abc")).toBe(false);
    expect(isValidApiKeyFormat("")).toBe(false);
    expect(isValidApiKeyFormat(null)).toBe(false);
    expect(isValidApiKeyFormat(42)).toBe(false);
  });

  it("builds Bearer headers without leaking empty auth", () => {
    expect(buildBearerHeaders("cn_live_abc")).toMatchObject({
      Authorization: "Bearer cn_live_abc",
      "Content-Type": "application/json",
    });
    expect(buildBearerHeaders("")).not.toHaveProperty("Authorization");
    expect(buildBearerHeaders(null, { "X-Extra": "1" })).toEqual({
      "Content-Type": "application/json",
      "X-Extra": "1",
    });
  });
});

describe("extension 3B protocol: audio constants + upload retry", () => {
  it("records at 32kbps Opus with 10s timeslices", () => {
    expect(AUDIO_BITRATE_BPS).toBe(32000);
    expect(AUDIO_MIME_TYPE).toContain("opus");
    expect(CHUNK_TIMESLICE_MS).toBe(10000);
    expect(CHUNK_SIZE_BYTES).toBeGreaterThan(0);
  });

  it("returns the first ok response without retrying", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 200, ok: true });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const res = await fetchWithBackoff("https://x", {}, { fetchImpl, sleep });
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries server errors with backoff then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ status: 500, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const delays: number[] = [];
    await fetchWithBackoff("https://x", {}, { fetchImpl, sleep, delayFor: (n: number) => (delays.push(n), 1) });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(delays).toEqual([0]);
  });

  it("returns auth/client errors immediately (no retry)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 401, ok: false });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const res = await fetchWithBackoff("https://x", {}, { fetchImpl, sleep });
    expect(res.status).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("throws after exhausting attempts on network errors", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("down"));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      fetchWithBackoff("https://x", {}, { fetchImpl, sleep, attempts: 3, delayFor: () => 0 }),
    ).rejects.toThrow("down");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("throws when no fetch implementation exists", async () => {
    await expect(
      fetchWithBackoff("https://x", {}, { fetchImpl: null as unknown as typeof fetch }),
    ).rejects.toThrow("fetch is not available");
  });
});

describe("extension 3B protocol: degradation + content.js file contract", () => {
  it("explains manual upload when the backend is missing", () => {
    const plain = buildManualUploadInstructions();
    expect(plain).toContain("Manual fallback");
    expect(buildManualUploadInstructions("https://app/calls/1")).toContain("https://app/calls/1");
  });

  function readContentJs(): string {
    // process.cwd() is the repo root when vitest runs (import.meta.url is a
    // vite-served http URL in transform mode, not a file URL).
    return readFileSync(join(process.cwd(), "extension/content.js"), "utf8");
  }

  it("content.js pins the same DOM_ADAPTER version and message types", () => {
    const src = readContentJs();
    expect(src).toContain(`version: "${DOM_ADAPTER_VERSION}"`);
    expect(src).toContain("CAPTIONS_UPDATE");
    expect(src).toContain("MEETING_END");
    expect(src).toContain(CONSENT_BANNER_ID);
    expect(src).toContain("5000");
  });

  it("content.js has no CSS-class selectors (attribute selectors only)", () => {
    const src = readContentJs();
    expect(src).not.toMatch(/querySelector(All)?\(\s*['"]\./);
    expect(src).not.toContain("jsname");
    expect(src).not.toContain(".qwt");
    expect(src).not.toMatch(/^import\s/m);
  });
});
