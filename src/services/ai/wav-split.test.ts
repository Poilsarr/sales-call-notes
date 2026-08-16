import { describe, it, expect } from 'vitest';
import { isWavBuffer, splitWavIntoChunks, mergeChunkResults, ChunkResult } from './wav-split';

const SAMPLE_RATE = 16000;
const BYTES_PER_SECOND = 32000;

function mkWav(seconds: number): Buffer {
  const dataLen = Math.floor(seconds * BYTES_PER_SECOND);
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(BYTES_PER_SECOND, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataLen, 40);
  return buf;
}

function dataSize(chunk: Buffer): number {
  return chunk.readUInt32LE(40);
}

describe('isWavBuffer', () => {
  it('returns true for a valid minimal WAV buffer', () => {
    expect(isWavBuffer(mkWav(0.01))).toBe(true);
  });

  it('returns false for garbage', () => {
    expect(isWavBuffer(Buffer.from('hello world this is not a wav file'))).toBe(false);
  });

  it('returns false for header-only buffers and missing magic bytes', () => {
    expect(isWavBuffer(Buffer.alloc(44))).toBe(false);
    const noRiff = mkWav(0.01);
    noRiff.write('XXXX', 0, 'ascii');
    expect(isWavBuffer(noRiff)).toBe(false);
    const noWave = mkWav(0.01);
    noWave.write('XXXX', 8, 'ascii');
    expect(isWavBuffer(noWave)).toBe(false);
  });
});

describe('splitWavIntoChunks', () => {
  it('returns the original buffer unchanged when data fits under maxBytes', () => {
    const buf = mkWav(1);
    const chunks = splitWavIntoChunks(buf, 200000, 2);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].buffer).toBe(buf);
    expect(chunks[0].startSeconds).toBe(0);
  });

  it('splits a 30s WAV into sample-aligned chunks with ~2s overlap', () => {
    const buf = mkWav(30);
    const dataLen = buf.length - 44;
    const maxBytes = 200000;
    const overlapSeconds = 2;
    const chunks = splitWavIntoChunks(buf, maxBytes, overlapSeconds);

    const maxChunkData = maxBytes - 44;
    const chunkData = Math.floor(maxChunkData / 2) * 2;
    const overlapBytes = Math.floor(Math.round(overlapSeconds * BYTES_PER_SECOND) / 2) * 2;
    const step = chunkData - overlapBytes;
    let expected = 0;
    for (let offset = 0; offset < dataLen; offset += step) expected++;

    expect(chunks).toHaveLength(expected);
    expect(chunks.length).toBeGreaterThan(1);

    for (const [i, chunk] of chunks.entries()) {
      expect(chunk.buffer.toString('ascii', 0, 4)).toBe('RIFF');
      expect(chunk.buffer.toString('ascii', 8, 12)).toBe('WAVE');
      expect(dataSize(chunk.buffer)).toBeLessThanOrEqual(maxBytes - 44);
      expect(dataSize(chunk.buffer) % 2).toBe(0);
      expect(chunk.buffer.length).toBe(44 + dataSize(chunk.buffer));
      if (i > 0) {
        expect(chunk.startSeconds).toBeGreaterThan(chunks[i - 1].startSeconds);
      }
    }

    expect(chunks[0].startSeconds).toBe(0);

    const last = chunks[chunks.length - 1];
    const lastEnd = last.startSeconds + dataSize(last.buffer) / BYTES_PER_SECOND;
    expect(lastEnd).toBeGreaterThanOrEqual(30 - 0.001);

    for (let i = 1; i < chunks.length; i++) {
      const prev = chunks[i - 1];
      const prevEnd = prev.startSeconds + dataSize(prev.buffer) / BYTES_PER_SECOND;
      expect(chunks[i].startSeconds).toBeLessThan(prevEnd);
      if (dataSize(prev.buffer) === chunkData) {
        expect(prevEnd - chunks[i].startSeconds).toBeGreaterThan(1.9);
        expect(prevEnd - chunks[i].startSeconds).toBeLessThan(2.1);
      }
    }
  });

  it('throws for non-PCM WAV (float format)', () => {
    const buf = mkWav(30);
    buf.writeUInt16LE(3, 20);
    expect(() => splitWavIntoChunks(buf, 200000, 2)).toThrow(/non-PCM/);
  });

  it('throws for non-WAV garbage', () => {
    expect(() => splitWavIntoChunks(Buffer.alloc(1000, 7), 200000, 2)).toThrow(/non-PCM/);
  });
});

