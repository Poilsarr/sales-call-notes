import Langfuse from "langfuse";

let _langfuse: Langfuse | null = null;

function getLangfuse(): Langfuse | null {
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  if (!secretKey || !publicKey) return null;
  if (!_langfuse) {
    _langfuse = new Langfuse({
      secretKey,
      publicKey,
      baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
    });
  }
  return _langfuse;
}

export function getLangfuseHandler() {
  const langfuse = getLangfuse();
  if (!langfuse) return undefined;
  return langfuse.getLangfuseHandler();
}

export async function flushLangfuse() {
  const langfuse = getLangfuse();
  if (langfuse) {
    await langfuse.flushAsync();
  }
}
