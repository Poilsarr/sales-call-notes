import { describe, it, expect } from "vitest";
import {
  detectObjections,
  detectObjectionsByRules,
  validateLlmDetected,
  type DetectedObjection,
} from "@/services/ai/objection-detector";

describe("detectObjectionsByRules", () => {
  it("detects price objection", () => {
    const r = detectObjectionsByRules("This is too expensive for us right now");
    const price = r.find((o) => o.type === "price");
    expect(price).toBeDefined();
    expect(price?.text.toLowerCase()).toContain("expensive");
  });

  it("detects timing objection with 'need to think'", () => {
    const r = detectObjectionsByRules("I need to think about it");
    const timing = r.find((o) => o.type === "timing");
    expect(timing).toBeDefined();
  });

  it("detects competitor objection", () => {
    const r = detectObjectionsByRules("We are also evaluating competitors");
    const competitor = r.find((o) => o.type === "competitor");
    expect(competitor).toBeDefined();
  });

  it("detects authority objection", () => {
    const r = detectObjectionsByRules("I need to run it by my manager first");
    const authority = r.find((o) => o.type === "authority");
    expect(authority).toBeDefined();
  });

  it("detects stall pattern (send info)", () => {
    const r = detectObjectionsByRules("Just send me some info and we'll talk later");
    const stall = r.find((o) => o.type === "stall");
    expect(stall).toBeDefined();
  });

  it("detects need objection", () => {
    const r = detectObjectionsByRules("I'm not sure we really need this");
    const need = r.find((o) => o.type === "need");
    expect(need).toBeDefined();
  });

  it("detects trust objection", () => {
    const r = detectObjectionsByRules("I'm worried about security concerns");
    const trust = r.find((o) => o.type === "trust");
    expect(trust).toBeDefined();
  });

  it("returns empty for clean transcript", () => {
    const r = detectObjectionsByRules("Sounds great, let's move forward next week.");
    expect(r).toEqual([]);
  });

  it("attaches timestamp from getTimestamp callback", () => {
    const r = detectObjectionsByRules("Way too expensive for our team", (idx) => idx);
    expect(r[0].timestamp).toBeGreaterThan(0);
  });

  it("deduplicates by lowercase text+type", () => {
    const r = detectObjectionsByRules("Too expensive. TOO EXPENSIVE. too expensive.");
    const price = r.filter((o) => o.type === "price");
    expect(price).toHaveLength(1);
  });

  it("sorts results by timestamp ascending", () => {
    const r = detectObjectionsByRules(
      "expensive competitor later",
      (idx) => 100 - idx,
    );
    for (let i = 1; i < r.length; i++) {
      expect(r[i].timestamp).toBeGreaterThanOrEqual(r[i - 1].timestamp);
    }
  });
});

describe("validateLlmDetected", () => {
  it("accepts a valid array", () => {
    const input = [
      { text: "budget is tight", type: "price", timestamp: 12.5, confidence: 0.7 },
    ];
    const r = validateLlmDetected(input);
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe("price");
    expect(r[0].timestamp).toBe(12.5);
  });

  it("rejects unknown types", () => {
    const r = validateLlmDetected([
      { text: "x", type: "unicorn", timestamp: 0 },
    ]);
    expect(r).toEqual([]);
  });

  it("rejects empty text", () => {
    const r = validateLlmDetected([
      { text: "  ", type: "price", timestamp: 0 },
    ]);
    expect(r).toEqual([]);
  });

  it("rejects negative timestamps", () => {
    const r = validateLlmDetected([
      { text: "x", type: "price", timestamp: -1 },
    ]);
    expect(r).toEqual([]);
  });

  it("clamps confidence to [0,1]", () => {
    const r = validateLlmDetected([
      { text: "x", type: "price", timestamp: 0, confidence: 5 },
    ]);
    expect(r[0].confidence).toBe(1);
  });

  it("returns empty for non-array input", () => {
    expect(validateLlmDetected(null)).toEqual([]);
    expect(validateLlmDetected({})).toEqual([]);
    expect(validateLlmDetected("nope")).toEqual([]);
  });
});

describe("detectObjections (merged)", () => {
  it("merges rule hits and LLM hits, deduplicates identical rule+llm", () => {
    const r = detectObjections({
      text: "too expensive",
      llmDetected: [
        { text: "too expensive", type: "price", timestamp: 0, confidence: 0.9 },
        { text: "need to involve security", type: "trust", timestamp: 5 },
      ],
    });
    const price = r.filter((o) => o.type === "price");
    expect(price).toHaveLength(1);
    expect(r.find((o) => o.type === "trust")).toBeDefined();
  });

  it("ignores invalid LLM entries", () => {
    const r = detectObjections({
      text: "no objections here",
      llmDetected: [
        { text: "", type: "price", timestamp: 0 },
        { text: "x", type: "magic", timestamp: 0 },
        null,
      ],
    });
    expect(r).toEqual([]);
  });

  it("returns sorted by timestamp", () => {
    const r = detectObjections({
      text: "hi",
      llmDetected: [
        { text: "a", type: "price", timestamp: 50 },
        { text: "b", type: "trust", timestamp: 10 },
      ],
    });
    expect(r[0].timestamp).toBe(10);
    expect(r[1].timestamp).toBe(50);
  });
});
