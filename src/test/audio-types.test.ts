import { describe, expect, it } from 'vitest';

import { detectAudioType, validateAudioType } from '@/lib/audio-types';

describe('detectAudioType', () => {
  it('detects mp3 via the ID3 tag', () => {
    const buf = Buffer.concat([Buffer.from([0x49, 0x44, 0x33]), Buffer.alloc(10)]);
    expect(detectAudioType(buf)).toEqual({ mime: 'audio/mpeg', ext: 'mp3' });
  });

  it('detects wav via the RIFF/WAVE header', () => {
    const buf = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.alloc(4),
      Buffer.from('WAVE'),
    ]);
    expect(detectAudioType(buf)).toEqual({ mime: 'audio/wav', ext: 'wav' });
  });

  it('detects webm via the EBML magic bytes', () => {
    const buf = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(16)]);
    expect(detectAudioType(buf)).toEqual({ mime: 'audio/webm', ext: 'webm' });
  });

  it('returns null for unrecognized content', () => {
    const buf = Buffer.from('plain text content that is not audio');
    expect(detectAudioType(buf)).toBeNull();
  });
});

describe('validateAudioType', () => {
  it('accepts webm as a valid audio format', () => {
    const buf = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(16)]);
    expect(validateAudioType(buf)).toEqual({ isValid: true, mime: 'audio/webm' });
  });

  it('rejects empty buffers', () => {
    expect(validateAudioType(Buffer.alloc(0))).toEqual({
      isValid: false,
      error: 'File is empty',
    });
  });
});
