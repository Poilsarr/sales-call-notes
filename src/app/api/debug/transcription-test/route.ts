import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createOpenAIClient } from '@/lib/openai-client';
import { getSecret } from '@/lib/secrets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    nodeVersion: process.version,
    openaiKeySet: Boolean(getSecret('OPENAI_API_KEY')),
    groqKeySet: Boolean(getSecret('GROQ_API_KEY')),
    tests: {},
  };

  // Test OpenAI
  try {
    const t0 = Date.now();
    const client = createOpenAIClient();
    // Use models.list as a lightweight connectivity test (no audio upload needed)
    await client.models.list();
    results.tests.openai = { ok: true, latencyMs: Date.now() - t0 };
  } catch (err: any) {
    results.tests.openai = {
      ok: false,
      message: err?.message,
      cause: err?.cause?.message,
      causeType: err?.cause?.constructor?.name,
      stack: err?.stack?.split('\n').slice(0, 5).join('\n'),
    };
  }

  // Test Groq
  try {
    const t0 = Date.now();
    const groqClient = createOpenAIClient({
      apiKey: getSecret('GROQ_API_KEY') || getSecret('OPENAI_API_KEY') || '',
      baseURL: 'https://api.groq.com/openai/v1',
    });
    await groqClient.models.list();
    results.tests.groq = { ok: true, latencyMs: Date.now() - t0 };
  } catch (err: any) {
    results.tests.groq = {
      ok: false,
      message: err?.message,
      cause: err?.cause?.message,
      causeType: err?.cause?.constructor?.name,
      stack: err?.stack?.split('\n').slice(0, 5).join('\n'),
    };
  }

  // Test raw fetch to both APIs
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${getSecret('OPENAI_API_KEY')}` },
    });
    results.tests.openaiRawFetch = { ok: res.ok, status: res.status, latencyMs: Date.now() - t0 };
  } catch (err: any) {
    results.tests.openaiRawFetch = { ok: false, message: err?.message, cause: err?.cause?.message };
  }

  try {
    const t0 = Date.now();
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${getSecret('GROQ_API_KEY')}` },
    });
    results.tests.groqRawFetch = { ok: res.ok, status: res.status, latencyMs: Date.now() - t0 };
  } catch (err: any) {
    results.tests.groqRawFetch = { ok: false, message: err?.message, cause: err?.cause?.message };
  }

  return NextResponse.json(results);
}
