import { observeOpenAI } from "langfuse";

let _config: Record<string, string> | false | null = null;

function getLangfuseConfig() {
  if (_config !== null) return _config;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  if (!secretKey || !publicKey) {
    _config = false;
    return null;
  }
  _config = {
    secretKey,
    publicKey,
    baseUrl: process.env.LANGFUSE_BASE_URL || process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
  };
  return _config as Record<string, string>;
}

export function wrapClient<T>(client: T): T {
  const cfg = getLangfuseConfig();
  if (!cfg) return client;
  try {
    return observeOpenAI(client, cfg);
  } catch {
    return client;
  }
}
