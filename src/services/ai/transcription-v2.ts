import OpenAI, { toFile } from 'openai';
import { TranscriptionResult, TranscriptionSegment, WordTimestamp } from '@/types';

const TRANSCRIPTION_PROMPT = `This is a sales enrollment call. A representative is enrolling a customer in an energy or insurance plan. Pay special attention to: customer names, addresses, account numbers, utility company names, plan names, rates/prices, phone numbers, email addresses, dates. Spell out numbers clearly.`;

export class TranscriptionServiceV2 {
  private openai: OpenAI;
  private groqOpenai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for transcription');
    }
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is required for transcription fallback');
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000,
      maxRetries: 2
    });
    this.groqOpenai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: 60000,
      maxRetries: 2
    });
  }

  async transcribe(audioBuffer: Buffer, model: 'whisper-1' | 'whisper-large-v3' = 'whisper-1', attempted: string[] = []): Promise<TranscriptionResult> {
    const client = model === 'whisper-1' ? this.openai : this.groqOpenai;

    try {
      const file = await toFile(audioBuffer, 'audio.wav', { type: 'audio/wav' });

      const response = await client.audio.transcriptions.create({
        file,
        model,
        prompt: TRANSCRIPTION_PROMPT,
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      } as any);

      return this.parseVerboseJson(response);
    } catch (error) {
      if (model === 'whisper-1' && !attempted.includes('whisper-large-v3')) {
        return this.transcribe(audioBuffer, 'whisper-large-v3', [...attempted, model]);
      }
      throw error;
    }
  }

  private parseVerboseJson(response: any): TranscriptionResult {
    const words: WordTimestamp[] = (response.words || []).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      confidence: w.probability || 0
    }));

    const segments: TranscriptionSegment[] = (response.segments || []).map((s: any, i: number) => ({
      id: i,
      text: s.text,
      start: s.start,
      end: s.end,
      words: words.filter(w => w.start >= s.start && w.end <= s.end)
    }));

    return {
      text: response.text,
      segments,
      wordTimestamps: words,
      language: response.language,
      duration: response.duration,
      confidence: this.calculateConfidence(words),
      model: response.model || 'whisper-1'
    };
  }

  private calculateConfidence(words: WordTimestamp[]): number {
    if (words.length === 0) return 0;
    const avg = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;
    return Math.round(avg * 100) / 100;
  }
}
