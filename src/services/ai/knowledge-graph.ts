import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { getSecret } from '@/lib/secrets';

const openai = new OpenAI({ apiKey: getSecret('OPENAI_API_KEY'), timeout: 30000, maxRetries: 2 });

export class KnowledgeGraphService {
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async indexCall(callId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { transcript: true, summary: true }
    });

    if (!call) throw new Error('Call not found');

    const textToEmbed = `${call.summary || ''} ${call.transcript || ''}`;
    const embedding = await this.generateEmbedding(textToEmbed);

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
