// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getSecret: vi.fn(),
}));

vi.mock("@/lib/secrets", () => ({ getSecret: mocks.getSecret }));

function withLangfuseKeys() {
  mocks.getSecret.mockImplementation((key: string) => {
    if (key === "LANGFUSE_PUBLIC_KEY") return "pk-lf-test";
    if (key === "LANGFUSE_SECRET_KEY") return "sk-lf-test";
    return "sk-test-abc";
  });
}

function withoutLangfuseKeys() {
  mocks.getSecret.mockImplementation((key: string) =>
    key === "OPENAI_API_KEY" || key === "GROQ_API_KEY" ? "sk-test-abc" : "",
  );
}

describe("langfuse client wrapping (gated, no network)", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getSecret.mockReset();
    withoutLangfuseKeys();
  });

  it("returns a wrapped (non-identical) client when Langfuse keys are present", async () => {
    withLangfuseKeys();
    const { wrapClient } = await import("@/lib/langfuse");
    const client = {};
    const wrapped = wrapClient(client);
    expect(wrapped).not.toBe(client);
    expect(typeof (wrapped as { flushAsync?: unknown }).flushAsync).toBe("function");
  });

  it("fails closed: returns the exact same instance when Langfuse keys are absent", async () => {
    const { wrapClient } = await import("@/lib/langfuse");
    const client = {};
    expect(wrapClient(client)).toBe(client);
  });

  it("is idempotent: repeated wraps return the same wrapped instance, no double wrap", async () => {
    withLangfuseKeys();
    const { wrapClient } = await import("@/lib/langfuse");
    const client = {};
    const first = wrapClient(client);
    const second = wrapClient(client);
    const rewrap = wrapClient(first);
    expect(first).not.toBe(client);
    expect(second).toBe(first);
    expect(rewrap).toBe(first);
  });

  it("createOpenAIClient returns a langfuse-extended client when keys are present", async () => {
    withLangfuseKeys();
    const { createOpenAIClient } = await import("@/lib/openai-client");
    const client = createOpenAIClient({ apiKey: "sk-test-abc" });
    expect(typeof (client as { flushAsync?: unknown }).flushAsync).toBe("function");
    expect(typeof client.chat.completions.create).toBe("function");
    expect(client.baseURL).toBe("https://api.openai.com/v1");
    expect(client.maxRetries).toBe(3);
  });

  it("createOpenAIClient fails closed: plain working client when keys are absent", async () => {
    const { createOpenAIClient } = await import("@/lib/openai-client");
    const client = createOpenAIClient({ apiKey: "sk-test-abc" });
    expect((client as { flushAsync?: unknown }).flushAsync).toBeUndefined();
    expect(typeof client.chat.completions.create).toBe("function");
  });
});
