import { OpenAI } from 'openai';
import { wrapClient } from '@/lib/langfuse';

export interface TranscriptionSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
}

export class TranscriptionService {
  async transcribe(file: File): Promise<TranscriptionResult> {
    const openAIKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (openAIKey) {
      return this.transcribeWithOpenAI(file, openAIKey);
    }
    if (groqKey) {
      return this.transcribeWithGroq(file, groqKey);
    }

    throw new Error('No transcription API key available. Set OPENAI_API_KEY or GROQ_API_KEY.');
  }

  private async transcribeWithOpenAI(file: File, apiKey: string): Promise<TranscriptionResult> {
    const openai = wrapClient(new OpenAI({ apiKey }));
    return this.transcribeWithProvider(openai, file, 'whisper-1');
  }

  private async transcribeWithGroq(file: File, apiKey: string): Promise<TranscriptionResult> {
    const openai = wrapClient(new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' }));
    return this.transcribeWithProvider(openai, file, 'whisper-large-v3');
  }

  private async transcribeWithProvider(
    openai: OpenAI,
    file: File,
    model: string
  ): Promise<TranscriptionResult> {
    const response = await openai.audio.transcriptions.create({
      file,
      model,
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    const text = response.text || '';
    const words = (response as any).words || [];

    const segments: TranscriptionSegment[] = this.groupWordsIntoSegments(words);

    return {
      text,
      segments,
      language: (response as any).language || 'en',
      duration: (response as any).duration || 0,
    };
  }

  private groupWordsIntoSegments(words: any[]): TranscriptionSegment[] {
    if (!words || words.length === 0) {
      return [];
    }

    const segments: TranscriptionSegment[] = [];
    let currentSegment: TranscriptionSegment = {
      speaker: 'Speaker 1',
      text: '',
      start: words[0].start,
      end: words[0].end,
    };

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = words[i - 1];

      if (prevWord && word.start - prevWord.end > 1.5) {
        segments.push(currentSegment);
        currentSegment = {
          speaker: 'Speaker 1',
          text: '',
          start: word.start,
          end: word.end,
        };
      }

      currentSegment.text += (currentSegment.text ? ' ' : '') + word.word;
      currentSegment.end = word.end;
    }

    if (currentSegment.text) {
      segments.push(currentSegment);
    }

    return segments;
  }
}
