# "The string did not match the expected pattern" — Diagnostic Memo

## Symptom
Recording/Upload page on `/app/record` returns failed toast
"PROCESSING FAILED / 0% / The string did not match the expected pattern"
after a successful upload-init POST. `Try again` button shown.

## Where the string comes from
**Only one site in `src/` produces this exact phrase:**
`src/app/api/upload-url/route.ts:41` (and `:77` surfaces it via the catch).

It's not from JS. It's not from `@vercel/blob` SDK (grep proves it).
It's **Vercel's control-API JSON body** when `issueSignedToken` rejects
the request — code `bad_request`, message propagated verbatim by
`getBlobError(res)` at `chunk-CIIQSN42.js:642`.

## Attempted fixes (all on same file, all failed)
| Commit | `allowedContentTypes` sent | Result |
|--------|---------------------------|--------|
| c54f4ee (original) | none (key omitted) | worked at first |
| 9158ed5 | `[contentType]` exact MIME | failed (regression) |
| 8991b06 | removed other params | failed |
| 4bf4166 | reverted PUT header on client | failed |
| 5847dff (us) | `[contentType, 'audio/*', 'video/*']` | failed |
| 40715c1 (us, live) | none (key omitted) | failed (still) |

**Both code-only attempts ended at the same Vercel error.** That means
the issue is upstream of the SDK call, in the **delegation token's
configured allow-list in the Vercel Blob store dashboard.**

## What we know
- SDK source (`chunk-CIIQSN42.js:1755`): when `allowedContentTypes` is
  `undefined`, the key is omitted from the `POST /signed-token` body.
- SDK source (`chunk-CIIQSN42.js:1514`): the SDK enforces our array
  ⊆ token's array. If the token's array is empty/missing in dashboard,
  the constraint check is no-op.
- SDK source (`chunk-CIIQSN42.js:1654`): the SDK pushes our
  `allowedContentTypes` into presign canonical query **only if**
  `!== undefined`. Omission = no entry in presign.
- "The string did not match the expected pattern" is a Vercel zod
  regex-mismatch on the **JSON body the SDK sends** — most likely the
  `allowedContentTypes` array field, or the `pathname` field, or
  `validUntil`.
- `pathname` = `uploads/${clerkUserId}/${uuid}.${ext}` is well-formed.
- `validUntil` = `Date.now() + 1h` is a valid future timestamp.
- `clerkUserId` from Clerk is a standard `user_xxx` ID.
- Single remaining suspect: the **delegation token's malformed allow-list
  in the Vercel dashboard blob store settings.**

## What we cannot do from CLI
- Read `BLOB_READ_WRITE_TOKEN` value (Vercel CLI masks all secret values
  in `vercel env pull`).
- Inspect the blob store's configured `allowedContentTypes` (Vercel CLI
  has no command for store config beyond `name/billingState/size/region`
  shown by `vercel blob store get <storeId>`).
- Bypass Clerk auth to retest the route from `curl`.

## What's needed from the human (in order of cheapest to most invasive)
1. **Vercel dashboard → Storage → blob-store-4SiryHapG57GVkfq →
   Settings → Allowed content types** — set to "all" or add
   `audio/webm, audio/mpeg, audio/mp4, audio/wav, audio/x-m4a,
   video/mp4, application/octet-stream`. This is most likely the fix.
2. If that's not available in dashboard, **rotate the BLOB token**:
   delete it in dashboard, mint a new one. Old token likely carries a
   stale `allowedContentTypes` encoded in the JWT payload.
3. Last resort: **bypass Vercel Blob entirely for files <4.5MB** by
   re-routing them to multipart POST `/api/analyze`. The route already
   accepts multipart (line 87-110); the page just never sends it.

## Files touched (do not revert without good reason)
- `src/app/api/upload-url/route.ts` — 3 fix attempts live here as
  commented history. Latest is noop (omit `allowedContentTypes`).
- `src/app/app/record/page.tsx` — client always uses Blob path; will
  need changes if option 3 is taken.

## Test status
559/559 vitest passes; `next build` clean on all 3 attempted commits.
Live verification path: browser upload on `/app/record`.
