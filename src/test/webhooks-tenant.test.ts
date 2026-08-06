import { describe, it, expect, vi, beforeEach } from "vitest";

const prisma = vi.hoisted(() => ({
  integration: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ default: prisma }));

import { WebhookService } from "@/services/webhooks";

describe("WebhookService tenant scoping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delivers only to webhooks registered on the call's team", async () => {
    const service = new WebhookService();
    prisma.integration.findMany.mockResolvedValue([]);
    await service.trigger({ event: "call.analyzed", callId: "c1", userId: "u1", teamId: "t1", data: {} });
    expect(prisma.integration.findMany).toHaveBeenCalledWith({
      where: { provider: "webhook", enabled: true, teamId: "t1" },
    });
  });

  it("delivers to no one when the call has no team (teamId is a required FK)", async () => {
    const service = new WebhookService();
    await service.trigger({ event: "call.analyzed", callId: "c1", userId: "u1", teamId: null, data: {} });
    expect(prisma.integration.findMany).not.toHaveBeenCalled();
  });

  it("requires a teamId to register (Integration.teamId is a required FK)", async () => {
    const service = new WebhookService();
    await expect(service.registerWebhook("u1", "https://hook.example.com")).rejects.toThrow(
      "Webhooks require a team workspace",
    );
  });

  it("stores the teamId on registration", async () => {
    const service = new WebhookService();
    await service.registerWebhook("u1", "https://hook.example.com", "t1");
    expect(prisma.integration.create).toHaveBeenCalledWith({
      data: { provider: "webhook", config: JSON.stringify({ url: "https://hook.example.com" }), enabled: true, teamId: "t1" },
    });
  });

  it("rejects non-HTTPS webhook URLs", async () => {
    const service = new WebhookService();
    await expect(service.registerWebhook("u1", "http://insecure.example.com", "t1")).rejects.toThrow(
      "Only HTTPS webhook URLs are allowed",
    );
  });
});
