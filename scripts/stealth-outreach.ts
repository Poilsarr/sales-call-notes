#!/usr/bin/env node

/**
 * Safe planner for the Gauge stealth outreach workflow.
 *
 * This script qualifies supplied prospects, drafts a public reply, drafts a DM
 * only when the prospect has already engaged, and writes an auditable plan.
 * It never opens a browser, reads cookies, posts, likes, follows, or sends DMs.
 */

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Segment = "A1" | "A2" | "A3";
type Platform = "x" | "reddit" | "slack" | "indie-hackers";

type Prospect = {
  id: string;
  platform: Platform;
  url: string;
  author?: string;
  segment: Segment;
  exactQuote: string;
  pain: string;
  ageDays: number;
  repliedRecently?: boolean;
  engaged?: boolean;
  vendor?: boolean;
  promotionAllowed?: boolean;
  visibleProblem?: boolean;
  notes?: string;
};

type InputFile = { prospects: Prospect[] } | Prospect[];

type Result = {
  prospect: Prospect;
  qualified: boolean;
  reasons: string[];
  publicReply?: string;
  dm?: string;
};

const DEFAULT_INPUT = "docs/roadmap/execution/STEALTH-PROSPECTS.json";
const DEFAULT_OUTPUT = "docs/roadmap/execution/STEALTH-DRAFTS.md";
const DEFAULT_LOG = "docs/roadmap/execution/STEALTH-OUTREACH-LOG.md";

function usage(): void {
  console.log(`Usage:
  npx tsx scripts/stealth-outreach.ts --input <prospects.json> [--write]

Options:
  --input <path>  JSON file containing { "prospects": [...] }
  --out <path>    Draft output path (default: ${DEFAULT_OUTPUT})
  --log <path>    Local log path (default: ${DEFAULT_LOG})
  --write         Write the draft plan and append a local run summary
  --help          Show this help

Safety:
  This is a planning and logging tool. It never sends external messages.
  A DM is drafted only when engaged=true. Public replies still require review
  and explicit confirmation immediately before posting in the browser.`);
}

