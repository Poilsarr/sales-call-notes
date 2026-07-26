# Vercel Blob Setup Guide

## Step 1 — Create the Blob Store

1. Go to **Vercel Dashboard** → **Storage** → **Create Blob Store**
2. Store Name: `gauge-audio-uploads`
3. Region: **Washington, D.C. (US East)** — same as serverless functions
4. Access: **Private** (recordings should not be public)
5. Check **"Add a read-write token env var"**
6. Click **Create**

The following env vars will auto-populate in your Vercel project:

| Variable | Set automatically |
|----------|------------------|
| `BLOB_STORE_ID` | ✅ |
| `BLOB_READ_WRITE_TOKEN` | ✅ |
| `BLOB_WEBHOOK_PUBLIC_KEY` | ✅ |

**No credit card required** on the Hobby plan.

## Step 2 — Redeploy

After creating the store, push any pending code changes or go to
Vercel Dashboard → **Deployments** → trigger a redeploy.

## How It Works

```
Client → /api/upload-url → receives presigned PUT URL
Client → PUT file directly to Vercel Blob (bypasses 4.5MB limit)
Client → /api/analyze { blobUrl } → server fetches blob by URL
```

## Cost

| Plan | Storage | Free Users | Paid Users |
|------|---------|-----------|------------|
| Hobby | 256 MB | ✅ (files deleted after processing) | ⚠️ ~8-10 users |
| Pro ($20/mo) | 10 GB | ✅ | ✅ ~300 users |

Free users' audio is deleted immediately after transcription, so they
consume near-zero storage. Paid users' audio stays for replay.

If storage becomes a concern at scale (>50 paid users), we can migrate
to Cloudflare R2 without changing the client code.

## Verification

After deploy, upload a file >4MB (try a 10MB MP3). It should:
1. Upload successfully to Blob
2. Return a transcript
3. For free users: blob deleted after processing (audio not replayable)
4. For paid users: audio retained for replay on call detail page
