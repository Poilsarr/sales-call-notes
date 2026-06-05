import { observeOpenAI } from "langfuse";
import { getSecret } from "@/lib/secrets";

let _config: Record<string, string> | false | null = null;

function getLangfuseConfig() {
  if (_config !== null) return _config;
  const secretKey = getSecret("LANGFUSE_SECRET_KEY");
  const publicKey = getSecret("LANGFUSE_PUBLIC_KEY");
  if (!secretKey || !publicKey) {
    _config = false;
    return null;
  }
  _config = {
    secretKey,
    publicKey,
    baseUrl: getSecret("LANGFUSE_BASE_URL") || getSecret("LANGFUSE_HOST") || "https://cloud.langfuse.com",
  };
  return _config as Record<string, string>;
}

export function wrapClient<T extends object>(client: T): T {
  const cfg = getLangfuseConfig();
  if (!cfg) return client;
  try {
    return observeOpenAI(client, cfg) as T;
  } catch {
    return client;
  }
}
