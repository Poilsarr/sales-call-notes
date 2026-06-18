import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/openai-client', () => ({
  createOpenAIClient: vi.fn(),
}));

vi.mock('@/lib/secrets', () => ({
  getSecret: vi.fn((key: string) => {
    if (key === 'OPENAI_API_KEY') return 'sk-test-key';
    return null;
  }),
}));

vi.mock('@/lib/live-transcription-bus', () => ({
  publishLiveTranscriptionEvent: vi.fn(),
}));

import { TranscriptionService } from '@/services/ai/transcription';
import type { Mock } from 'vitest';

function makeWord(word: string, start: number, end: number) {
  return { word, start, end };
}

function makeChunkResponse(text: string, words: ReturnType<typeof makeWord>[], duration: number, language?: string) {
  return {
    text,
    words,
    duration,
    language: language || 'en',
    task: 'transcribe' as const,
  };
}

describe('TranscriptionService.transcribeStreaming', () => {
  let service: TranscriptionService;
  let mockCreate: Mock;

  beforeEach(async () => {
    vi.resetAllMocks();
    service = new TranscriptionService();

    mockCreate = vi.fn();

    const { createOpenAIClient } = await import('@/lib/openai-client');
    (createOpenAIClient as Mock).mockReturnValue({
      audio: {
        transcriptions: {
          create: mockCreate,
        },
      },
    });
  });

  it('publishes partial transcripts for each chunk and a final event', async () => {
    mockCreate
      .mockReturnValueOnce(makeChunkResponse('hello world', [
        makeWord('hello', 0, 0.3),
        makeWord('world', 0.4, 0.8),
      ], 1.0))
      .mockReturnValueOnce(makeChunkResponse('how are you', [
        makeWord('how', 0, 0.2),
        makeWord('are', 0.3, 0.5),
        makeWord('you', 0.6, 0.9),
      ], 1.2))
      .mockReturnValueOnce(makeChunkResponse('doing well', [
        makeWord('doing', 0, 0.3),
        makeWord('well', 0.4, 0.7),
      ], 0.8))
      .mockReturnValueOnce(makeChunkResponse('thanks for asking', [
        makeWord('thanks', 0, 0.2),
        makeWord('for', 0.3, 0.4),
        makeWord('asking', 0.5, 0.8),
      ], 0.9));

    const content = new ArrayBuffer(2 * 1024 * 1024);
    const file = new File([content], 'test-audio.webm', { type: 'audio/webm' });

    const result = await service.transcribeStreaming(file, 'session-stream-1');

    const { publishLiveTranscriptionEvent } = await import('@/lib/live-transcription-bus');

    expect(publishLiveTranscriptionEvent).toHaveBeenCalledTimes(6);

    expect(publishLiveTranscriptionEvent).toHaveBeenNthCalledWith(1, 'session-stream-1', {
      type: 'connected',
      sessionId: 'session-stream-1',
      message: 'Streaming transcription started',
    });

    expect(publishLiveTranscriptionEvent).toHaveBeenNthCalledWith(2, 'session-stream-1', {
      type: 'transcript',
      sessionId: 'session-stream-1',
      text: 'hello world',
      isFinal: false,
      timestamp: expect.any(Number),
    });

    expect(publishLiveTranscriptionEvent).toHaveBeenNthCalledWith(3, 'session-stream-1', {
      type: 'transcript',
      sessionId: 'session-stream-1',
      text: 'how are you',
      isFinal: false,
      timestamp: expect.any(Number),
    });

    expect(publishLiveTranscriptionEvent).toHaveBeenNthCalledWith(6, 'session-stream-1', {
      type: 'transcript',
      sessionId: 'session-stream-1',
      text: 'hello world how are you doing well thanks for asking',
      isFinal: true,
      timestamp: expect.any(Number),
    });

    expect(result.text).toBe('hello world how are you doing well thanks for asking');
    expect(result.duration).toBeCloseTo(3.9);
    expect(result.language).toBe('en');
  });

  it('adjusts timestamps for subsequent chunks by previous duration offset', async () => {
    mockCreate
      .mockReturnValueOnce(makeChunkResponse('first chunk', [
        makeWord('first', 0, 0.3),
        makeWord('chunk', 0.4, 0.7),
      ], 1.5, 'en'))
      .mockReturnValue(makeChunkResponse('subsequent chunk', [
        makeWord('subsequent', 0, 0.2),
        makeWord('chunk', 0.3, 0.5),
      ], 0.8, 'en'));

    const content = new ArrayBuffer(2 * 1024 * 1024);
    const file = new File([content], 'test-audio.webm', { type: 'audio/webm' });

    const result = await service.transcribeStreaming(file, 'session-offset');

    expect(result.segments[0].start).toBe(0);
    expect(result.segments.length).toBeGreaterThanOrEqual(1);
    expect(result.duration).toBeGreaterThan(1.5);
  });

  it('treats files under 1MB as a single chunk', async () => {
    mockCreate.mockReturnValueOnce(makeChunkResponse('tiny audio', [
      makeWord('tiny', 0, 0.2),
      makeWord('audio', 0.3, 0.5),
    ], 0.6));

    const content = new ArrayBuffer(500 * 1024);
    const file = new File([content], 'small.webm', { type: 'audio/webm' });

    const result = await service.transcribeStreaming(file, 'session-small');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result.text).toBe('tiny audio');
    expect(result.duration).toBeCloseTo(0.6);
  });

  it('uses 8 chunks for files over 5MB', async () => {
    const chunkData = Array.from({ length: 8 }, (_, i) =>
      makeChunkResponse(`chunk ${i}`, [makeWord(`chunk`, 0, 0.1), makeWord(`${i}`, 0.2, 0.3)], 0.3)
    );
    chunkData.forEach(d => mockCreate.mockReturnValueOnce(d));

    const content = new ArrayBuffer(10 * 1024 * 1024);
    const file = new File([content], 'large.webm', { type: 'audio/webm' });

    const result = await service.transcribeStreaming(file, 'session-large');

    expect(mockCreate).toHaveBeenCalledTimes(8);
    expect(result.text).toContain('chunk 0');
    expect(result.text).toContain('chunk 7');
  });

  it('passes correct byte-range chunks to the API', async () => {
    const capturedFiles: File[] = [];
    mockCreate.mockImplementation((opts: { file: File }) => {
      capturedFiles.push(opts.file);
      return makeChunkResponse('chunk', [makeWord('chunk', 0, 0.2)], 0.3);
    });

    const content = new ArrayBuffer(2 * 1024 * 1024);
    const file = new File([content], 'test-audio.webm', { type: 'audio/webm' });

    await service.transcribeStreaming(file, 'session-chunks');

    expect(capturedFiles).toHaveLength(4);

    const totalSize = capturedFiles.reduce((sum, f) => sum + f.size, 0);
    expect(totalSize).toBe(2 * 1024 * 1024);

    capturedFiles.forEach((f) => {
      expect(f.name).toBe('test-audio.webm');
      expect(f.type).toBe('audio/webm');
    });
  });

  it('throws when no API key is configured', async () => {
    const { getSecret } = await import('@/lib/secrets');
    (getSecret as Mock).mockReturnValue(null);

    const file = new File(['test'], 'test.webm', { type: 'audio/webm' });

    await expect(service.transcribeStreaming(file, 'session-nokey')).rejects.toThrow(
      'No transcription API key available'
    );
  });

  it('returns merged segments from all chunks', async () => {
    mockCreate
      .mockReturnValueOnce(makeChunkResponse('part one', [
        makeWord('part', 0, 0.2),
        makeWord('one', 0.3, 0.5),
      ], 0.6, 'en'))
      .mockReturnValue(makeChunkResponse('part two', [
        makeWord('part', 0, 0.2),
        makeWord('two', 0.3, 0.5),
      ], 0.6, 'en'));

    const content = new ArrayBuffer(2 * 1024 * 1024);
    const file = new File([content], 'test.webm', { type: 'audio/webm' });

    const result = await service.transcribeStreaming(file, 'session-merge');

    expect(result.segments.length).toBeGreaterThan(0);
    const segmentTexts = result.segments.map(s => s.text).join(' ');
    expect(segmentTexts).toContain('part');
    expect(segmentTexts).toContain('one');
    expect(segmentTexts).toContain('two');
  });

  it('uses GROQ when only GROQ key is available', async () => {
    const { getSecret } = await import('@/lib/secrets');
    (getSecret as Mock).mockImplementation((key: string) => {
      if (key === 'GROQ_API_KEY') return 'gsk-test';
      return null;
    });

    const { createOpenAIClient } = await import('@/lib/openai-client');

    mockCreate.mockReturnValueOnce(makeChunkResponse('groq transcript', [
      makeWord('groq', 0, 0.2),
      makeWord('transcript', 0.3, 0.6),
    ], 0.7));

    const content = new ArrayBuffer(500 * 1024);
    const file = new File([content], 'test.webm', { type: 'audio/webm' });

    const result = await service.transcribeStreaming(file, 'session-groq');

    expect(createOpenAIClient).toHaveBeenCalledWith({
      apiKey: 'gsk-test',
      baseURL: 'https://api.groq.com/openai/v1',
    });
    expect(result.text).toBe('groq transcript');
  });

  it('detects language from first chunk response', async () => {
    mockCreate
      .mockReturnValueOnce(makeChunkResponse('hola mundo', [
        makeWord('hola', 0, 0.2),
        makeWord('mundo', 0.3, 0.5),
      ], 0.6, 'es'))
      .mockReturnValue(makeChunkResponse('extra chunk', [
        makeWord('extra', 0, 0.2),
        makeWord('chunk', 0.3, 0.4),
      ], 0.5, 'es'));

    const content = new ArrayBuffer(2 * 1024 * 1024);
    const file = new File([content], 'spanish.webm', { type: 'audio/webm' });

    const result = await service.transcribeStreaming(file, 'session-lang');

    expect(result.language).toBe('es');
  });

  it('computeChunkOffsets returns single chunk for files <= 1MB', () => {
    const offsets = (service as any).computeChunkOffsets(500 * 1024);
    expect(offsets).toEqual([0]);
  });

  it('computeChunkOffsets returns 4 chunks for files between 1MB and 5MB', () => {
    const offsets = (service as any).computeChunkOffsets(3 * 1024 * 1024);
    expect(offsets).toHaveLength(4);
    expect(offsets[0]).toBe(0);
    expect(offsets[1]).toBeGreaterThan(0);
  });

  it('computeChunkOffsets returns 8 chunks for files > 5MB', () => {
    const offsets = (service as any).computeChunkOffsets(10 * 1024 * 1024);
    expect(offsets).toHaveLength(8);
  });
});
