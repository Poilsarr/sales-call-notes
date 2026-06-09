# Diarization Provider — Decision Matrix

Status: ACCEPTED · Owner: AI/ML · Last updated: 2026-06-09

Context: `src/services/ai/diarization.ts` shells out to `python3` running
whisper + pyannote. Two breakages in last sprint (missing ffmpeg, pyannote
auth token drift). Target: <$100/mo at projected 500 calls × 15 min avg
(7,500 min/mo). No Python runtime guaranteed in deploy target (Node/Vercel).

## Decision

Deepgram nova-2 (model: `nova-2`, feature: `diarize=true`).

## Alternatives Evaluated

| Provider        | Model               | $/min | Native diarization | Latency (1 min) | Infra         | Verdict        |
| --------------- | ------------------- | ----- | ------------------ | --------------- | ------------- | -------------- |
| Deepgram nova-2 | nova-2              | 0.0043| yes (built-in)     | ~3-5 s          | none          | CHOSEN         |
| OpenAI Whisper  | whisper-1           | 0.006 | NO (separate pass) | ~10-20 s        | none          | rejected: no diarization; would still need pyannote |
| OpenAI Whisper  | gpt-4o-transcribe   | 0.006 | NO                 | ~8-15 s         | none          | rejected: same |
| AssemblyAI      | Universal           | 0.015 | yes                | ~15-30 s        | none          | rejected: 3.5x cost, blows budget |
| AWS Transcribe  | standard            | 0.024 | yes                | ~20-40 s        | none          | rejected: 5.6x cost |
| Google STT      | chirp 2 (diarize)   | 0.024 | yes                | ~15-30 s        | none          | rejected: 5.6x cost + per-request GCSAuth pain |
| Azure Speech    | fast transcription  | 0.016 | yes                | ~15-25 s        | none          | rejected: 3.7x cost |
| Self-hosted     | pyannote-3 + faster-whisper | 0 (compute) | yes | 2-4x RT (CPU) / 0.3x RT (GPU) | GPU VM + Python | rejected: violates "no Python infra" constraint |

## Cost at 7,500 min/mo (projected)

| Provider        | Monthly     | vs budget ($100) |
| --------------- | ----------- | ---------------- |
| Deepgram nova-2 | $32.25      | 32% (OK)         |
| OpenAI Whisper  | $45.00      | 45% (OK, but no diarization) |
| AssemblyAI      | $112.50     | 113% (OVER)      |
| AWS Transcribe  | $180.00     | 180% (OVER)      |
| Google chirp 2  | $180.00     | 180% (OVER)      |
| Azure fast      | $120.00     | 120% (OVER)      |
| Self-hosted GPU (L4) | ~$70-110 (compute) | marginal; +ops cost |

Headroom for Deepgram: $67.75/mo — covers ~16k min/mo before budget breach.

## Why Deepgram nova-2

1. Built-in diarization — single API call, single response, no second pass.
2. Cheapest option that retains native diarization (32% of budget).
3. No Python in deploy path. Pure HTTPS, JSON out.
4. Speaker labels returned per word with `diarize=true`; maps cleanly to
   existing `SpeakerSegment[]` shape in `DiarizationService`.
5. Word-level timestamps already returned (currently absent from pyannote
   output — was a known gap).
6. Lowest latency in batch mode among the diarize-capable providers.

## Why NOT the others (one line each)

- Whisper: no diarization; would still need pyannote → no infra win.
- AssemblyAI: 3.5x cost; latency ~4x slower.
- AWS/GCP/Azure: 3.7-5.6x cost; vendor lock-in to cloud IAM.
- Self-hosted: violates explicit "no Python infra" constraint; adds GPU ops.

## Migration Plan

- New service: `src/services/ai/diarization-deepgram.ts`
  - `DiarizationService` interface preserved (no caller changes).
  - `diarize(audioPath)` -> POST `https://api.deepgram.com/v1/listen?model=nova-2&diarize=true&smart_format=true`
  - Map `response.results.utterances[]` -> existing `SpeakerSegment[]`.
- Old: `src/services/ai/diarization.ts` (whisper+pyannote) — keep behind
  feature flag `DIARIZATION_PROVIDER=deepgram|whisper` for the cutover week.
- Delete: `src/services/ai/scripts/diarize.py`, `detect_lang.py`
  (language detection rolls into Deepgram `detect_language=true`).
- Env: `DEEPGRAM_API_KEY` added to Vercel + Sentry redact list.
- Test: replay 10 production calls against both providers, assert speaker
  count + segment boundaries within ±0.5 s of pyannote baseline.

## Fallback Path

If Deepgram degrades (latency >30s p95, error rate >2%, or pricing changes
>2x):

1. Flip `DIARIZATION_PROVIDER=whisper` (env) — instant revert to existing
   Python pipeline. Confirms the abstraction was worth it.
2. Secondary path (if Python also broken): OpenAI `whisper-1` for
   transcription + a lightweight JS-only VAD-based turn detector
   (e.g. `@ricky0123/vad-web`) as a *degraded* diarization mode
   (turn-level, not speaker-level). Acceptable for MVP per SPEC §6.2.
3. Tertiary: AssemblyAI Universal (cost increase approved by owner).

Trigger conditions for fallback are checked weekly by the health
endpoint; auto-rollback is NOT enabled (cost of false-positive is higher
than a 24h degraded mode).

## Risks

- Vendor lock-in to Deepgram for diarization. Mitigated by feature-flag
  abstraction.
- API key leakage. Mitigated by Vercel encrypted envs + Sentry scrubber.
- Speaker ID drift on noisy cellular audio. Mitigated by smart_format +
  eventual second-pass name assignment from CRM contact matching.
