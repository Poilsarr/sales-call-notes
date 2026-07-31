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

  // Vercel Blob rejects glob patterns like 'audio/*' in allowedContentTypes —
  // each entry must be an exact MIME type (the control API pattern-checks the
  // string, and '*' fails it with "The string did not match the expected
  // pattern"). Use the exact type the browser reported, fall back to webm.
  const mimePattern = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i;
  const contentType =
    typeof requestedContentType === 'string' && mimePattern.test(requestedContentType)
      ? requestedContentType
      : 'audio/webm';

  const ext = (filename || 'recording.webm').split('.').pop() || 'webm';
  const pathname = `uploads/${clerkUserId}/${crypto.randomUUID()}.${ext}`;

  const storeId = process.env.BLOB_STORE_ID;
  if (!storeId) {
    return NextResponse.json({ error: 'BLOB_STORE_ID not set' }, { status: 500 });
  }

  const blob = getBlob();
  const signedToken = await blob.issueSignedToken({
    pathname,
    operations: ['put'],
    validUntil: Date.now() + 60 * 60 * 1000,
    allowedContentTypes: [contentType],
    maximumSizeInBytes: maxFileSizeMB * 1024 * 1024,
  });

  const { presignedUrl } = await blob.presignUrl(signedToken, {
    operation: 'put',
    pathname,
    access: 'private',
  });

  const blobUrl = `https://${storeId}.blob.vercel-storage.com/${pathname}`;

  return NextResponse.json({ presignedUrl, blobUrl, pathname });
}
