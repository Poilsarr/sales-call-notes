# TRANSCRIBE-CHUNKING-PLAN

Status: ready for execution
Date: 2026-08-16
Arc: transcription long-call support (follow-up to TRANSCRIBE-ECONNRESET-FIX)

## Problem

Paid users upload 30-60 min calls. Current pipeline fails:
- OpenAI whisper-1 and Groq whisper-large-v3 both cap direct uploads at 25MB.
- Vercel serverless has no ffmpeg binary (only `fluent-ffmpeg` dep; no
  `ffmpeg-static`), so AudioPreprocessingService.preprocess() rejects and the
  RAW webm/opus buffer (Chrome-default ~128kbps ≈ 0.94MB/min) is sent to the
  provider. A 30-min call ≈ 28MB → over the 25MB cap → the new size-guard
  error from the ECONNRESET fix. Disaster for the main use case.

## Design

1. **ffmpeg-static** (`package.json` + `src/services/ai/audio-preprocessing.ts`):
   add the dep and point fluent-ffmpeg at `require('ffmpeg-static')` when
   available (fall back to system `ffmpeg` for local dev where it exists).
   This makes preprocess() WORK on Vercel: any input format → 16kHz mono
   16-bit PCM WAV (1.92MB/min). Vercel Hobby function size limit 250MB
   uncompressed; ffmpeg-static linux-x64 binary ~70MB — fits.
   - NOTE: preprocess output for a 30-min call = 57.6MB — still >25MB, so
     chunking is mandatory, preprocess alone is not enough.

2. **Pure WAV split/merge module** (NEW `src/services/ai/wav-split.ts`):
   - `isWavBuffer(buf: Buffer): boolean` — RIFF/WAVE magic bytes (44-byte
     header assumed, PCM).
   - `splitWavIntoChunks(buf: Buffer, maxBytes: number, overlapSeconds: number)`:
     split the DATA region into chunks ≤ maxBytes with overlapSeconds of
     overlap at each boundary; each chunk is a standalone WAV (44-byte header
     with corrected data size + RIFF size). PCM is 16kHz mono 16-bit
     (32000 bytes/s) — matching preprocess output; assert on other formats.
     Return `{ buffer: Buffer; startSeconds: number }[]`.
   - `mergeChunkResults(results, overlapSeconds)`:
     offset segments/words by each chunk's startSeconds; drop segments whose
     text (normalized whitespace, trimmed, lowercase) duplicates a segment
     seen in the previous chunk's overlap window; concatenate. text =
     segments joined; language from first chunk; duration = last end;
     confidence = mean of chunk confidences.

3. **Chunking in `TranscriptionServiceV2.transcribe()`**:
   - Replace the hard throw on >25MB: if buffer > 25MB AND `isWavBuffer` →
     chunk (maxBytes = 20MB ≈ 10.9 min, overlap = 10s per Groq cookbook),
     transcribe each chunk sequentially with the SAME model/language/options,
     merge, return. If buffer > 25MB and NOT WAV → keep the existing
     actionable size error (can't split compressed audio safely).
   - Sequential (not parallel) to respect quota/burst limits; ~3 chunks for a
     30-min call, ~6 for 60-min. Each chunk uses the existing fallback
     (Groq→OpenAI) per chunk.
   - `MAX_AUDIO_BYTES` guard stays for the non-WAV case only.

## Files (disjoint executor sets)

- **Executor A**: `package.json` (+dep), `src/services/ai/audio-preprocessing.ts`
- **Executor B**: `src/services/ai/wav-split.ts` (NEW), `src/services/ai/wav-split.test.ts` (NEW)
- **Executor C**: `src/services/ai/transcription-v2.ts`, `src/services/ai/transcription-v2.test.ts`

Route (`src/app/api/analyze/route.ts`) is UNCHANGED — chunking lives inside
the service. maxDuration stays 300s (30-60 min calls = 3-6 chunks × ~20-40s).

## Verification

1. Per-executor: `npx vitest run <their test files>` + `npx tsc --noEmit`
2. Orchestrator gate: `npx vitest run` (full, 1029+ tests) + `npx next build`
3. ffmpeg-static sanity: local run of AudioPreprocessingService on a WAV/MP3
   fixture proves the path-wiring works (macOS binary, same code path as linux)
4. Commit as one concern: `feat(transcription): chunk long audio (>25MB) with ffmpeg-static + overlap merge`
5. Push → Vercel deploy green

## Out of scope

- Parallel chunk fan-out / streaming progress to client
- Client-side MediaRecorder `audioBitsPerSecond: 32000` (nice-to-have size
  reduction; chunking already covers correctness)
- Groq `url`-param path (100MB claim unverified; chunking is deterministic)
- OpenAI `gpt-4o-transcribe` (1500s duration cap — avoid for long calls)