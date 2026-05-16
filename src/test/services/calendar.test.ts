import { describe, it, expect } from "vitest";

describe("Calendar Utilities", () => {
  it("should pass basic sanity check", () => {
    const date = new Date("2025-01-15T10:00:00Z");
    expect(date.toISOString()).toBe("2025-01-15T10:00:00.000Z");
  });
});