function argValue(args: string[], flag: string, fallback: string): string {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function readInput(path: string): Prospect[] {
  const parsed = JSON.parse(readFileSync(resolve(path), "utf8")) as InputFile;
  const prospects = Array.isArray(parsed) ? parsed : parsed.prospects;
  if (!Array.isArray(prospects)) {
    throw new Error("Input must be an array or an object with a prospects array.");
  }
  return prospects;
}

function validateShape(prospect: Prospect): string[] {
  const reasons: string[] = [];
  if (!prospect.id) reasons.push("missing id");
  if (!prospect.url?.startsWith("http")) reasons.push("missing source URL");
  if (!prospect.segment || !["A1", "A2", "A3"].includes(prospect.segment)) {
    reasons.push("segment must be A1, A2, or A3");
  }
  if (!prospect.exactQuote?.trim()) reasons.push("missing exact quoted pain");
  if (!prospect.pain?.trim()) reasons.push("missing problem summary");
  if (!Number.isFinite(prospect.ageDays)) reasons.push("ageDays must be a number");
  return reasons;
}

function qualify(prospect: Prospect): Result {
  const reasons = validateShape(prospect);
  if (prospect.ageDays > 30) reasons.push("older than the 30-day qualification window");
  if (prospect.repliedRecently === false) reasons.push("no reply/activity in the last 7 days");
  if (prospect.vendor === true) reasons.push("vendor or competing product");
  if (prospect.visibleProblem === false) reasons.push("no visible concrete workflow problem");
  if (prospect.promotionAllowed === false) reasons.push("source community does not allow promotion");

  const qualified = reasons.length === 0;
  if (!qualified) return { prospect, qualified, reasons };

  const publicReply = draftPublicReply(prospect);
  const dm = prospect.engaged === true ? draftDm(prospect) : undefined;
  return { prospect, qualified, reasons: [], publicReply, dm };
}

function draftPublicReply(prospect: Prospect): string {
  const quote = prospect.exactQuote.trim();
  switch (prospect.segment) {
    case "A1":
      return `Your point about “${quote}” is familiar: the recording exists, but the useful detail still takes manual review. The gap I see most is the backlog—older files never enter a searchable workflow. A file-first pass plus a locked team vocabulary list can fix that without a bot joining the live call.`;
    case "A2":
      return `That “${quote}” problem is usually a backlog problem, not a live-meeting problem. Older recordings can contain the useful competitor and objection detail but never reach consistent CRM fields. A short pass across three calls can show whether the gap is capture, terminology, or mapping.`;
    case "A3":
      return `For smaller clients, an enterprise rollout can be disproportionate. The useful test is whether a reusable report can cluster loss reasons, competitor mentions, and terminology without adding another live-call bot. That format is worth validating on one redacted client batch.`;
  }
}

function draftDm(prospect: Prospect): string {
  const quote = prospect.exactQuote.trim();
  if (prospect.segment === "A1") {
    return `Your point about “${quote}” is familiar: the recording exists, but the useful detail still takes manual review. I’m testing a file-first workflow that preserves team terminology and drafts the next step. Would a free teardown of one redacted call be useful? No meeting required.`;
  }
  if (prospect.segment === "A2") {
    return `You mentioned “${quote}”. I’m testing a lightweight way to turn past call files into consistent, CRM-ready insights for small teams. I can review three redacted calls and return the patterns plus suggested fields—would that help? No bot joins.`;
  }
  return `You work with smaller revenue teams where enterprise conversation-intelligence rollouts can be disproportionate. I’m validating a file-first workflow for historical calls, terminology accuracy, and CRM handoff. Would you be open to reviewing a sample report on ten redacted calls?`;
}

function markdown(results: Result[], inputPath: string): string {
  const qualified = results.filter((result) => result.qualified);
  const rejected = results.filter((result) => !result.qualified);
  const lines: string[] = [
    "# Stealth outreach draft plan",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Input: \`${inputPath}\``,
    "",
    "> Review gate: this file drafts work only. Do not post or DM from it without reviewing the target, community rules, exact quote, and current product truth.",
    "",
    `Qualified prospects: ${qualified.length}`,
    `Rejected prospects: ${rejected.length}`,
    "",
  ];

  if (qualified.length === 0) {
    lines.push("No prospect passed qualification. Do not manufacture a target; find a recent, attributable conversation with a concrete call/CRM problem.", "");
  }

  for (const result of qualified) {
    const p = result.prospect;
    lines.push(
      `## ${p.id} — ${p.platform} / ${p.segment}`,
      "",
      `- Source: ${p.url}`,
      `- Author: ${p.author ?? "not supplied"}`,
      `- Exact pain: “${p.exactQuote}”`,
      `- Engagement before run: ${p.engaged === true ? "yes" : "no"}`,
      "",
      "### Public reply (reply first)",
      "",
      result.publicReply ?? "No draft generated.",
      "",
      "### DM status",
      "",
      p.engaged === true
        ? `Engagement is recorded. Draft only; send only after a fresh review:\n\n${result.dm}`
        : "Do not DM yet. Wait for engagement with the public reply.",
      "",
    );
  }

  if (rejected.length > 0) {
    lines.push("## Rejected during qualification", "");
    for (const result of rejected) {
      lines.push(
        `- **${result.prospect.id}** — ${result.prospect.url}`,
        `  - ${result.reasons.join("; ")}`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Manual browser checklist",
    "",
    "1. Open the source URL and confirm the post is still current and visible.",
    "2. Re-read the community rules; reject the target if self-promotion or AI-generated content is prohibited.",
    "3. Confirm the public reply is specific, helpful, human-reviewed, and contains no fabricated proof.",
    "4. Obtain explicit confirmation immediately before posting the public reply.",
    "5. Log the permalink and exact posted text after posting.",
    "6. DM only after the author engages; request a redacted file only after permission.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function appendRunSummary(logPath: string, inputPath: string, results: Result[]): void {
  const qualified = results.filter((result) => result.qualified).length;
  const rejected = results.length - qualified;
  const summary = [
    "",
    `## Planner run — ${new Date().toISOString()}`,
    "",
    `- Input: \`${inputPath}\``,
    `- Qualified drafts: ${qualified}`,
    `- Rejected prospects: ${rejected}`,
    "- External messages sent by this script: 0",
    "- Browser, cookies, likes, follows, replies, and DMs: untouched",
    "",
  ].join("\n");
  appendFileSync(resolve(logPath), summary, "utf8");
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    usage();
    return;
  }

  const inputPath = argValue(args, "--input", DEFAULT_INPUT);
  const outputPath = argValue(args, "--out", DEFAULT_OUTPUT);
  const logPath = argValue(args, "--log", DEFAULT_LOG);
  const shouldWrite = args.includes("--write");
  const prospects = readInput(inputPath);
  const results = prospects.map(qualify);
  const output = markdown(results, inputPath);

  if (shouldWrite) {
    writeFileSync(resolve(outputPath), output, "utf8");
    appendRunSummary(logPath, inputPath, results);
    console.log(`Wrote ${outputPath}`);
    console.log(`Updated ${logPath}`);
  } else {
    process.stdout.write(output);
    console.error("\nDry run only. Add --write to save local drafts and the run summary.");
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
