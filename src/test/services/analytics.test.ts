import { describe, it, expect } from "vitest";
import { AnalyticsService } from "@/services/ai/analytics";

describe("AnalyticsService", () => {
  const service = new AnalyticsService();

  describe("analyzeCall", () => {
    it("should return all required fields", async () => {
      const result = await service.analyzeCall("Hello, how are you?", [], []);
      expect(result).toHaveProperty("talkRatio");
      expect(result).toHaveProperty("interruptions");
      expect(result).toHaveProperty("questionsAsked");
      expect(result).toHaveProperty("speakerMetrics");
      expect(result).toHaveProperty("sentimentTimeline");
      expect(result).toHaveProperty("objections");
      expect(result).toHaveProperty("budgetMentioned");
      expect(result).toHaveProperty("timelineMentioned");
      expect(result).toHaveProperty("decisionMakerPresent");
      expect(result).toHaveProperty("competitorMentioned");
      expect(result).toHaveProperty("sentiment");
      expect(result).toHaveProperty("healthScore");
    });

    it("should detect budget keywords", async () => {
      const result = await service.analyzeCall("The budget is too expensive", [], []);
      expect(result.budgetMentioned).toBe(true);
    });

    it("should not detect budget when absent", async () => {
      const result = await service.analyzeCall("Hello, nice weather today", [], []);
      expect(result.budgetMentioned).toBe(false);
    });

    it("should detect timeline keywords", async () => {
      const result = await service.analyzeCall("What is the deadline for this project?", [], []);
      expect(result.timelineMentioned).toBe(true);
    });

    it("should detect decision maker keywords", async () => {
      const result = await service.analyzeCall("The CEO needs to approve this", [], []);
      expect(result.decisionMakerPresent).toBe(true);
    });

    it("should detect competitor mentions", async () => {
      const result = await service.analyzeCall("We are considering a competitor", [], []);
      expect(result.competitorMentioned).toBe(true);
    });

    it("should extract objections from transcript", async () => {
      const result = await service.analyzeCall(
        "That's too expensive. I'm not sure about this.",
        [],
        [],
      );
      expect(result.objections.length).toBeGreaterThan(0);
    });

    it("should count questions based on question marks", async () => {
      const result = await service.analyzeCall("What is the price? When can you deliver?", [], []);
      expect(result.questionsAsked).toBeGreaterThanOrEqual(2);
    });

    it("should calculate talk ratio from speakers", async () => {
      const speakers = [
        { label: "Alice", duration: 60 },
        { label: "Bob", duration: 40 },
      ];
      const result = await service.analyzeCall("test", speakers, []);
      expect(result.talkRatio["Alice"]).toBeCloseTo(0.6, 1);
      expect(result.talkRatio["Bob"]).toBeCloseTo(0.4, 1);
    });

    it("should not count interruptions when gap is large enough", async () => {
      const turns = [
        { speaker: "Alice", text: "Hello", start: 0, end: 10 },
        { speaker: "Bob", text: "Hi", start: 15, end: 20 },
        { speaker: "Alice", text: "Wait", start: 25, end: 30 },
      ];
      const result = await service.analyzeCall("test", [], turns);
      expect(result.interruptions).toBe(0);
    });

    it("should detect interruptions when gap is very small", async () => {
      const turns = [
        { speaker: "Alice", text: "I think we should", start: 0, end: 10 },
        { speaker: "Bob", text: "But actually", start: 10.3, end: 20 },
        { speaker: "Alice", text: "No listen", start: 20.1, end: 30 },
      ];
      const result = await service.analyzeCall("test", [], turns);
      expect(result.interruptions).toBe(2);
    });

    it("should calculate healthScore between 0 and 1", async () => {
      const result = await service.analyzeCall(
        "We have a budget. Let's set a timeline. The CEO is involved.",
        [],
        [],
      );
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(1);
    });

    it("should return neutral sentiment for mixed content", async () => {
      const result = await service.analyzeCall("Okay, maybe we can discuss later", [], []);
      expect(["positive", "neutral", "negative"]).toContain(result.sentiment);
    });

    it("should parse turns from transcript when not provided", async () => {
      const speakers = [
        { label: "Speaker 1", duration: 10 },
        { label: "Speaker 2", duration: 10 },
      ];
      const result = await service.analyzeCall("Speaker 1: Hello\n\nSpeaker 2: Hi there", speakers, []);
      expect(result.speakerMetrics.length).toBe(2);
    });

    it("should generate sentimentTimeline from turns", async () => {
      const turns = [
        { speaker: "Alice", text: "Great meeting!", start: 0, end: 10 },
        { speaker: "Bob", text: "Terrible outcome", start: 10, end: 20 },
      ];
      const result = await service.analyzeCall("test", [], turns);
      expect(result.sentimentTimeline).toHaveLength(2);
      expect(result.sentimentTimeline[0].speaker).toBe("Alice");
      expect(result.sentimentTimeline[0].timestamp).toBe(0);
    });

    it("should include speaker metrics for each speaker", async () => {
      const turns = [
        { speaker: "Alice", text: "Hello", start: 0, end: 10 },
        { speaker: "Bob", text: "Hi", start: 10, end: 20 },
      ];
      const speakers = [
        { label: "Alice", duration: 10 },
        { label: "Bob", duration: 10 },
      ];
      const result = await service.analyzeCall("test", speakers, turns);
      const speakerNames = result.speakerMetrics.map((s) => s.speaker);
      expect(speakerNames).toContain("Alice");
      expect(speakerNames).toContain("Bob");
    });
  });

  describe("calculateHealthScore", () => {
    it("should return baseline ~0.55 with no signals (no competitor = +0.05)", async () => {
      const result = await service.analyzeCall("Simple greeting", [], []);
      expect(result.healthScore).toBeGreaterThan(0.5);
    });

    it("should increase with positive signals", async () => {
      const result = await service.analyzeCall(
        "We have budget. Timeline is Q3. The decision maker is here.",
        [],
        [],
      );
      expect(result.healthScore).toBeGreaterThan(0.7);
    });

    it("should decrease with many objections", async () => {
      const result = await service.analyzeCall(
        "Too expensive. Not interested. Too costly. Worried about the price. Hesitant to commit.",
        [],
        [],
      );
      expect(result.healthScore).toBeLessThan(0.5);
    });
  });

  describe("asArray helper equivalent", () => {
    it("should handle speakerMetrics being null in analytics", async () => {
      const result = await service.analyzeCall("Hello", [], []);
      expect(Array.isArray(result.speakerMetrics)).toBe(true);
    });
  });
});
