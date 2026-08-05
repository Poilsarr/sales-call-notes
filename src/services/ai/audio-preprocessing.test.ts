import { describe, it, expect } from 'vitest';
import { AudioPreprocessingService } from './audio-preprocessing';

describe('AudioPreprocessingService', () => {
  it('should select whisper-large-v3 when Groq is available (any duration)', () => {
    const service = new AudioPreprocessingService();
    expect(service.selectModel(true)).toBe('whisper-large-v3');
  });

  it('should select whisper-1 when Groq is unavailable (any duration)', () => {
    const service = new AudioPreprocessingService();
    expect(service.selectModel(false)).toBe('whisper-1');
  });

  it('should throw for empty buffer', async () => {
    const service = new AudioPreprocessingService();
    await expect(service.preprocess(Buffer.alloc(0))).rejects.toThrow('Audio buffer is empty');
  });

  it('should throw for buffer exceeding 100MB', async () => {
    const service = new AudioPreprocessingService();
    const largeBuffer = Buffer.alloc(101 * 1024 * 1024);
    await expect(service.preprocess(largeBuffer)).rejects.toThrow('Audio buffer exceeds 100MB limit');
  });
});
