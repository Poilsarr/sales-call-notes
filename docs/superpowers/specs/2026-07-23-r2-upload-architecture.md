# R2 Direct Upload — Bypass Vercel 4.5MB Body Limit

## Problem

Vercel Hobby plan caps serverless function body size at 4.5MB. Our
`/api/analyze` receives raw audio via `FormData`, so any file >4MB is
rejected at the platform level before our code runs. A paying Pro or
Business user cannot upload a realistic sales call (~20-50MB).

Competitors allow files up to **5GB** (NeverCap) or have no per-file
byte limit at all (Fireflies, Fathom, Otter, tl;dv). Our 4MB cap is
not competitive even for the Free plan.

## Solution

Use **Cloudflare R2** with presigned URLs. The client uploads directly
to R2, bypassing Vercel's serverless function entirely. Our API only
ever receives small JSON payloads (a few hundred bytes).

## Flow

```
User selects/records file
       │
       ▼
Client → POST /api/upload-url { filename, contentType, fileSize }
       │
       ▼
Server generates presigned PUT URL (valid 15 min, scoped to userId)
       │
       ▼
Client uploads file directly to R2 via presigned URL
       │
       ▼
Client → POST /api/analyze { r2Key, removeFillers, language, template }
       │
       ▼
Server fetches file from R2 by key
Server runs transcription, analysis, etc.
For free users: DELETE from R2 immediately after processing
For paid users: keep in R2 for playback/download
       │
       ▼
Response sent to client (same shape as today)
```

The serverless function body never exceeds ~1KB — only JSON, never
the raw audio file.

---

## Tier Differentiation Strategy

The R2 architecture is not just an infrastructure fix. It enables a
clean product story that makes the Free plan a competitive weapon
while giving paid users clear, natural upgrade paths.

### Current Competitor Free Tiers

| Feature | Gauge Free (fixed) | Fathom Free | Otter Free | Fireflies Free | tl;dv Free |
|---|---|---|---|---|---|
| File upload transcription | ✅ **5 calls** | ❌ | ❌ (3 lifetime) | ❌ | ❌ (5 total) |
| Bot recording | ❌ | ✅ Unlimited | ✅ 300 min | ✅ 800 min | ✅ Unlimited |
| AI summaries | ✅ 5 calls | ✅ 5/month | ✅ included | ✅ limited | ✅ 10/month |

**Gauge Free is the only service that processes existing recordings
at no cost.** Fathom and Fireflies require inviting a bot to a live
meeting. Otter gives 3 file imports *lifetime*. tl;dv gives 5.

This is the marketing hook: *"Got a recorded call sitting in your
drive? Upload it to Gauge — full transcript, AI summary, speaker
detection — in 30 seconds, free."*

The current 4MB limit makes this claim false. The R2 fix makes it
real.

### Proposed Tier Boundaries

| Feature | Free | Pro ($9) | Business ($29) | Enterprise |
|---|---|---|---|---|
| Calls/month | 5 | Unlimited | Unlimited | Unlimited |
| Minutes/month | 300 | 1,200 | 6,000 | Unlimited |
| Max file size | 30 MB | 200 MB | 500 MB | 500 MB |
| Max call duration | 30 min | 90 min | 240 min | 480 min |
| Audio replay | ❌ Deleted | ✅ 90 days | ✅ Permanent | ✅ Permanent |
| Download original | ❌ | ✅ | ✅ | ✅ |
| Audio quality | Compressed | Original | Original | Original |
| Team members | 1 | 5 | Unlimited | Unlimited |
| Browser recording | ❌ | ✅ | ✅ | ✅ |
| Live transcription | ❌ | ✅ | ✅ | ✅ |
| CRM sync | ❌ | ✅ HubSpot/Salesforce | ✅ + Teams | ✅ All |
| API access | ❌ | ✅ | ✅ | ✅ |
| Webhooks/Zapier | ❌ | ❌ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ❌ | ✅ |

### Why These Numbers

**30 MB on Free** — covers a 30-min call at 128 kbps MP3 (~28 MB).
The user gets a genuine experience: upload a real call, see the full
output. They hit the 5-call limit before the size limit matters.

**200 MB on Pro** — covers a 90-min call at high bitrate (320 kbps
MP3 = ~210 MB for 90 min). Realistically most sales calls are 20-40
min at ~12 MB. The 200 MB ceiling is generous but documented as a
cap.

**500 MB on Business** — covers multi-hour workshops, training
sessions, 4-hour strategy calls. Only Enterprise touches this.

### Natural Conversion Paths

The user hits a free limit, thinks "that was useful, I want more":

1. **5 calls used** — strongest trigger. They experienced value.
2. **"Replay this call"** — audio was deleted. Upgrade to keep.
3. **"Call was 35 min"** — upgrade for 90-min limit.
4. **"Sync to CRM"** — Pro unlocks HubSpot/Salesforce push.
5. **"Share with my team"** — Pro for workspace (5 seats).

