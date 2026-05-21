import OpenAI from 'openai';
import { Correction } from '@/types';

export class PostProcessingService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async correctEntities(transcript: string): Promise<{ correctedText: string; corrections: Correction[]; confidence: number }> {
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

    const result = JSON.parse(response.choices[0].message.content || '{}');
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
    const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    const zipCodes = text.match(/\b\d{5}\b/g) || [];
    return { phones, emails, zipCodes };
  }
}
