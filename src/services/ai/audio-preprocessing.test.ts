import { describe, it, expect } from 'vitest';
import { AudioPreprocessingService } from './audio-preprocessing';

describe('AudioPreprocessingService', () => {
  it('should select whisper-1 for short audio (< 300s)', () => {
    const service = new AudioPreprocessingService();
    expect(service.selectModel(120)).toBe('whisper-1');
    expect(service.selectModel(299)).toBe('whisper-1');
  });

  it('should select whisper-large-v3 for long audio (>= 300s)', () => {
    const service = new AudioPreprocessingService();
    expect(service.selectModel(300)).toBe('whisper-large-v3');
    expect(service.selectModel(600)).toBe('whisper-large-v3');
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
