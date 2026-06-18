import { OpenAI } from 'openai';
import { getSecret } from '@/lib/secrets';

const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 3;
const FETCH_RETRIES = 3;
const FETCH_RETRY_DELAY = 1_000;

export interface OpenAIClientOptions {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export function createOpenAIClient(opts: OpenAIClientOptions = {}): OpenAI {
  return new OpenAI({
    apiKey: opts.apiKey || getSecret('OPENAI_API_KEY'),
    baseURL: opts.baseURL,
    timeout: opts.timeout ?? DEFAULT_TIMEOUT,
    maxRetries: opts.maxRetries ?? DEFAULT_MAX_RETRIES,
    fetch: createResilientFetch(),
  });
}

function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const msg = String((err as any).message || (err as any).cause || '').toLowerCase();
  return (
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('abort') ||
    msg.includes('socket hang up') ||
    msg.includes('connection')
  );
}

function createResilientFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
      try {
        const response = await fetch(input, {
          ...init,
          keepalive: true,
        });
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < FETCH_RETRIES && isNetworkError(lastError)) {
          await new Promise((r) => setTimeout(r, FETCH_RETRY_DELAY * attempt));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new Error('Request failed after retries');
  };
}
