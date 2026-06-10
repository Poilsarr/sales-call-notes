import { describe, it, expect } from "vitest";
import {
  extractEntities,
  extractRelations,
  buildGraphFromText,
} from "@/services/ai/knowledge-extract";

describe("extractEntities", () => {
  it("extracts person with title", () => {
    const r = extractEntities("We met with Sarah Chen, VP of Sales at Acme.");
    const person = r.find((e) => e.type === "person" && e.value.includes("Sarah"));
    expect(person).toBeDefined();
  });

  it("extracts company with suffix", () => {
    const r = extractEntities("Acme Corp is our biggest customer.");
    const company = r.find((e) => e.type === "company");
    expect(company?.value).toMatch(/Acme/i);
    expect(company?.value.toLowerCase()).toMatch(/corp/);
  });

  it("extracts money mentions", () => {
    const r = extractEntities("The deal is $250k ARR and another $1.2M pipeline.");
    const money = r.filter((e) => e.type === "money");
    expect(money.length).toBeGreaterThanOrEqual(2);
    const usd = money.find((m) => m.value.includes("$250"));
    expect(usd).toBeDefined();
  });

  it("deduplicates by type+value", () => {
    const r = extractEntities("Met with John. Talked to John. John left.");
    const johns = r.filter((e) => e.type === "person" && e.value === "John");
    expect(johns).toHaveLength(1);
  });

  it("returns empty for plain prose with no entities", () => {
    const r = extractEntities("the quick brown fox jumps over the lazy dog");
    expect(r).toEqual([]);
  });

  it("extracts quoted product names", () => {
    const r = extractEntities('They use "SalesHub" internally.');
    const product = r.find((e) => e.type === "product" && e.value === "SalesHub");
    expect(product).toBeDefined();
  });
});

describe("extractRelations", () => {
  it("links person to nearby company", () => {
    const text = "Sarah Chen, VP at Acme Corp, led the evaluation.";
    const entities = extractEntities(text);
    const rels = extractRelations(entities, text);
    const worksAt = rels.find((r) => r.relation === "works_at");
    expect(worksAt).toBeDefined();
    expect(worksAt?.fromType).toBe("person");
    expect(worksAt?.toType).toBe("company");
  });

  it("links company to nearby product", () => {
    const text = 'Acme Corp adopted "DataPilot" for analytics.';
    const entities = extractEntities(text);
    const rels = extractRelations(entities, text);
    const uses = rels.find((r) => r.relation === "uses");
    expect(uses).toBeDefined();
  });

  it("skips self-relations", () => {
    const text = "Sarah met Sarah at Sarah's office.";
    const entities = extractEntities(text);
    const rels = extractRelations(entities, text);
    for (const r of rels) {
      expect(r.from.toLowerCase()).not.toBe(r.to.toLowerCase());
    }
  });

  it("skips stop-entity relations", () => {
    const text = "The team at The Company discussed plans.";
    const entities = extractEntities(text);
    const rels = extractRelations(entities, text);
    for (const r of rels) {
      expect(["the", "team", "company", "business"]).not.toContain(r.from.toLowerCase());
      expect(["the", "team", "company", "business"]).not.toContain(r.to.toLowerCase());
    }
  });
});

describe("buildGraphFromText", () => {
  it("returns entities and relations tagged with callId", () => {
    const g = buildGraphFromText({
      text: "Sarah Chen, CEO of Beta Inc, bought $50k of ProTool.",
      callId: "call_001",
      userId: "u_1",
    });
    expect(g.entities.length).toBeGreaterThan(0);
    expect(g.entities.every((e) => e.callId === "call_001")).toBe(true);
    expect(g.relations.every((r) => r.callId === "call_001")).toBe(true);
  });

  it("handles no-entity text without throwing", () => {
    const g = buildGraphFromText({
      text: "lorem ipsum dolor sit amet",
      callId: "c2",
      userId: "u_1",
    });
    expect(g.entities).toEqual([]);
    expect(g.relations).toEqual([]);
  });
});
