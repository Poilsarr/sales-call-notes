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

const wrappedClients = new WeakMap<object, object>();

export function wrapClient<T extends object>(client: T): T {
  const existing = wrappedClients.get(client);
  if (existing) return existing as T;
  const cfg = getLangfuseConfig();
  if (!cfg) return client;
  try {
    const wrapped = observeOpenAI(client, { ...cfg, clientInitParams: cfg }) as T;
    wrappedClients.set(client, wrapped);
    wrappedClients.set(wrapped, wrapped);
    return wrapped;
  } catch {
    return client;
  }
}
