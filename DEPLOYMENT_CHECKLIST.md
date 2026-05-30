# Production Deployment Checklist: Sales Call Notes AI

## 1. Infrastructure & Environment
- [ ] **Upstash Redis**: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` configured.
- [ ] **Database**: PostgreSQL instance migrated to production schema (`npx prisma migrate deploy`).
- [ ] **Auth**: Clerk `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` set for production domain.
- [ ] **Storage**: S3 bucket or similar configured for audio file persistence (if not using temp files).

## 2. AI Provider Configuration
- [ ] **OpenAI**: API Key with sufficient credits for `whisper-1` and `gpt-4o`.
- [ ] **Groq**: API Key configured as fallback for Llama-3.3.
- [ ] **Model Routing**: Verify `TranscriptionServiceV2` model selection logic (duration-based) works in prod.

## 3. System Dependencies
- [ ] **ffmpeg/ffprobe**: Installed and available in the production environment (crucial for `FileValidationService`).
- [ ] **Python Runtime**: Python 3.9+ installed with required packages for PII redactor and diarization:
    - `pip install presidio-analyzer presidio-anonymizer`
    - `pip install pyannote.audio` (if using full diarization).

## 4. Security & Performance
- [ ] **Rate Limits**: Verify `UPSTASH_REDIS` is responding; test 429 responses on `/api/analyze`.
- [ ] **PII Redaction**: Test a call with known PII to verify `redact_pii.py` is executing and redacting.
- [ ] **Middleware**: Verify Clerk session validation is active for all `/app` and `/api` routes.

## 5. Observability & Monitoring
- [ ] **Logging**: Check that `console.log` is captured by Vercel/CloudWatch.
- [ ] **Error Handling**: Verify that AI provider failures (quota/auth) return user-friendly messages instead of 500 crashes.

## 6. Final Smoke Test
- [ ] Upload valid audio file → Transcription → Analysis → CRM Sync.
- [ ] Upload corrupt audio file → Verify 400 error.
- [ ] Upload oversized file (>100MB) → Verify 400 error.
- [ ] Access `/app` without auth → Verify redirect to sign-in.
