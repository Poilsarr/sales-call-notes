import OpenAI from 'openai';
import { Correction } from '@/types';
import { wrapClient } from '@/lib/langfuse';
import { getSecret } from '@/lib/secrets';

export class PostProcessingService {
  private openai: OpenAI;

  constructor() {
    if (!getSecret("OPENAI_API_KEY")) {
      throw new Error('OPENAI_API_KEY is required for post-processing');
    }
    this.openai = wrapClient(new OpenAI({ apiKey: getSecret("OPENAI_API_KEY"), timeout: 300000, maxRetries: 2 }));
  }

  async correctEntities(transcript: string): Promise<{ correctedText: string; corrections: Correction[]; confidence: number }> {
    if (!transcript || transcript.trim().length === 0) {
      return { correctedText: transcript, corrections: [], confidence: 1.0 };
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a transcript correction specialist. Fix obvious errors in sales call transcripts:
1. Capitalize proper names (janine → Janine)
2. Normalize company names (clean sky energy → Clean Sky Energy)
3. Format numbers correctly (20 point 99 → 20.99)
4. Fix phone numbers, emails, addresses
5. Fix obvious mishearings based on context

Return JSON: { correctedText: string, corrections: [{original, corrected, type, confidence}] }`
        },
        { role: 'user', content: transcript }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    if (!response.choices?.[0]?.message?.content) {
      return { correctedText: transcript, corrections: [], confidence: 1.0 };
    }

    let result: { correctedText?: string; corrections?: Correction[] };
    try {
      result = JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      result = { correctedText: transcript, corrections: [] };
    }

    return {
      correctedText: result.correctedText || transcript,
      corrections: result.corrections || [],
      confidence: this.calculateConfidence(result.corrections || [])
    };
  }

  private calculateConfidence(corrections: Correction[]): number {
    if (corrections.length === 0) return 1;
    const avg = corrections.reduce((sum, c) => sum + (c.confidence || 0.8), 0) / corrections.length;
    return Math.round(avg * 100) / 100;
  }

  validateEntities(text: string): { phones: string[]; emails: string[]; zipCodes: string[] } {
    const phones = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    const zipCodes = text.match(/\b\d{5}\b/g) || [];
    return { phones, emails, zipCodes };
  }
}
