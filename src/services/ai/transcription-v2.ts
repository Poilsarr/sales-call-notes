import OpenAI, { toFile } from 'openai';
import { TranscriptionResult, TranscriptionSegment, WordTimestamp } from '@/types';
import { buildTranscriptionPrompt } from '@/lib/transcription-options';
import { wrapClient } from '@/lib/langfuse';
import { getSecret } from '@/lib/secrets';

export class TranscriptionServiceV2 {
  private openai: OpenAI;
  private groqOpenai: OpenAI;

  constructor() {
    if (!getSecret("OPENAI_API_KEY")) {
      throw new Error('OPENAI_API_KEY is required for transcription');
    }
    if (!getSecret("GROQ_API_KEY")) {
      throw new Error('GROQ_API_KEY is required for transcription fallback');
    }
    this.openai = wrapClient(new OpenAI({
      apiKey: getSecret("OPENAI_API_KEY"),
      timeout: 300000,
      maxRetries: 2
    }));
    this.groqOpenai = wrapClient(new OpenAI({
      apiKey: getSecret("GROQ_API_KEY"),
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: 300000,
      maxRetries: 2
    }));
  }

  async transcribe(
    audioBuffer: Buffer,
    model: 'whisper-1' | 'whisper-large-v3' = 'whisper-1',
    language?: string,
    options: { removeFillers?: boolean } = {},
    attempted: string[] = [],
  ): Promise<TranscriptionResult> {
    const client = model === 'whisper-1' ? this.openai : this.groqOpenai;

    try {
      const file = await toFile(audioBuffer, 'audio.wav', { type: 'audio/wav' });

      const response = await client.audio.transcriptions.create({
        file,
        model,
        ...(language ? { language } : {}),
        prompt: buildTranscriptionPrompt(options.removeFillers ?? true),
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      } as any);

      return this.parseVerboseJson(response);
    } catch (error) {
      if (model === 'whisper-1' && !attempted.includes('whisper-large-v3')) {
        return this.transcribe(audioBuffer, 'whisper-large-v3', language, options, [...attempted, model]);
      }
      throw error;
    }
  }

  private parseVerboseJson(response: any): TranscriptionResult {
    const segments: TranscriptionSegment[] = (response.segments || []).map((s: any, i: number) => ({
      id: i,
      text: s.text,
      start: s.start,
      end: s.end,
      words: (s.words || []).map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.probability ?? w.confidence ?? 0.95
      }))
    }));

    const words: WordTimestamp[] = segments.flatMap(s => s.words ?? []);

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
