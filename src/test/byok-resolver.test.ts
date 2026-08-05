import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrismaFindUnique } = vi.hoisted(() => ({
  mockPrismaFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: mockPrismaFindUnique,
    },
  },
}));

import { getByokKeys } from "@/lib/byok-resolver";
import { encryptSecret } from "@/lib/byok";

const MASTER = "test-master-key-0123456789abcdef";

describe("getByokKeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BYOK_MASTER_KEY = MASTER;
  });

  it("returns empty keys when the user does not exist", async () => {
    mockPrismaFindUnique.mockResolvedValue(null);

    const keys = await getByokKeys("missing-user");

    expect(keys).toEqual({ dropped: [] });
    expect(mockPrismaFindUnique).toHaveBeenCalledWith({
      where: { id: "missing-user" },
      select: { byokOpenaiKey: true, byokGroqKey: true },
    });
  });

  it("decrypts both stored keys", async () => {
    const openai = "sk-proj-abcdefghijklmnopqrstuvwx";
    const groq = "gsk_abcdefghijklmnopqrstuvwx";
    mockPrismaFindUnique.mockResolvedValue({
      byokOpenaiKey: encryptSecret(openai),
      byokGroqKey: encryptSecret(groq),
    });

    const keys = await getByokKeys("user-1");

    expect(keys).toEqual({ openaiKey: openai, groqKey: groq, dropped: [] });
  });

  it("skips an undecryptable key, flags it as dropped, and keeps the other key", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrismaFindUnique.mockResolvedValue({
      byokOpenaiKey: "corrupted.payload.value",
      byokGroqKey: encryptSecret("gsk_abcdefghijklmnopqrstuvwx"),
    });

    const keys = await getByokKeys("user-1");

    expect(keys).toEqual({ groqKey: "gsk_abcdefghijklmnopqrstuvwx", dropped: ["openai"] });
    expect(keys.openaiKey).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[byok] failed to decrypt OpenAI key"),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it("flags a corrupt Groq key while keeping a valid OpenAI key", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrismaFindUnique.mockResolvedValue({
      byokOpenaiKey: encryptSecret("sk-proj-abcdefghijklmnopqrstuvwx"),
      byokGroqKey: "corrupted.payload.value",
    });

    const keys = await getByokKeys("user-1");

    expect(keys).toEqual({ openaiKey: "sk-proj-abcdefghijklmnopqrstuvwx", dropped: ["groq"] });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[byok] failed to decrypt Groq key"),
      expect.anything(),
    );
    consoleSpy.mockRestore();
  });

  it("fails soft (empty keys) when the master key is missing entirely", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const encrypted = encryptSecret("sk-proj-abcdefghijklmnopqrstuvwx");
    delete process.env.BYOK_MASTER_KEY;
    mockPrismaFindUnique.mockResolvedValue({
      byokOpenaiKey: encrypted,
      byokGroqKey: null,
    });

    const keys = await getByokKeys("user-1");

    expect(keys).toEqual({ dropped: ["openai"] });
    consoleSpy.mockRestore();
  });
});
