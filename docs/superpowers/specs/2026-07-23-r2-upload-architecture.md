# Vercel Blob Direct Upload — REMAINING WORK

## Status: Architecture Already Shipped

The presigned URL flow exists and works. Client uploads directly to Blob,
server only receives JSON. This was completed in earlier PRs.

**Already shipped:**
- `src/app/api/upload-url/route.ts` — presigned URL generation
- `src/lib/blob.ts` — `fetchBlobBuffer` + `deleteBlob` helpers
- Record page upload flow (lines 140-160) — gets presigned URL → PUT to Blob → POST JSON to analyze
- Analyze route JSON handling (lines 49-80) — fetches from Blob by URL
- Audio compression threshold: 4MB → 50MB (already updated)
- 500MB hard limit check (record page line 127)

## Remaining Work (3 items)

### 1. Plan-Based Upload Limits

**Current:** `upload-url/route.ts` uses flat 500MB for all users.

**Should be:** Per-plan limits matching the tier table:
- Free: 30 MB
- Pro: 200 MB
- Business/Enterprise: 500 MB

**Fix:** Query user's plan in `upload-url` route, reject if `fileSize > planLimit`.

**File:** `src/app/api/upload-url/route.ts` (~10 lines added)

### 2. UI Text Mismatch

**Current:** Record page says "MP3, WAV, M4A up to 50MB" (line 411).

**Should be:** Dynamic per-plan limit, or static "up to 500MB" (matches the actual limit).

**Fix:** Update text to match reality. Dynamic requires fetching plan on client.

**File:** `src/app/app/record/page.tsx` line 411 (~1 line change)

### 3. Conditional Deletion (Free vs Paid)

**Current:** `analyze` route does NOT delete the blob after processing.

**Should be:** Free users → delete immediately. Paid → keep for playback.

**Fix:** After transcription completes, check `user.plan`. If 'free', call `deleteBlob(blobUrl)`.

**File:** `src/app/api/analyze/route.ts` (~5 lines added near end)

---

## Cost Warning

Vercel Blob Hobby plan: 1 GB included, then $10/GB/month.

At 500 paid users × 30MB avg = 15 GB = ~$140/month overage.

**Mitigations:**
1. Free users' files deleted immediately (item #3 above)
2. Paid users' files kept for 90 days max
3. At 100+ paid users, consider R2 migration ($0.015/GB vs $10/GB)

---

## Summary

**The external AI's 249-line spec is 95% stale.** The architecture shipped
months ago. Only 3 polish items remain:
1. Plan-based limits in upload-url route
2. UI text update
3. Conditional deletion for free users

Total work: ~15 lines across 3 files.

**Ponytail verdict:** Ship these 3 items in one PR. Don't rewrite the spec.
