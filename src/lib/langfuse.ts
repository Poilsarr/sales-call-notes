let _langfuse: any = null;

async function getLangfuse(): Promise<any | null> {
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  if (!secretKey || !publicKey) return null;
  if (_langfuse) return _langfuse;
  try {
    const { default: Langfuse } = await import("langfuse");
    _langfuse = new Langfuse({
      secretKey,
      publicKey,
      baseUrl: process.env.LANGFUSE_BASE_URL || process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
    });
    return _langfuse;
  } catch {
    return null;
  }
}

export async function getLangfuseHandler() {
  const langfuse = await getLangfuse();
  if (!langfuse) return undefined;
  return langfuse.getLangfuseHandler();
}

export async function flushLangfuse() {
  const langfuse = await getLangfuse();
  if (langfuse) {
    await langfuse.flushAsync();
  }
}
