# Direct Upload — Bypass Vercel 4.5MB Body Limit

## Problem

Vercel Hobby plan caps serverless function body size at 4.5MB. Our
`/api/analyze` receives raw audio via `FormData`, so any file >4MB is
rejected at the platform level before our code runs. A paying Pro or
Business user cannot upload a realistic sales call (~20-50MB).

Competitors allow files up to **5GB** (NeverCap) or have no per-file
byte limit at all (Fireflies, Fathom, Otter, tl;dv). Our 4MB cap is
not competitive even for the Free plan.

## Solution

Use **Vercel Blob** (already installed, no extra account needed) with
presigned URLs via the server SDK (`issueSignedToken` + `presignUrl`).
The client uploads directly to Blob, bypassing Vercel's serverless
function entirely. Our API only ever receives small JSON payloads
(a few hundred bytes).

## Flow

```
User selects/records file
       │
       ▼
Client → POST /api/upload-url { filename, fileSize }
       │
       ▼
Server generates presigned PUT URL via @vercel/blob (issueSignedToken + presignUrl)
       │
       ▼
Client uploads file directly to Vercel Blob via presigned URL (raw fetch, no SDK)
       │
       ▼
Client → POST /api/analyze { blobUrl, removeFillers, language, template }
       │
       ▼
Server fetches file from Vercel Blob by URL (with BLOB_READ_WRITE_TOKEN auth header)
Server runs transcription, analysis, etc.
For free users: DELETE from Blob immediately after processing
For paid users: keep in Blob for playback/download
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

- **Free users:** recording deleted from Vercel Blob immediately after
  transcription completes (inline in the API handler). Only transcript
  stored in Postgres.
- **Paid users (Pro/Business/Enterprise):** recording kept in Blob for
  replay and download. Users can mark a call as "not useful" and
  confirm deletion to remove it from Blob.
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

### 4. Security

- Presigned URLs expire after 60 minutes.
- Key path includes userId: `uploads/{userId}/{uuid}.{ext}` — users
  can only upload to their own prefix.
- Maximum file size is enforced at the presigned URL level
  (`maximumSizeInBytes: 500MB`).
- File type validation: only audio/* MIME types accepted.

---

## Vercel Blob Cost and Scaling

Vercel Blob pricing (Hobby plan):

| Metric | Hobby | Pro |
|--------|-------|-----|
| Storage | **256 MB** | 10 GB |
| Transfer | 1 GB/month | 100 GB/month |
| Max file size | 500 MB | 500 MB |

### The "256 MB" Problem

Hobby's 256 MB storage cap is designed for small assets, not audio
files. **Free users' files are deleted immediately after processing,
so they consume near-zero storage in steady state.** Paid users'
files accumulate, but at Hobby's scale this is manageable:

- 10 Pro users × 15 calls/month × 30 MB = 4.5 GB → would exceed
  Hobby cap.

**Realistically, this means after ~10-20 paid users you'll need to
upgrade to Vercel Pro ($20/month).** Pro includes 10 GB storage,
100 GB transfer, and higher serverless limits.

### Pricing Comparison

| Provider | 100 GB Storage | No CC Required |
|----------|---------------|----------------|
| Vercel Blob | Already set up, $20/mo (Pro) | ✅ No card for Hobby |
| Cloudflare R2 | $1.35/mo + no egress | ❌ Requires card |
| AWS S3 | $2.30/mo | ❌ Requires card |

Vercel Blob is the zero-config choice right now. If storage costs
become a concern at scale (~50+ paid users), we can migrate to
R2 without changing the client-facing API.

### Cleanup Mitigation

To stay within Hobby's 256 MB longer, add a cron that deletes paid
users' files older than 30 days. After the user's retention period
expires, only the transcript stays in Postgres.

---

## Files to Create/Modify

### Create

| File | Purpose |
|------|---------|
| `src/app/api/upload-url/route.ts` | Presigned URL generation endpoint (uses `issueSignedToken` + `presignUrl`) |
| `src/lib/blob.ts` | Helpers for server-side blob fetch/delete |

### Modify

| File | Change |
|------|--------|
| `src/app/app/record/page.tsx` | Upload flow: get presigned URL → PUT to blob → analyze with blobUrl |
| `src/app/api/analyze/route.ts` | Accept `blobUrl` in JSON body; fetch from blob; add cleanup for free users |
| `src/lib/audio-compress.ts` | Change compression threshold from 4MB to 50MB |
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
