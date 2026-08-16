import OpenAI, { toFile } from 'openai';
import { TranscriptionResult, TranscriptionSegment, WordTimestamp } from '@/types';
import { buildTranscriptionPrompt } from '@/lib/transcription-options';
import { createOpenAIClient } from '@/lib/openai-client';
import { getSecret } from '@/lib/secrets';
import { isWavBuffer, splitWavIntoChunks, mergeChunkResults } from './wav-split';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_CHUNK_BYTES = 20 * 1024 * 1024;
const CHUNK_OVERLAP_SECONDS = 10;

export interface TranscriptionServiceOptions {
  openaiKey?: string;
  groqKey?: string;
}

export class TranscriptionServiceV2 {
  private openai: OpenAI | null = null;
  private groqOpenai: OpenAI | null = null;
  private hasKeys: boolean;

  constructor(opts: TranscriptionServiceOptions = {}) {
    const sharedOpenai = opts.openaiKey || getSecret("OPENAI_API_KEY");
    const sharedGroq = opts.groqKey || getSecret("GROQ_API_KEY");
    this.hasKeys = Boolean(sharedOpenai || sharedGroq);
    if (!this.hasKeys) {
      console.warn("TranscriptionServiceV2: no OPENAI_API_KEY, GROQ_API_KEY, or user BYOK key set. Transcription will be unavailable.");
    }
    // Only build the OpenAI client when a real key exists — the SDK otherwise
    // ships an empty `Authorization: Bearer ` header to api.openai.com.
    this.openai = sharedOpenai ? createOpenAIClient({ apiKey: sharedOpenai }) : null;
    // Only build the Groq client when a real Groq key exists — sending an
    // OpenAI key to api.groq.com would 401 AND leak the key to a provider
    // the user never consented to. Fast-fail timeout/retries keep a hanging
    // Groq call inside the "under 60 seconds" onboarding window so the
    // escalation to whisper-1 (catch below) fires in bounded time.
    this.groqOpenai = sharedGroq
      ? createOpenAIClient({
          apiKey: sharedGroq,
          baseURL: 'https://api.groq.com/openai/v1',
          timeout: 30_000,
          maxRetries: 1,
        })
      : null;
  }

  async transcribe(
    audioBuffer: Buffer,
    // Default to Groq whisper-large-v3 (~$0.002/min vs ~$0.006 on OpenAI whisper-1).
    // Caller can still pass 'whisper-1' if they need it. Existing fallback retry
    // below remains — when this call is 'whisper-1' and OpenAI fails, we escalate.
    model: 'whisper-1' | 'whisper-large-v3' = 'whisper-large-v3',
    language?: string,
    options: { removeFillers?: boolean; filename?: string } = {},
    attempted: string[] = [],
  ): Promise<TranscriptionResult> {
    // Fail fast with actionable message instead of generic 500
    if (!this.hasKeys) {
      throw new Error("Transcription unavailable: set OPENAI_API_KEY or GROQ_API_KEY in Vercel env vars.");
    }
    // No Groq key configured → whisper-large-v3 (a Groq-only model) would
    // 401 on OpenAI; fall straight to whisper-1 instead of a doomed call.
    if (model === 'whisper-large-v3' && !this.groqOpenai) {
      model = 'whisper-1';
    }
    // No OpenAI key configured → whisper-1 is a doomed empty-bearer call.
    if (model === 'whisper-1' && !this.openai) {
      throw new Error(
        'whisper-1 transcription requires an OpenAI API key (OPENAI_API_KEY env or a user BYOK key).'
      );
    }
    // Both providers cap uploads at 25MB. WAV (PCM) can be split into chunks
    // and re-merged; any other format is a doomed call — fail fast.
    if (audioBuffer.length > MAX_AUDIO_BYTES) {
      if (isWavBuffer(audioBuffer)) {
        const chunks = splitWavIntoChunks(audioBuffer, MAX_CHUNK_BYTES, CHUNK_OVERLAP_SECONDS);
        const results: Array<{ result: TranscriptionResult; startSeconds: number }> = [];
        for (const c of chunks) {
          const r = await this.transcribe(c.buffer, model, language, options, attempted);
          results.push({ result: r, startSeconds: c.startSeconds });
        }
        return mergeChunkResults(results, CHUNK_OVERLAP_SECONDS);
      }
      throw new Error(
        'Audio file is too large for the transcription provider (max 25MB per file). Please upload a shorter recording.'
      );
    }
    const client = model === 'whisper-1' ? this.openai! : this.groqOpenai!;

    try {
      const file = await toFile(audioBuffer, options.filename ?? 'audio.wav', { type: 'audio/wav' });

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
      const err = error as any;
      const other = model === 'whisper-1' ? 'whisper-large-v3' : 'whisper-1';
      console.error(
        `Transcription failed on ${model}:`,
        err?.status,
        err?.message,
        err?.cause?.message ?? err?.cause
      );
      // Size-class errors are provider caps — retrying the other provider is
      // doomed and slow, so rethrow the original error.
      if (
        err?.status === 413 ||
        /\btoo large\b|entity too large|exceeds .* limit|payload/i.test(err?.message ?? '')
      ) {
        throw error;
      }
      // whisper-large-v3 is a Groq-only model — retrying it on the OpenAI
      // client when no Groq key exists is a doomed 401. Throw the original
      // error instead of burning a call against the wrong provider.
      if (other === 'whisper-large-v3' && !this.groqOpenai) {
        throw error;
      }
      if (!attempted.includes(other)) {
        return this.transcribe(audioBuffer, other, language, options, [...attempted, model]);
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
