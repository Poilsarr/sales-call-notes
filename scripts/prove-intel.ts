#!/usr/bin/env node
/**
 * scripts/prove-intel.ts
 *
 * Live end-to-end proof that `competitorsMentioned` extraction now produces
 * non-null context + lowercase sentiment through the REAL AnalysisService
 * (real prompt files, real Groq call, real normalizeAnalysis — including the
 * sentiment toLowerCase at src/services/ai/analysis.ts:199).
 *
 * Run:
 *   node --env-file=.env.local --import=tsx/esm scripts/prove-intel.ts
 *   (fallback: npx tsx --env-file=.env.local scripts/prove-intel.ts)
 *
 * What it asserts, per template ('b2b-sales' and 'enrollment-calls'):
 *   1. at least 2 competitors extracted;
 *   2. every mention sentiment matches /^(positive|negative|neutral)$/
 *      (all-lowercase — proves normalizeAnalysis ran);
 *   3. every mention has a non-null context (trimmed non-empty).
 *
 * Kill behavior:
 *   - GROQ_API_KEY missing               → prints "GROQ_API_KEY missing —
 *     proof skipped" and exits 0 (code zero-cost per kill criterion).
 *   - both templates fail                → exits 1.
 *   - at least one template fully passes → exits 0.
 *
 * Writes scripts/.proof-intel.json. Never prints secrets/env values.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { AnalysisService } from "../src/services/ai/analysis";
import { loadPromptTemplate } from "../src/lib/prompts-registry";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_IDS = ["b2b-sales", "enrollment-calls"] as const;

const TRANSCRIPT = `[00:00] [Sarah - Rep] Thanks for taking the time today, Marcus. Quick agenda: see where National Grid sits on the energy side, then talk about your current tooling.
[00:12] [Marcus - Prospect] Happy to. We're kind of locked in with National Grid on the energy side — long contract, works fine, but pricing is always a topic.
[00:31] [Sarah - Rep] Got it. And on the revenue intelligence side, what are you using today?
[00:48] [Marcus - Prospect] We looked at Gong and it seemed too expensive — the sticker price per seat made the CFO wince.
[01:05] [Sarah - Rep] Understood, that's a common reaction. Nothing else in the mix?
[01:22] [Marcus - Prospect] Fathom's free tier is tempting for the team, honestly. No cost to start, and the team can kick the tires before we ask finance for budget.
[01:47] [Sarah - Rep] Makes sense. What would make you comfortable moving off it?
[02:02] [Marcus - Prospect] Clear ROI numbers, better action-item capture, and a rollout plan that doesn't touch our National Grid contract.
[02:19] [Sarah - Rep] That's exactly what we can show you next week. I'll send over a sample report after this call.
[02:36] [Marcus - Prospect] Sounds good — send it to Marcus at Apex Renewables.`;

process.env.OPENAI_API_KEY = "";

async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.log("GROQ_API_KEY missing — proof skipped, code zero-cost per kill criterion");
    process.exit(0);
  }

  const service = new AnalysisService({ groqKey: process.env.GROQ_API_KEY });

  const results: Record<string, { mentions: unknown[]; failures: string[]; error?: string }> = {};
  const rawIds: string[] = [];

  for (const templateId of TEMPLATE_IDS) {
    const entry = { mentions: [] as unknown[], failures: [] as string[] };
    results[templateId] = entry;
    try {
      const analysis = await service.analyze(TRANSCRIPT, undefined, templateId);
      const mentions = analysis.competitorsMentioned || [];
      entry.mentions = mentions as unknown[];
      mentions.forEach((m: any) => rawIds.push(String(m?.name ?? "?")));

      if (mentions.length < 2) {
        entry.failures.push(`expected >= 2 competitors, got ${mentions.length}`);
      }
      mentions.forEach((m: any, i: number) => {
        const name = m?.name ?? `#${i}`;
        if (!/^(positive|negative|neutral)$/.test(m?.sentiment ?? "")) {
          entry.failures.push(`${name}: sentiment '${m?.sentiment}' is not lowercase positive|negative|neutral`);
        }
        if (typeof m?.context !== "string" || m.context.trim().length === 0) {
          entry.failures.push(`${name}: context is null/empty`);
        }
      });
      console.log(`[intel] ${templateId}: ${mentions.length} competitor(s), ${entry.failures.length} failure(s)`);
    } catch (err) {
      entry.error = err instanceof Error ? err.message : String(err);
      entry.failures.push(`run failed: ${entry.error}`);
      console.log(`[intel] ${templateId}: run failed — ${entry.error}`);
    }
  }

  const templateOk = (r: (typeof results)[string]) => r.failures.length === 0 && r.mentions.length >= 2;
  const anyPass = TEMPLATE_IDS.some((id) => templateOk(results[id]));

  const proof = {
    ok: anyPass,
    templates: results,
    rawIds,
    timestamp: new Date().toISOString(),
  };

  writeFileSync(join(__dirname, ".proof-intel.json"), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof, null, 2));

  process.exit(anyPass ? 0 : 1);
}

main().catch((err) => {
  console.error("proof crashed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});