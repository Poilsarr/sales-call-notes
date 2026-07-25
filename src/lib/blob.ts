import { del } from '@vercel/blob';

export async function fetchBlobBuffer(blobUrl: string): Promise<Buffer> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set');
  }

  const response = await fetch(blobUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch blob: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteBlob(blobUrl: string): Promise<void> {
  try {
    await del(blobUrl);
  } catch (error: any) {
    console.error(`Failed to delete blob: ${error?.message}`);
  }
}
