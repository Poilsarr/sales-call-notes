import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { getUserByClerkId } from '@/lib/get-user';
import { getPlan } from '@/lib/plans';

// ponytail: per-tier file size limits (MB). Free gets 30MB — covers a 30-min call at 128kbps MP3.
const MAX_FILE_SIZE_MB: Record<string, number> = {
  free: 30,
  pro: 200,
  business: 500,
  enterprise: 500,
};

// ponytail: eval-require defeats webpack static analysis of undici@6 #private fields.
function getBlob() {
  return eval("require('@vercel/blob')") as {
    issueSignedToken: Function;
    presignUrl: Function;
  };
}

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserByClerkId(clerkUserId);
  const plan = getPlan(user.plan || 'free');
  const maxFileSizeMB = MAX_FILE_SIZE_MB[plan.tier] || 500;

  const { filename, fileSize, contentType: requestedContentType } = await req.json();

  if (typeof fileSize === 'number' && fileSize > maxFileSizeMB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large. ${plan.name} plan limit is ${maxFileSizeMB}MB.` }, { status: 400 });
  }

  // Vercel Blob's delegation token has its own per-token allowedContentTypes
  // allow-list set in the Vercel Blob dashboard. Empirically every combination
  // we tried (single exact MIME, multiple exact MIMEs, wildcards "audio/*"
  // "video/*") gets rejected by Vercel's control API with "The string did not
  // match the expected pattern." This is the canonical Vercel zod regex-
  // pattern-mismatch error — its exact shape on the delegation token's
  // allow-list is opaque from inside the project. The robust move: stop
  // passing allowedContentTypes entirely. If the token's allow-list is empty
  // or unset, omitted-vs-present is the difference that breaks the validator.
  // The token + dashboard config is the source of truth; route-side
  // restrictions were the entire source of regression history.
  const mimePattern = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i;
  const requested =
    typeof requestedContentType === 'string' ? requestedContentType.toLowerCase().trim() : '';
  const contentType = mimePattern.test(requested) ? requested : 'audio/webm';
  // ponytail: omission is intentional — see commit message.

  const ext = (filename || 'recording.webm').split('.').pop() || 'webm';
  const pathname = `uploads/${clerkUserId}/${crypto.randomUUID()}.${ext}`;

  const storeId = process.env.BLOB_STORE_ID;
  if (!storeId) {
    return NextResponse.json({ error: 'BLOB_STORE_ID not set' }, { status: 500 });
  }

  const blob = getBlob();
  try {
    const signedToken = await blob.issueSignedToken({
      pathname,
      operations: ['put'],
      validUntil: Date.now() + 60 * 60 * 1000,
    });

    const { presignedUrl } = await blob.presignUrl(signedToken, {
      operation: 'put',
      pathname,
    });

    const blobUrl = `https://${storeId}.blob.vercel-storage.com/${pathname}`;

    return NextResponse.json({ presignedUrl, blobUrl, pathname, contentType });
  } catch (err: any) {
    // ponytail: the @vercel/blob SDK strips Vercel's zod `issues` array before throwing — BlobError only carries `message`. To see WHICH field the pattern rejects, re-issue the exact same control-API request directly and log the raw response body. The deployment has the real token at runtime, so this reproduces the server-side error faithfully. Never log the token itself.
    console.error('Blob signing error:', err?.message);
    let zodPath = '';
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (token && storeId) {
        const apiVersion =
          process.env.VERCEL_BLOB_API_VERSION_OVERRIDE || process.env.NEXT_PUBLIC_VERCEL_BLOB_API_VERSION_OVERRIDE || '12';
        const diagRes = await fetch(`https://vercel.com/api/blob/signed-token`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
            'x-vercel-blob-store-id': storeId,
            'x-api-blob-request-id': `${storeId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
            'x-api-blob-request-attempt': '0',
            'x-api-version': apiVersion,
          },
          body: JSON.stringify({
            pathname,
            operations: ['put'],
            validUntil: Date.now() + 60 * 60 * 1000,
          }),
        });
        const rawBody = await diagRes.text();
        console.error(`Blob /signed-token raw response (${diagRes.status}):`, rawBody);
        try {
          const parsed = JSON.parse(rawBody);
          const issues = parsed?.error?.issues;
          if (Array.isArray(issues) && issues.length > 0) {
            zodPath = issues
              .map((i: any) => (Array.isArray(i?.path) ? i.path.join('.') : String(i?.path ?? '')))
              .filter(Boolean)
              .join('; ');
          }
        } catch {
          // rawBody wasn't JSON — leave zodPath empty
        }
      } else {
        console.error('Blob diagnostic skipped: no BLOB_READ_WRITE_TOKEN or storeId');
      }
    } catch (diagErr: any) {
      console.error('Blob diagnostic fetch failed:', diagErr?.message);
    }
    const detail = zodPath ? ` [failing field: ${zodPath}]` : '';
    return NextResponse.json(
      { error: `Upload initialization failed: ${err?.message || 'Unknown error'}${detail}` },
      { status: 500 },
    );
  }
}
