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

## Fix attempt log (chronological, only the verified ones)
| Commit | What it changed | Verified outcome |
|--------|----------------|------------------|
| c54f4ee | Initial Vercel Blob presigned-PUT integration | Worked initially; broke later (regression source unclear) |
| 9158ed5 | Switched `allowedContentTypes` from `['audio/*','video/*']` to `[contentType]` exact MIME | Failed (claimed) |
| 8991b06 | "Remove invalid SDK parameters" — multiple edits to `upload-url/route.ts` | Failed (claimed) |
| 4bf4166 | Client uses server-returned `contentType` for PUT header | Failed (claimed) |
| 5847dff | `allowedContentTypes = [contentType, 'audio/*', 'video/*']` (broaden) | Failed (claimed) |
| 40715c1 | Drop `allowedContentTypes` entirely | User reported "still same error" |
| ed4959a | Multipart fast-path for ≤4MB on record page | Diagnostic now accurate; >4MB slow path unchanged |
| 13957b0 | Re-issue raw `POST /signed-token` in the catch block; log raw body | Replaces `ed4959a`'s broken `JSON.stringify(err, Object.getOwnPropertyNames(err))` — which only printed `message/stack/name` because the SDK strips zod `issues[]` before throwing. New diagnostic re-issues the exact same control-API call (same body, same headers including `x-vercel-blob-store-id`, `x-api-blob-request-id`, `x-api-blob-request-attempt`, `x-api-version`) using the deployment's real `BLOB_READ_WRITE_TOKEN` at runtime, logging only the raw response body — never the token. |

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
- Single remaining suspect: a malformed/rotated `BLOB_READ_WRITE_TOKEN`
  (store mismatch) or a Vercel-side body-schema rule on `/signed-token`
  we can't see from CLI. There is **no** dashboard "Allowed content
  types" setting to fix (see ruled-out section).

## Diagnostic state (commit 13957b0)
`getBlobError(res)` at SDK line 642 `await response.json()` then maps
known error shapes (contentType-not-allowed, pathname-mismatch, etc.)
into named codes. **Anything not matched becomes a generic `BlobError`
that only carries `.message` and `.stack`.** The zod `issues[]` array
(including the failing field's `path`) is consumed and discarded by the
SDK before the error reaches the route. `JSON.stringify(err, Object.
getOwnPropertyNames(err))` will only print `message/stack/name`; it
cannot surface the zod detail.

To capture the real failing field, commit 13957b0 re-issues the exact
same `POST https://vercel.com/api/blob/signed-token` request that the
SDK made (same body, same headers — `x-vercel-blob-store-id`,
`x-api-blob-request-id`, `x-api-blob-request-attempt`, `x-api-version`),
using the deployment's real `BLOB_READ_WRITE_TOKEN` env var, and logs
the raw response body. The token is never logged. With this diagnostic
live, the next >4MB upload failure will print the full zod issues in
Vercel runtime logs, naming the failing field by path.

## What we cannot do from CLI
- Read `BLOB_READ_WRITE_TOKEN` value (Vercel CLI masks all secret values
  in `vercel env pull`).
- Inspect the blob store's configured `allowedContentTypes` (Vercel CLI
  has no command for store config beyond `name/billingState/size/region`
  shown by `vercel blob store get <storeId>`).
- Bypass Clerk auth to retest the route from `curl`.

## What's left (in order, ending at the user's hands)
1. **Test the ≤4MB multipart fast-path** (commit `ed4959a`). Easiest with
   one of `~/Desktop/Sample Call_ENG_MA.mp3`. Bypasses the Vercel Blob
   code path entirely; should succeed end-to-end (analysis response
   shape verified against `/api/analyze`).
2. **For >4MB uploads**, the Vercel Blob signing still fails. The 13957b0
   diagnostic now logs Vercel's raw zod error body, including
   `issues[].path`. Forward the next >4MB failure's Vercel log entry to
   the agent — it will name the failing field and the fix becomes one
   line.

## How the Vercel dashboard hypothesis was ruled out
- The Blob store dashboard has no "Allowed content types" setting. Only
  immutable access (private/public) + region. `allowedContentTypes` is
  a code-side parameter to `issueSignedToken`, not a dashboard control.
- `vercel env ls` confirms `BLOB_READ_WRITE_TOKEN` exists and is set in
  Production. `vercel env pull` masks the value; `vercel env ls` shows
  it as `Encrypted`. No CLI method to read the live token, but the
  deployment runtime can read it (used by 13957b0's diagnostic).
- `vercel blob store get store_4SiryHapG57GVkfq` shows
  `Billing State: Active`, `Size: 0B`, `Region: iad1` — no allow-list
  is exposed there either.

## Files touched (do not revert without good reason)
- `src/app/api/upload-url/route.ts` — omit `allowedContentTypes` from
  `issueSignedToken` (no-op); catch block re-issues raw `POST /signed-
  token` for diagnostics (13957b0).
- `src/app/app/record/page.tsx` — multipart fast-path for ≤4MB
  (ed4959a). Skip the Vercel Blob path entirely for the common case.

## Test status
559/559 vitest passes; `next build` clean on every committed attempt.
Live verification path: browser upload on `/app/record`.