describe('mergeChunkResults', () => {
  it('offsets segments and words, drops overlap duplicates, renumbers ids', () => {
    const results: ChunkResult[] = [
      {
        startSeconds: 0,
        result: {
          text: 'hello world',
          segments: [
            {
              id: 0,
              text: 'hello',
              start: 0,
              end: 2,
              words: [{ word: 'hello', start: 0, end: 2, confidence: 0.9 }],
            },
            {
              id: 1,
              text: 'world',
              start: 2,
              end: 4,
              words: [{ word: 'world', start: 2, end: 4, confidence: 0.9 }],
            },
          ],
          wordTimestamps: [
            { word: 'hello', start: 0, end: 2, confidence: 0.9 },
            { word: 'world', start: 2, end: 4, confidence: 0.9 },
          ],
          language: 'en',
          duration: 4,
          confidence: 0.9,
          model: 'whisper-large-v3',
        },
      },
      {
        startSeconds: 5,
        result: {
          text: 'world again',
          segments: [
            {
              id: 0,
              text: '  WORLD ',
              start: 0.1,
              end: 1.9,
              words: [{ word: 'world', start: 0.1, end: 1.9, confidence: 0.8 }],
            },
            {
              id: 1,
              text: 'again',
              start: 2,
              end: 4,
              words: [{ word: 'again', start: 2, end: 4, confidence: 0.8 }],
            },
          ],
          wordTimestamps: [
            { word: 'world', start: 0.1, end: 1.9, confidence: 0.8 },
            { word: 'again', start: 2, end: 4, confidence: 0.8 },
          ],
          language: 'en',
          duration: 4,
          confidence: 0.8,
          model: 'whisper-large-v3',
        },
      },
    ];

    const merged = mergeChunkResults(results, 2);

    expect(merged.segments.map((s) => s.text)).toEqual(['hello', 'world', 'again']);
    expect(merged.segments.map((s) => s.id)).toEqual([0, 1, 2]);
    expect(merged.segments.map((s) => s.start)).toEqual([0, 2, 7]);
    expect(merged.segments.map((s) => s.end)).toEqual([2, 4, 9]);

    const again = merged.segments[2];
    expect(again.words).toEqual([{ word: 'again', start: 7, end: 9, confidence: 0.8 }]);

    expect(merged.wordTimestamps).toEqual([
      { word: 'hello', start: 0, end: 2, confidence: 0.9 },
      { word: 'world', start: 2, end: 4, confidence: 0.9 },
      { word: 'again', start: 7, end: 9, confidence: 0.8 },
    ]);

    expect(merged.text).toBe('hello world again');
    expect(merged.language).toBe('en');
    expect(merged.duration).toBe(9);
    expect(merged.model).toBe('whisper-large-v3');
    expect(merged.confidence).toBe(0.87);
  });

  it('falls back to concatenated texts and summed durations when segments are missing', () => {
    const results: ChunkResult[] = [
      { startSeconds: 0, result: { text: 'one', segments: [], wordTimestamps: [], duration: 5 } },
      { startSeconds: 5, result: { text: 'two', segments: [], wordTimestamps: [], duration: 4 } },
    ];
    const merged = mergeChunkResults(results, 2);
    expect(merged.text).toBe('one two');
    expect(merged.duration).toBe(9);
    expect(merged.segments).toEqual([]);
    expect(merged.wordTimestamps).toEqual([]);
  });

  it('keeps segments outside the overlap window even if texts repeat', () => {
    const results: ChunkResult[] = [
      {
        startSeconds: 0,
        result: {
          text: 'yes',
          segments: [{ id: 0, text: 'yes', start: 0, end: 1, words: [] }],
          wordTimestamps: [],
          language: 'en',
          duration: 1,
          confidence: 0.9,
          model: 'm',
        },
      },
      {
        startSeconds: 10,
        result: {
          text: 'yes',
          segments: [{ id: 0, text: 'yes', start: 3, end: 4, words: [] }],
          wordTimestamps: [],
          language: 'en',
          duration: 4,
          confidence: 0.8,
          model: 'm',
        },
      },
    ];
    const merged = mergeChunkResults(results, 2);
    expect(merged.segments).toHaveLength(2);
    expect(merged.segments.map((s) => s.start)).toEqual([0, 13]);
  });
});