None of these feel like a ransom. Each is "more of something good."

### Free Plan is Marketing, Not Charity

The Free plan exists to:
- Get users in the door with zero friction
- Demonstrate value on a *real* file (not a demo)
- Create a natural upsell trigger at the 5th call

Without the R2 fix, the Free plan doesn't even work (4MB too small)
and generates zero conversions. With the fix, it becomes a genuine
acquisition channel.

---

## Key Design Decisions

### 1. Recording Retention

- **Free users:** recording deleted from R2 immediately after
  transcription completes (inline in the API handler). Only transcript
  stored in Postgres.
- **Paid users (Pro/Business/Enterprise):** recording kept in R2 for
  replay and download. Users can mark a call as "not useful" and
  confirm deletion to remove it from R2.
- **Safety net:** R2 lifecycle policy deletes any object older than 90
  days, preventing storage leaks from failed cleanup logic.

### 2. Client-Side Compression

- Files ≤50MB: upload the original as-is.
- Files >50MB: compress to 16kHz mono WAV first (existing
  `compressAudio` function) then upload.
- This balances upload speed against browser performance. Most sales
  calls at 128kbps MP3 stay under 50MB for typical durations.

### 3. Upload Guardrails

Hard limit of 500MB per file, validated at three layers:

| Layer | Check |
|-------|-------|
| `POST /api/upload-url` | Rejects `fileSize > 500MB` before generating URL |
| Client (record page) | Blocks selection of files >500MB with toast error |
| R2 bucket lifecycle | 90-day auto-delete as safety net |

### 4. Security

- Presigned URLs expire after 15 minutes (can't be reused later).
- Key path includes userId: `uploads/{userId}/{uuid}.{ext}` — users
  can only upload to their own prefix (enforced server-side).
- CORS on R2 bucket restricts to our origin.
- File type validation: only audio/* MIME types accepted.

---

## R2 Cost and Scaling

### Cost Model

R2 has no egress fees. Billing is:

| Metric | Free Tier | Over Free Tier |
|--------|-----------|----------------|
| Storage | 10 GB | $0.015/GB/month |
| Class A (writes) | 1M/month | $4.50/1M |
| Class B (reads) | 10M/month | $0.36/1M |

### Projected Scale

| Metric | Per User/Month | 500 Paid Users | 2,000 Paid Users |
|--------|---------------|----------------|------------------|
| Calls/user | 15 | 7,500 | 30,000 |
| Avg file size | 30 MB | 225 GB storage | 900 GB storage |
| Storage cost | — | **$3.38/month** | **$13.50/month** |
| Writes (upload) | 15 | 7,500 (free) | 30,000 (free) |
| Reads (analyze) | 15 | 7,500 (free) | 30,000 (free) |
| Deletes (cleanup) | 15 | 7,500 (free) | 30,000 (free) |

Writes and reads remain within R2 free tier up to ~66,000 users.

Free users' files are deleted immediately, so they consume near-zero
storage in steady state. Only paid users' retained files count.

### Scaling Limits

- **Free tier writes (1M):** hit at ~66,000 users uploading 15
  files/month.
- **Free tier reads (10M):** hit at ~222,000 users reading 15
  files/month (analyze + playback).
- **Storage:** scales linearly at $0.015/GB/month — negligible cost
  in the foreseeable future.

---

## Files to Create/Modify

### Create

| File | Purpose |
|------|---------|
| `src/lib/r2.ts` | S3-compatible client, upload/download helpers |
| `src/app/api/upload-url/route.ts` | Presigned URL generation endpoint |
| `src/types/r2.ts` | Types for r2Key references |

### Modify

| File | Change |
|------|--------|
| `src/app/app/record/page.tsx` | Upload flow: get presigned URL → upload to R2 → analyze with r2Key |
| `src/app/api/analyze/route.ts` | Accept `r2Key` as alternative to `file` in FormData; fetch & cleanup |
| `src/lib/audio-compress.ts` | Change threshold from 4MB to 50MB |
| `src/app/app/record/page.tsx` | Remove 4MB blocks, add 500MB validation |
| `src/app/calls/[id]/page.tsx` | Add R2 audio player for paid users |
| Plan/config | Add feature flag `audio_retention` for paid-only playback |

---

## Implementation Order

1. Set up R2 bucket + env vars + CORS policy
2. Create `src/lib/r2.ts` (S3 client, presigned URL, download, delete)
3. Create `POST /api/upload-url` endpoint
4. Modify record page upload flow
5. Modify `POST /api/analyze` to accept r2Key
6. Add cleanup logic (free → delete, paid → keep)
7. Add 500MB hard limit checks
8. Update `compressAudio` threshold to 4MB → 50MB
9. Add paid-user playback UI on call detail page
10. Add "mark as useless + confirm delete" flow for paid users
