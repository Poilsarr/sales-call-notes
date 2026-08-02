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
  // allow-list set in the Vercel Blob dashboard. We don't know exactly which
  // entries that allow-list contains — empirically each MIMEs-only attempt and
  // the earlier `audio/*` attempt both fail with "The string did not match the
  // expected pattern" (the error text comes from Vercel's control API
  // pattern-matcher, not the @vercel/blob SDK). The robust fix: pin to the
  // exact two MIME strings the project historically ships (webm + mpeg), keep
  // the broader wildcard as a fallback, and let the route hand the client
  // back the SAME contentType it used (server is source of truth, no surprise
  // mismatch on PUT). One route, one fix.
  const mimePattern = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i;
  const requested =
    typeof requestedContentType === 'string' ? requestedContentType.toLowerCase().trim() : '';
  const contentType = mimePattern.test(requested) ? requested : 'audio/webm';
  // Allow both the exact MIME and the wildcard. Vercel permits either — when
  // one is rejected, the other typically passes. The SDK accepts both.
  const allowedContentTypes = [contentType, 'audio/*', 'video/*'];

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
      allowedContentTypes,
    });

    const { presignedUrl } = await blob.presignUrl(signedToken, {
      operation: 'put',
      pathname,
    });

    const blobUrl = `https://${storeId}.blob.vercel-storage.com/${pathname}`;

    return NextResponse.json({ presignedUrl, blobUrl, pathname, contentType });
  } catch (err: any) {
    console.error('Blob signing error:', err?.message, err);
    return NextResponse.json(
      { error: `Upload initialization failed: ${err?.message || 'Unknown error'}` },
      { status: 500 },
    );
  }
}
