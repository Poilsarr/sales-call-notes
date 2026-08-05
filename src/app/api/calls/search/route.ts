import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserByClerkId } from '@/lib/get-user';
import { getByokKeys } from '@/lib/byok-resolver';
import { KnowledgeGraphService } from '@/services/ai/knowledge-graph';
import { cacheGet, cacheSet, makeCacheKey } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 10;
const MAX_QUERY_CHARS = 200;
const MIN_QUERY_CHARS = 2;
const CACHE_TTL_SECONDS = 60;

// Semantic recall: embed the user's natural-language query and return the
// top-N most similar calls. Embedding-only on purpose — the route caps
// queries at 200 chars ≈ 50 tokens ≈ ~$0.000001 on text-embedding-3-small,
// no generative tokens. Ranking improvements (chunking, metadata boost,
// keyword hybrid) belong in the service, not this route.
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = await checkRateLimit(user.id, 'search');
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as {
      query?: unknown;
      limit?: unknown;
    } | null;
    if (!body || typeof body.query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const query = body.query.trim().slice(0, MAX_QUERY_CHARS);
    if (query.length < MIN_QUERY_CHARS) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const requestedLimit = typeof body.limit === 'number' ? Math.round(body.limit) : 5;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    const cacheKey = makeCacheKey('calls-search', user.id, query, `${limit}`);
    const cached = await cacheGet<{ results: unknown[]; degraded: boolean }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // BYOK read-only: if the user stored their own OpenAI key, embed with it;
    // otherwise the service falls back to the shared pool.
    const byok = await getByokKeys(user.id);

    const results = await new KnowledgeGraphService().searchByQuery(
      query,
      user.id,
      limit,
      byok.openaiKey
    );

    // Kill-criterion metering: query → result ratio and corpus match quality.
    // If <30% of seeded queries return a relevant call, ranking needs work.
    console.info(
      `[recall] query=${JSON.stringify(query)} hits=${results.length}/${limit} top=${results[0]?.similarity?.toFixed(3) ?? 0}`
    );

    const payload = {
      results: results.map((call) => ({
        id: call.id,
        filename: call.filename,
        title: call.title,
        summary: call.summary,
        date: call.createdAt.toISOString(),
        similarity: call.similarity,
      })),
      // Honest marker: true when the user's stored key could not be used and
      // the shared pool served the embedding instead.
      degraded: (byok.dropped?.length ?? 0) > 0,
    };

    await cacheSet(cacheKey, payload, CACHE_TTL_SECONDS);
    return NextResponse.json(payload);
  } catch (error) {
    // Degrade, never 500: log the detail server-side but keep the client
    // body generic — raw error messages can embed API keys (OpenAI echoes
    // the key on 401) and database infra details.
    console.error('[recall] search failed:', error);
    return NextResponse.json({ error: 'Search unavailable. Please try again.' }, { status: 503 });
  }
}
