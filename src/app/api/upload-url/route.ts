import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

// ponytail: eval-require defeats webpack static analysis of undici@6 #private fields.
function getBlob() {
  return eval("require('@vercel/blob')") as {
    issueSignedToken: Function;
    presignUrl: Function;
  };
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filename, fileSize } = await req.json();

  if (typeof fileSize === 'number' && fileSize > 500 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 500MB)' }, { status: 400 });
  }

  const ext = (filename || 'recording.webm').split('.').pop() || 'webm';
  const pathname = `uploads/${userId}/${crypto.randomUUID()}.${ext}`;

  const storeId = process.env.BLOB_STORE_ID;
  if (!storeId) {
    return NextResponse.json({ error: 'BLOB_STORE_ID not set' }, { status: 500 });
  }

  const blob = getBlob();
  const signedToken = await blob.issueSignedToken({
    pathname,
    operations: ['put'],
    validUntil: Date.now() + 60 * 60 * 1000,
    allowedContentTypes: ['audio/*', 'video/*'],
    maximumSizeInBytes: 500 * 1024 * 1024,
  });

  const { presignedUrl } = await blob.presignUrl(signedToken, {
    operation: 'put',
    pathname,
    access: 'private',
  });

  const blobUrl = `https://${storeId}.blob.vercel-storage.com/${pathname}`;

  return NextResponse.json({ presignedUrl, blobUrl, pathname });
}
