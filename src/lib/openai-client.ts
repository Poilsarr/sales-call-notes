import { OpenAI } from 'openai';
import { getSecret } from '@/lib/secrets';
import { wrapClient } from '@/lib/langfuse';

const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RETRIES = 3;

export interface OpenAIClientOptions {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export function createOpenAIClient(opts: OpenAIClientOptions = {}): OpenAI {
  const client = new OpenAI({
    apiKey: opts.apiKey || getSecret('OPENAI_API_KEY'),
    baseURL: opts.baseURL,
    timeout: opts.timeout ?? DEFAULT_TIMEOUT,
    maxRetries: opts.maxRetries ?? DEFAULT_MAX_RETRIES,
  });
  return wrapClient(client);
}
