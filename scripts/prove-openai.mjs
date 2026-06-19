#!/usr/bin/env node
/**
 * scripts/prove-openai.mjs
 *
 * Real AI connectivity proof. NOT a test — a runnable proof.
 * Run: node scripts/prove-openai.mjs
 * Captures: latency, HTTP status, response shape, token usage.
 * Writes the result to scripts/.proof-openai.json for CI to gate on.
 *
 * Tries OpenAI first, then Groq fallback. Whichever responds first
 * with 2xx is the proof. Matches the wrapper's fallback order in
 * src/services/ai/transcription.ts.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const openaiKey = process.env.OPENAI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;

const results = [];
let success = null;

if (openaiKey) {
  const r = await probe("openai", "https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Reply with exactly one short word." },
      { role: "user", content: "ping" },
    ],
    max_tokens: 20,
    temperature: 0,
  }, { Authorization: `Bearer ${openaiKey}` });
  results.push(r);
  if (r.ok) success = r;
}

if (!success && groqKey) {
  const r = await probe("groq", "https://api.groq.com/openai/v1/chat/completions", {
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "Reply with exactly one short word." },
      { role: "user", content: "ping" },
    ],
    max_tokens: 20,
    temperature: 0,
  }, { Authorization: `Bearer ${groqKey}` });
  results.push(r);
  if (r.ok) success = r;
}

const proof = {
  ok: !!success,
  provider: success?.provider ?? null,
  latencyMs: success?.latencyMs ?? null,
  status: success?.status ?? null,
  reply: success?.reply ?? null,
  results,
  timestamp: new Date().toISOString(),
};

writeFileSync(join(__dirname, ".proof-openai.json"), JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof, null, 2));

if (!success) process.exit(1);
process.exit(0);

async function probe(provider, url, body, headers) {
  const start = Date.now();
  let res, text;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    text = await res.text();
  } catch (err) {
    return {
      provider,
      ok: false,
      error: `network: ${err instanceof Error ? err.message : String(err)}`,
      latencyMs: Date.now() - start,
    };
  }
  const latencyMs = Date.now() - start;
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  return {
    provider,
    ok: res.ok,
    status: res.status,
    latencyMs,
    model: parsed.model ?? body.model,
    usage: parsed.usage ?? null,
    reply: parsed.choices?.[0]?.message?.content ?? null,
    error: parsed.error?.message ?? null,
  };
}
