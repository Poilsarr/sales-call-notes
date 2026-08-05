import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { createOpenAIClient } from '@/lib/openai-client';
import { getSecret } from '@/lib/secrets';

// ponytail: build the shared OpenAI client lazily and only when an API key
// actually resolves. Creating the client without a key makes the SDK ship an
// empty `Authorization: Bearer ` header to api.openai.com — a doomed round
// trip (401) per request for Groq-only or keyless deployments.
let sharedOpenai: OpenAI | null = null;
function getSharedOpenAI(): OpenAI | null {
  if (!sharedOpenai && getSecret("OPENAI_API_KEY")) {
    sharedOpenai = createOpenAIClient({ timeout: 30000 });
  }
  return sharedOpenai;
}

export function _resetSharedOpenAIClientForTests(): void {
  sharedOpenai = null;
}

export class KnowledgeGraphService {
  private async generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
    const client = apiKey ? createOpenAIClient({ apiKey, timeout: 30000 }) : getSharedOpenAI();
    if (!client) {
      throw new Error(
        'Embeddings unavailable: set OPENAI_API_KEY in env vars (or provide a user BYOK key).'
      );
    }
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async indexCall(callId: string, apiKey?: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { transcript: true, summary: true }
    });

    if (!call) throw new Error('Call not found');

    // ponytail: char-cap the embedding input. 16k chars ≈ 4k tokens,
    // matches the analysis cap. text-embedding-3-small is $0.02/1M tokens
    // so a 4k-token embed ≈ $0.00008/call (cap from ~$0.0002-0.0005).
    const textToEmbed = `${call.summary || ''} ${call.transcript || ''}`.slice(0, 16000);
    const embedding = await this.generateEmbedding(textToEmbed, apiKey);

    await prisma.call.update({
      where: { id: callId },
      data: { embedding }
    });
  }

  async findSimilarCalls(callId: string, limit = 5) {
    const targetCall = await prisma.call.findUnique({
      where: { id: callId },
      select: { embedding: true }
    });

    if (!targetCall || !targetCall.embedding) return [];

    const allCalls = await prisma.call.findMany({
      where: {
        AND: [
          { NOT: { id: callId } },
          { NOT: { embedding: { equals: [] } } }
        ]
      },
      select: { id: true, embedding: true, summary: true }
    });

    const scores = allCalls.map(call => ({
      id: call.id,
      summary: call.summary,
      similarity: this.cosineSimilarity(targetCall.embedding!, call.embedding!)
    }));

    return scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // RAG retrieval: embed the user's natural-language query and return the
  // top-N most similar calls owned by that user. This replaces sending the
  // entire call history to the LLM — which breaks past ~50 calls.
  async searchByQuery(
    query: string,
    userId: string,
    limit = 5,
    apiKey?: string
  ): Promise<{ id: string; filename: string; title: string | null; summary: string | null; transcript: string | null; createdAt: Date; similarity: number }[]> {
    const sanitizedQuery = query.slice(0, 16000);
    const queryEmbedding = await this.generateEmbedding(sanitizedQuery, apiKey);

    const candidates = await prisma.call.findMany({
      where: {
        userId,
        NOT: { embedding: { equals: [] } },
      },
      select: {
        id: true,
        filename: true,
        title: true,
        summary: true,
        transcript: true,
        createdAt: true,
        embedding: true,
      },
    });

    const results = candidates
      .map(call => ({
        id: call.id,
        filename: call.filename,
        title: call.title,
        summary: call.summary,
        transcript: call.transcript,
        createdAt: call.createdAt,
        similarity: this.cosineSimilarity(queryEmbedding, call.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const seen = new Set(results.map(call => call.id));

    if (sanitizedQuery.trim()) {
      const titleMatches = await prisma.call.findMany({
        where: {
          userId,
          title: { contains: sanitizedQuery.trim(), mode: 'insensitive' },
        },
        select: {
          id: true,
          filename: true,
          title: true,
          summary: true,
          transcript: true,
          createdAt: true,
        },
      });

      for (const call of titleMatches) {
        if (seen.has(call.id)) continue;
        seen.add(call.id);
        results.push({ ...call, similarity: 0 });
      }
    }

    return results.slice(0, limit);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) || 0;
  }
}
