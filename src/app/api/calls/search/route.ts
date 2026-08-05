import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserByClerkId } from '@/lib/get-user';
import { getByokKeys } from '@/lib/byok-resolver';
import { KnowledgeGraphService } from '@/services/ai/knowledge-graph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 10;
const MAX_QUERY_CHARS = 200;
const MIN_QUERY_CHARS = 2;

// Semantic recall: embed the user's natural-language query and return the
// top-N most similar calls. Embedding-only on purpose — 1 embedding per
// query (~$0.00008), no generative tokens. Ranking improvements (chunking,
// metadata boost, keyword hybrid) belong in the service, not this route.
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

    // BYOK read-only: if the user stored their own OpenAI key, embed with it;
    // otherwise the service falls back to the shared pool. Never fails the
    // request when keys are absent — the service error path is handled below.
    const byok = await getByokKeys(user.id);

    const results = await new KnowledgeGraphService().searchByQuery(
      query,
      user.id,
      limit,
      byok.openaiKey
    );

    return NextResponse.json({
      results: results.map((call) => ({
        id: call.id,
        filename: call.filename,
        title: call.title,
        summary: call.summary,
        date: call.createdAt.toISOString(),
        similarity: call.similarity,
      })),
      degraded: false,
    });
  } catch (error) {
    // Degrade, never 500: a missing embedding key (actionable error from the
    // service), DB hiccup, or any unexpected failure surfaces as 503 so the
    // UI can show a retry instead of a dead page.
    const message = error instanceof Error ? error.message : 'Search unavailable';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
