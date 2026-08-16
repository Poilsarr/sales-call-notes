# TRANSCRIBE-ECONNRESET-FIX-PLAN

Status: ready for execution
Date: 2026-08-16
Arc: prod bugfix (post-deploy transcription failure)

## Symptoms

Record Call page fails at the Transcribing stage with:

```
Transcription failed: could not reach the AI provider (Connection error. |
Cause: request to https://api.openai.com/v1/audio/transcriptions failed,
reason: read ECONNRESET)
```

## Root cause (evidence-backed, swarm recon + direct repro)

1. **Both provider keys are invalid — the primary blocker.**
   Direct repro from this machine with the exact values pulled from Vercel
   Production (`vercel env pull --environment=production`):
   - `GROQ_API_KEY` → `401 Invalid API Key` (api.groq.com, whisper-large-v3)
   - `OPENAI_API_KEY` → `401 Incorrect API key provided` (api.openai.com, whisper-1)
   Both were created 7d ago. **User action required: rotate both keys in Vercel.**
   No code change can fix this.

2. **No 25MB size guard anywhere in the pipeline.** Both providers cap direct
   uploads at 25MB (OpenAI whisper-1: 25MB; Groq: 25MB). The only server-side
   gate is the 100MB FileValidationService check. On Vercel there is no ffmpeg
   binary (only `fluent-ffmpeg`, no `ffmpeg-static`), so preprocessing always
   fails and the RAW uploaded buffer (webm/opus at Chrome-default 128kbps ≈
   0.94MB/min) goes straight to the provider. Repro confirms: 57MB WAV →
   Groq `413 Request Entity Too Large`, and OpenAI connection-reset on
   oversized bodies is a documented symptom (community threads, Vercel KB).
   The 413 is swallowed by the Groq→OpenAI fallback (transcription-v2.ts:82-94),
   then OpenAI drops the connection mid-upload → ECONNRESET surfaces after
   SDK retries → confusing user-facing error.

3. **Fallback errors are never logged.** The catch in `transcribe()` swallows
   the Groq failure silently — this is why the 401/413 was invisible.

4. **Latent:** the buffer is always labeled `audio.wav` via `toFile()`
   (transcription-v2.ts:70) even when the content is webm/mp4 — a known 400
   "Invalid file format" trigger once keys are fixed.

## Changes

### A. `src/services/ai/transcription-v2.ts`

- Add `MAX_AUDIO_BYTES = 25 * 1024 * 1024`; at the top of `transcribe()`
  (after the key guards), if `audioBuffer.length > MAX_AUDIO_BYTES` throw an
  actionable error: "Audio file is too large for the transcription provider
  (max 25MB per file). Please upload a shorter recording."
  - Message must NOT contain "connection" / "network" / "timeout" so
    route.ts:191 does not misroute it; it falls through to the generic
    branch (route.ts:197-199) which returns the message verbatim.
- Catch block: `console.error` the failed model, error status, message, and
  cause BEFORE deciding fallback.
- Fallback skip: if the caught error is size-class (`status === 413` or
  message matches /too large|entity too large|exceeds .* limit|payload/i),
  rethrow it instead of recursing to the other provider (doomed + slow).
- Thread real filename: accept `filename?: string` in options; use
  `toFile(audioBuffer, filename ?? 'audio.wav', { type: 'audio/wav' })`.

### B. `src/app/api/analyze/route.ts`

- Pass `filename: fileName` into `transcriptionService.transcribe(...)`.
- No new error branch needed (size error hits the generic 500 branch).

### C. Tests — new `src/services/ai/transcription-v2.test.ts`

Mock `openai` module (same pattern as transcription.test.ts):
- Buffer > 25MB → throws size error, provider `create` NOT called.
- Groq client throws 413 → does NOT fall back to OpenAI (create called once).
- Groq client throws generic error → falls back to whisper-1 (create called
  twice, models `['whisper-large-v3', 'whisper-1']`).
- `filename` option threads into `toFile` (assert create received a file with
  the real name — inspect the `file` arg).
- No keys → throws actionable "Transcription unavailable" error.

## Verification

1. `npx vitest run src/services/ai/transcription-v2.test.ts`
2. `npx vitest run` (full suite must stay green)
3. `npx next build`
4. `git status --short` clean before commit (leave graphify-out wip alone)

## User action (blocking, cannot be coded)

Rotate `GROQ_API_KEY` + `OPENAI_API_KEY` in Vercel Production. Then re-run
the provider repro (keys present check) or simply re-upload a test call.
Note: keys were created 7d ago and both 401 — likely wrong/restricted keys.

## Out of scope (proposed follow-ups, not in this change)

- ffmpeg-static on Vercel so preprocessing actually runs (16kHz mono WAV)
- Server-side chunking (>25MB / >25min calls) with overlap-aware merge
- Client-side bitrate control (`audioBitsPerSecond: 32000` in MediaRecorder)
- Key-health probe endpoint surfaced in the settings UI