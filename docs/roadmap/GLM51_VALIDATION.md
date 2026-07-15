# Validation: glm5.1 verdict on DEPLOYMENT_CHECKLIST.md

> Verified against current code (2026-07-06, main = 875cdff, 50+ PRs
> since deployment.md was last touched in PR #66 / 2026-06-21).

## TL;DR

glm5.1 is **~70% correct** on the diagnosis, **~50% correct** on the
prescription. The deployment.md is stale — it predates 50 PRs of
graceful-degradation work. Real product ships with hybrid sync/async
architecture, three layers of fallback (ffmpeg, pyannote, presidio),
and regex-only PII redaction as last resort. The actual missing
piece is **persistent audio storage**, not the audio pipeline itself.

## Claim-by-claim audit

| # | glm5.1 claim | verified? | actual state |
|---|---|---|---|
| 1 | "ffmpeg EXTERNAL-BLOCKED on Vercel" | partial | Vercel still can't run ffmpeg. Code has try/catch with no-op fallback (audio-preprocessing.ts) + size-based duration estimate. **Degrades silently**, doesn't block. |
| 2 | "Python EXTERNAL-BLOCKED" | partial | Diarization is **explicitly guarded** with `if (process.env.VERCEL) throw` (analyze/route.ts:116) + Whisper-pause fallback. ML PII redactor has try/catch with **regex fallback** (pii-redactor.ts:42-48). Both work on Vercel. |
| 3 | "No persistent storage (S3)" | TRUE | Audio bytes live in `fileBuffer` for request lifetime only. `os.tmpdir()` used for diarize temp file, deleted after. Audio is **gone** after request ends. Real ship-blocker. |
| 4 | "PII redaction disconnected" | FALSE | Wired in analyze/route.ts:185-186. Service at `src/services/ai/pii-redactor.ts` spawns `redact_pii.py` with try/catch + regex fallback. Production-safe. |
| 5 | "Billing not live" | TRUE | `PADDLE_API_KEY` is in `.env.example` but no live checkout. /pricing shows static numbers. Real ship-blocker. |
| 6 | "Must decouple heavy compute from Vercel" | PARTIALLY WRONG | The code IS already decoupled — `src/services/queue.ts` + `src/services/worker.ts` define a BullMQ producer/worker pair. **But the worker is dead code — no caller invokes enqueueTranscription()**. All work runs inline in the Vercel function. The decoupling exists, just not wired. |
| 7 | "Implement worker pattern" | ALREADY DONE | Code exists. `queue.ts` exports enqueue functions, `worker.ts` defines Workers with python+whisper. The pattern is there. What's missing: **wiring the API route to call the queue instead of running sync**. |
| 8 | "Sentry DSN / Paddle / OpenAI env vars" | TRUE | All external-blocked. The DEPLOYMENT_CHECKLIST.md "What This Checklist Is Missing" section confirms this. |
| 9 | "Build a fantastic SaaS, 90% there" | TRUE | 549/549 vitest, `next build` green (post PR #117), production smoke tested. Genuinely good shape. |

## What's actually missing (priority order)

1. **S3/R2 storage for audio bytes** — $0.023/GB/mo on S3, ~2h work.
   Without it: user uploads a 50MB call, transcription succeeds, audio
   is gone forever. Cannot re-transcribe with different params, cannot
   debug, cannot re-run PII. **Hard ship-blocker for B2B sales data.**

2. **Worker wiring** — `enqueueTranscription()` exists, just not called
   from `/api/analyze`. ~1h work to move transcription off the request
   path. NOT a ship-blocker for V1 (transcription works sync in <60s
   for short files), but required before charging users (60s+ calls
   would 504 on Vercel Pro).

3. **Paddle live checkout** — needs user's Paddle sandbox account.
   Code is there. EXTERNAL-BLOCKED per deployment.md.

4. **OpenAI quota** — current key is 0 quota, Groq fallback works
   (PR #45). EXTERNAL-BLOCKED. Real money needed.

5. **Next.js 14.2.3 → 15.5.18+** — RSC CVE. Separate workstream
   (issue #118, just opened). Major migration, 2-3 days.

6. **Sentry DSN in prod** — free tier works. EXTERNAL-BLOCKED.

7. **usegauge.com DNS** — EXTERNAL-BLOCKED.

## Where glm5.1 was wrong

- **"PII redaction disconnected"** — wired since PR #18. The
  deployment.md says "code exists, not wired" but that was true
  on 2026-06-21. Not true on 2026-07-06.

- **"Move audio processing to a dedicated worker"** — the
  infrastructure is already built. The API route just doesn't
  use it. Different problem: wiring, not architecture.

- **"You cannot build an audio-processing AI app entirely on
  standard Vercel Serverless functions"** — empirically false.
  The project DOES build on Vercel serverless. The ffmpeg /
  pyannote / presidio layers are bypassed with try/catch and
  fallbacks. Transcription (the actual core feature) runs on
  OpenAI/Groq APIs — no native binary needed. Audio preprocessing
  uses size-based estimation when ffmpeg is missing. **It works,
  it's just degraded.**

## What deployment.md missed

The deployment.md predates 50 PRs. It correctly identifies the
EXTERNAL-BLOCKED items, but it claims things are "code exists, not
wired" for items that are now wired. Three concrete examples:

- PII redaction: deployed in PR #18.
- Groq fallback: deployed in PR #45.
- BullMQ worker.ts/queue.ts: deployed in PR #18, 27.

The file's age is the bug. Last touched: 6959ec1 (PR #66,
2026-06-21). Compare ARCHITECTURE.md which is even worse — talks
about "localStorage" and "demo mode" as if the project were a
proof-of-concept.

## Action: update deployment.md, don't refactor the architecture

- Update DEPLOYMENT_CHECKLIST.md to reflect current state (1h work)
- Update ARCHITECTURE.md (1h work — talks about Prisma as "future")
- Add S3 storage for audio (~2h work, real ship-blocker)
- Wire API route → enqueueTranscription (~1h work, future-proofing)
- Open issue for: storage + worker wiring (in addition to #118 RSC)

## Memory: re-verify claims against code, not against prose

The pattern in this session: deployment.md was the source of truth
for glm5.1, but deployment.md was stale. Three layers of error:
- Prose summary ("PII redactor not wired") was wrong.
- Underlying code (pii-redactor.ts) was correct.
- The architecture is sound; the documentation drifted.

**Lesson:** When an external model summarizes a doc, re-verify
against the actual code. Especially when the doc hasn't been
touched in 6+ weeks.
