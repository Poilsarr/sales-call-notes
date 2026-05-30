import prisma from '@/lib/prisma';

export class KnowledgeGraphService {
  /**
   * Generate a simple embedding for a text.
   * In a real production app, this would use a local model like Sentence-Transformers
   * or a local Ollama instance. For this implementation, we'll provide a
   * structural approach that can be easily swapped with a real model.
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // This is a placeholder for a real local embedding model.
    // To make it truly local, one would use:
    // 1. Ollama (e.g. model 'all-minilm')
    // 2. @xenova/transformers (WASM)

    // Implementation via a simple dummy embedding for now,
    // but structured to be replaced by a real call.
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // Standard Small model size

    words.forEach((word, i) => {
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
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
        NOT: { id: callId },
        NOT: { embedding: { equals: [] } }
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
