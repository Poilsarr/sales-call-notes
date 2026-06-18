import { OpenAI } from 'openai';
import { createOpenAIClient } from '@/lib/openai-client';
import { getSecret } from '@/lib/secrets';
import { publishLiveTranscriptionEvent } from '@/lib/live-transcription-bus';

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
    const openAIKey = getSecret("OPENAI_API_KEY");
    const groqKey = getSecret("GROQ_API_KEY");

    if (openAIKey) {
      return this.transcribeWithOpenAI(file, openAIKey);
    }
    if (groqKey) {
      return this.transcribeWithGroq(file, groqKey);
    }

    throw new Error('No transcription API key available. Set OPENAI_API_KEY or GROQ_API_KEY.');
  }

  private async transcribeWithOpenAI(file: File, apiKey: string): Promise<TranscriptionResult> {
    const openai = createOpenAIClient({ apiKey });
    return this.transcribeWithProvider(openai, file, 'whisper-1');
  }

  private async transcribeWithGroq(file: File, apiKey: string): Promise<TranscriptionResult> {
    const openai = createOpenAIClient({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
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

  async transcribeStreaming(
    file: File,
    sessionId: string,
    options?: { chunkSizeMs?: number }
  ): Promise<TranscriptionResult> {
    const openAIKey = getSecret("OPENAI_API_KEY");
    const groqKey = getSecret("GROQ_API_KEY");

    let openai: OpenAI;
    let model: string;

    if (openAIKey) {
      openai = createOpenAIClient({ apiKey: openAIKey });
      model = 'whisper-1';
    } else if (groqKey) {
      openai = createOpenAIClient({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
      model = 'whisper-large-v3';
    } else {
      throw new Error('No transcription API key available. Set OPENAI_API_KEY or GROQ_API_KEY.');
    }

    publishLiveTranscriptionEvent(sessionId, {
      type: 'connected',
      sessionId,
      message: 'Streaming transcription started',
    });

    const buffer = await file.arrayBuffer();
    const fileSize = buffer.byteLength;
    const offsets = this.computeChunkOffsets(fileSize);

    const allWords: any[] = [];
    let totalDuration = 0;
    let accumulatedText = '';
    let timeOffset = 0;
    let detectedLanguage = 'en';

    for (let i = 0; i < offsets.length; i++) {
      const startByte = offsets[i];
      const endByte = i < offsets.length - 1 ? offsets[i + 1] : fileSize;
      const chunkBuffer = buffer.slice(startByte, endByte);
      const chunkFile = new File([chunkBuffer], file.name, { type: file.type });

      const response = await openai.audio.transcriptions.create({
        file: chunkFile,
        model,
        response_format: 'verbose_json',
        timestamp_granularities: ['word'],
      });

      const chunkText = response.text || '';
      const chunkWords = ((response as any).words || []).map((w: any) => ({
        ...w,
        start: (w.start || 0) + timeOffset,
        end: (w.end || 0) + timeOffset,
      }));
      const chunkDuration = (response as any).duration || 0;

      allWords.push(...chunkWords);
      accumulatedText += (accumulatedText ? ' ' : '') + chunkText;
      totalDuration += chunkDuration;

      if (i === 0 && (response as any).language) {
        detectedLanguage = (response as any).language;
      }

      publishLiveTranscriptionEvent(sessionId, {
        type: 'transcript',
        sessionId,
        text: chunkText,
        isFinal: false,
        timestamp: Date.now(),
      });

      timeOffset += chunkDuration;
    }

    const segments = this.groupWordsIntoSegments(allWords);

    const finalResult: TranscriptionResult = {
      text: accumulatedText,
      segments,
      language: detectedLanguage,
      duration: totalDuration,
    };

    publishLiveTranscriptionEvent(sessionId, {
      type: 'transcript',
      sessionId,
      text: accumulatedText,
      isFinal: true,
      timestamp: Date.now(),
    });

    return finalResult;
  }

  private computeChunkOffsets(fileSize: number): number[] {
    if (fileSize <= 1024 * 1024) {
      return [0];
    }
    const numChunks = fileSize <= 5 * 1024 * 1024 ? 4 : 8;
    const chunkSize = Math.ceil(fileSize / numChunks);
    return Array.from({ length: numChunks }, (_, i) => i * chunkSize);
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
