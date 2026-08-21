import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetUser, mockUpsert, mockFindUnique, mockCaptureException } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUpsert: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCaptureException: vi.fn(),
}));

vi.mock("@clerk/backend", () => ({
  createClerkClient: vi.fn(() => ({
    users: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      upsert: mockUpsert,
      findUnique: mockFindUnique,
    },
  },
  prisma: {
    user: {
      upsert: mockUpsert,
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
  withScope: vi.fn((cb: any) => cb({ setTag: vi.fn(), setContext: vi.fn() })),
  setUser: vi.fn(),
  init: vi.fn(),
}));

// Import after mocks
import { getUserByClerkId } from "@/lib/get-user";

describe("getUserByClerkId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockReset();
    mockUpsert.mockReset();
    mockFindUnique.mockReset();
    mockCaptureException.mockReset();
  });

  it("upsert creates new user with email from Clerk", async () => {
    const clerkId = "user_2abc12345678";
    const email = "alice@example.com";
    mockGetUser.mockResolvedValue({
      emailAddresses: [{ id: "email_1", emailAddress: email }],
      primaryEmailAddressId: "email_1",
    });
    const createdUser = { id: "cuid_1", clerkId, email, name: "User user_2ab" };
    mockUpsert.mockResolvedValue(createdUser as any);

    const result = await getUserByClerkId(clerkId);

    expect(result).toEqual(createdUser);
    expect(mockGetUser).toHaveBeenCalledWith(clerkId);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { clerkId },
      update: { email, name: `User ${clerkId.slice(0, 8)}` },
      create: { clerkId, email, name: `User ${clerkId.slice(0, 8)}` },
    });
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it("update syncs email on second call with new email (backfills)", async () => {
    const clerkId = "user_2abc12345678";
    const firstEmail = "alice@example.com";
    const secondEmail = "alice.new@example.com";

    // First call
    mockGetUser.mockResolvedValueOnce({
      emailAddresses: [{ id: "email_1", emailAddress: firstEmail }],
      primaryEmailAddressId: "email_1",
    });
    mockUpsert.mockResolvedValueOnce({ id: "cuid_1", clerkId, email: firstEmail } as any);
    await getUserByClerkId(clerkId);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { email: firstEmail, name: `User ${clerkId.slice(0, 8)}` } })
    );

    // Second call with changed email
    mockGetUser.mockResolvedValueOnce({
      emailAddresses: [{ id: "email_1", emailAddress: secondEmail }],
      primaryEmailAddressId: "email_1",
    });
    const updatedUser = { id: "cuid_1", clerkId, email: secondEmail };
    mockUpsert.mockResolvedValueOnce(updatedUser as any);

    const result2 = await getUserByClerkId(clerkId);

    expect(result2).toEqual(updatedUser);
    expect(mockUpsert).toHaveBeenLastCalledWith({
      where: { clerkId },
      update: { email: secondEmail, name: `User ${clerkId.slice(0, 8)}` },
      create: { clerkId, email: secondEmail, name: `User ${clerkId.slice(0, 8)}` },
    });
  });

  it("P2002 email collision returns existing user, no throw, captures Sentry", async () => {
    const clerkId = "user_2new99999999";
    const email = "collision@example.com";

    mockGetUser.mockResolvedValue({
      emailAddresses: [{ id: "email_1", emailAddress: email }],
      primaryEmailAddressId: "email_1",
    });

    const p2002Error: any = new Error("Unique constraint failed on the fields: (`email`)");
    p2002Error.code = "P2002";
    p2002Error.meta = { target: ["email"] };
    mockUpsert.mockRejectedValue(p2002Error);

    const existingUser = { id: "cuid_existing", clerkId: "user_2old00000000", email, name: "Existing" };
    mockFindUnique.mockResolvedValue(existingUser as any);

    const result = await getUserByClerkId(clerkId);

    expect(result).toEqual(existingUser);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email } });
    expect(mockCaptureException).toHaveBeenCalledWith(p2002Error, {
      tags: { source: "get-user", reason: "P2002-email" },
      extra: { clerkId, email },
    });
  });

  it("P2002 without existing user rethrows", async () => {
    const clerkId = "user_2new99999999";
    const email = "collision2@example.com";
    mockGetUser.mockResolvedValue({
      emailAddresses: [{ id: "email_1", emailAddress: email }],
      primaryEmailAddressId: "email_1",
    });
    const p2002Error: any = new Error("Unique constraint failed");
    p2002Error.code = "P2002";
    p2002Error.meta = { target: ["email"] };
    mockUpsert.mockRejectedValue(p2002Error);
    mockFindUnique.mockResolvedValue(null);

    await expect(getUserByClerkId(clerkId)).rejects.toBe(p2002Error);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email } });
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it("non-P2002 errors are rethrown without Sentry capture", async () => {
    const clerkId = "user_2abc12345678";
    mockGetUser.mockResolvedValue({
      emailAddresses: [{ id: "email_1", emailAddress: "a@b.com" }],
      primaryEmailAddressId: "email_1",
    });
    const otherError: any = new Error("DB down");
    otherError.code = "P1001";
    mockUpsert.mockRejectedValue(otherError);
    mockFindUnique.mockResolvedValue(null);

    await expect(getUserByClerkId(clerkId)).rejects.toBe(otherError);
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it("placeholder email fallback when clerk.users.getUser throws", async () => {
    const clerkId = "user_2placeholder01";
    const placeholderEmail = `${clerkId}@placeholder.dev`;
    mockGetUser.mockRejectedValue(new Error("Clerk API unavailable"));
    const placeholderUser = { id: "cuid_2", clerkId, email: placeholderEmail };
    mockUpsert.mockResolvedValue(placeholderUser as any);

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await getUserByClerkId(clerkId);

    expect(result).toEqual(placeholderUser);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { clerkId },
      update: { email: placeholderEmail, name: `User ${clerkId.slice(0, 8)}` },
      create: { clerkId, email: placeholderEmail, name: `User ${clerkId.slice(0, 8)}` },
    });
    // Should have warned about Clerk API unavailable
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("[getUserByClerkId] Clerk API unavailable"));
    consoleWarnSpy.mockRestore();
  });

  it("placeholder backfills to real email on next successful Clerk fetch", async () => {
    const clerkId = "user_2placeholder02";
    const placeholderEmail = `${clerkId}@placeholder.dev`;
    const realEmail = "real@example.com";

    // First call fails -> placeholder
    mockGetUser.mockRejectedValueOnce(new Error("Clerk API unavailable"));
    mockUpsert.mockResolvedValueOnce({ id: "cuid_3", clerkId, email: placeholderEmail } as any);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await getUserByClerkId(clerkId);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { email: placeholderEmail, name: `User ${clerkId.slice(0, 8)}` } })
    );
    warnSpy.mockRestore();
    vi.clearAllMocks();

    // Second call succeeds -> real email syncs
    mockGetUser.mockResolvedValue({
      emailAddresses: [{ id: "email_1", emailAddress: realEmail }],
      primaryEmailAddressId: "email_1",
    });
    mockUpsert.mockResolvedValue({ id: "cuid_3", clerkId, email: realEmail } as any);
    const result = await getUserByClerkId(clerkId);
    expect(result.email).toBe(realEmail);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { clerkId },
      update: { email: realEmail, name: `User ${clerkId.slice(0, 8)}` },
      create: { clerkId, email: realEmail, name: `User ${clerkId.slice(0, 8)}` },
    });
  });

  it("handles missing primaryEmailAddressId gracefully -> placeholder", async () => {
    const clerkId = "user_2noemail123";
    const placeholderEmail = `${clerkId}@placeholder.dev`;
    mockGetUser.mockResolvedValue({
      emailAddresses: [],
      primaryEmailAddressId: null,
    });
    mockUpsert.mockResolvedValue({ id: "cuid_4", clerkId, email: placeholderEmail } as any);

    const result = await getUserByClerkId(clerkId);
    expect(result.email).toBe(placeholderEmail);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ email: placeholderEmail }) })
    );
  });
});
