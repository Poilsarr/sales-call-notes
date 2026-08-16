import { TranscriptionResult, TranscriptionSegment, WordTimestamp } from '@/types';

const WAV_HEADER_SIZE = 44;

export interface Chunk {
  buffer: Buffer;
  startSeconds: number;
}

export interface ChunkResult {
  result: {
    text: string;
    segments: TranscriptionSegment[];
    wordTimestamps: WordTimestamp[];
    language?: string | null;
    duration?: number;
    confidence?: number;
    model?: string;
  };
  startSeconds: number;
}

export function isWavBuffer(buf: Buffer): boolean {
  return (
    buf.length > WAV_HEADER_SIZE &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WAVE'
  );
}

export function splitWavIntoChunks(
  buf: Buffer,
  maxBytes: number,
  overlapSeconds: number
): Chunk[] {
  if (!isWavBuffer(buf)) {
    throw new Error('Cannot chunk non-PCM WAV');
  }
  const audioFormat = buf.readUInt16LE(20);
  const channels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  if (
    audioFormat !== 1 ||
    channels < 1 ||
    sampleRate < 1 ||
    bitsPerSample < 1 ||
    bitsPerSample % 8 !== 0
  ) {
    throw new Error('Cannot chunk non-PCM WAV');
  }

  const bytesPerSecond = (sampleRate * channels * bitsPerSample) / 8;
  const bytesPerSample = bitsPerSample / 8;
  const dataLen = buf.length - WAV_HEADER_SIZE;
  const maxChunkData = maxBytes - WAV_HEADER_SIZE;

  if (dataLen <= maxChunkData) {
    return [{ buffer: buf, startSeconds: 0 }];
  }
  if (maxChunkData < bytesPerSample) {
    throw new Error('maxBytes too small to hold a WAV chunk');
  }

  const chunkData =
    Math.floor(maxChunkData / bytesPerSample) * bytesPerSample;
  const overlapBytes =
    Math.floor(Math.round(overlapSeconds * bytesPerSecond) / bytesPerSample) *
    bytesPerSample;
  const safeOverlap = Math.min(overlapBytes, chunkData - bytesPerSample);
  const step = chunkData - safeOverlap;

  const chunks: Chunk[] = [];
  let byteOffset = 0;
  while (byteOffset < dataLen) {
    let chunkDataLen = Math.min(chunkData, dataLen - byteOffset);
    chunkDataLen = Math.floor(chunkDataLen / bytesPerSample) * bytesPerSample;
    if (chunkDataLen <= 0) break;

    const header = Buffer.from(buf.subarray(0, WAV_HEADER_SIZE));
    header.writeUInt32LE(36 + chunkDataLen, 4);
    header.writeUInt32LE(chunkDataLen, 40);

    chunks.push({
      buffer: Buffer.concat([
        header,
        buf.subarray(
          WAV_HEADER_SIZE + byteOffset,
          WAV_HEADER_SIZE + byteOffset + chunkDataLen
        ),
      ]),
      startSeconds: byteOffset / bytesPerSecond,
    });
    byteOffset += step;
  }
  return chunks;
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tailTexts(
  segments: TranscriptionSegment[],
  overlapSeconds: number
): string[] {
  const texts: string[] = [];
  let covered = 0;
  for (let i = segments.length - 1; i >= 0; i--) {
    texts.push(normalizeText(segments[i].text));
    covered += (segments[i].end ?? 0) - (segments[i].start ?? 0);
    if (covered >= overlapSeconds) break;
  }
  return texts;
}

export function mergeChunkResults(
  results: ChunkResult[],
  overlapSeconds: number
): TranscriptionResult {
  const segments: TranscriptionSegment[] = [];
  const words: WordTimestamp[] = [];
  const seenTexts = new Set<string>();
  const seenWordKeys = new Set<string>();
  let language = '';
  let model = '';
  let confidenceSum = 0;
  let confidenceWeight = 0;

  results.forEach(({ result, startSeconds }, i) => {
    const chunkOverlapEnd = startSeconds + overlapSeconds;
    const added: TranscriptionSegment[] = [];

    result.segments.forEach((s) => {
      const absoluteStart = (s.start ?? 0) + startSeconds;
      const text = normalizeText(s.text);
      if (
        i > 0 &&
        absoluteStart < chunkOverlapEnd &&
        seenTexts.has(text)
      ) {
        return;
      }
      added.push({
        ...s,
        start: absoluteStart,
        end: (s.end ?? absoluteStart) + startSeconds,
        words: s.words
          ? s.words.map((w) => ({
              ...w,
              start: w.start + startSeconds,
              end: w.end + startSeconds,
            }))
          : undefined,
      });
    });

    for (const t of tailTexts(added, overlapSeconds)) {
      seenTexts.add(t);
    }

    added.forEach((s) => {
      segments.push({ ...s, id: segments.length });
      for (const w of s.words ?? []) {
        const key = `${w.word}:${Math.round(w.start)}`;
        if (
          i > 0 &&
          w.start < chunkOverlapEnd &&
          seenWordKeys.has(key)
        ) {
          continue;
        }
        seenWordKeys.add(key);
        words.push(w);
      }
    });

    if (result.language) language = result.language;
    if (result.model) model = result.model;
    if (result.confidence != null && added.length > 0) {
      confidenceSum += result.confidence * added.length;
      confidenceWeight += added.length;
    }
  });

  const text =
    segments.length > 0
      ? segments.map((s) => s.text).join(' ').trim()
      : results.map((r) => r.result.text).join(' ').trim();

  const duration =
    segments.length > 0
      ? segments[segments.length - 1].end ?? 0
      : results.reduce((sum, r) => sum + (r.result.duration ?? 0), 0);

  const confidence =
    confidenceWeight > 0
      ? Math.round((confidenceSum / confidenceWeight) * 100) / 100
      : 0;

  return {
    text,
    segments,
    wordTimestamps: words,
    language,
    duration,
    confidence,
    model: model || 'whisper-1',
  };
}
