type MagicSig = {
  offset: number;
  bytes: number[];
  mime: string;
  ext: string;
  check?: (buf: Buffer) => boolean;
};

const MAGIC: Record<string, MagicSig[]> = {
  audio: [
    { offset: 0, bytes: [0x49, 0x44, 0x33], mime: 'audio/mpeg', ext: 'mp3' },
    { offset: 0, bytes: [0xff, 0xfb], mime: 'audio/mpeg', ext: 'mp3' },
    { offset: 0, bytes: [0xff, 0xf3], mime: 'audio/mpeg', ext: 'mp3' },
    { offset: 0, bytes: [0xff, 0xf2], mime: 'audio/mpeg', ext: 'mp3' },
    { offset: 0, bytes: [0xff], mime: 'audio/mpeg', ext: 'mp3', check: (buf: Buffer) => (buf[1] & 0xe0) === 0xe0 && buf[1] !== 0xff },
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], mime: 'audio/wav', ext: 'wav', check: (buf: Buffer) => buf.slice(8, 12).toString() === 'WAVE' },
    { offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53], mime: 'audio/ogg', ext: 'ogg' },
    { offset: 0, bytes: [0x66, 0x4c, 0x61, 0x43], mime: 'audio/flac', ext: 'flac' },
    { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70], mime: 'audio/mp4', ext: 'm4a' },
    { offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3], mime: 'audio/webm', ext: 'webm' },
  ],
};

const ALLOWED_MIME_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg',
  'audio/flac', 'audio/mp4', 'audio/aac', 'audio/webm',
];

export function detectAudioType(buffer: Buffer): { mime: string; ext: string } | null {
  for (const sig of MAGIC.audio) {
    if (buffer.length < sig.offset + sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[sig.offset + i] !== sig.bytes[i]) { match = false; break; }
    }
    if (match && (!sig.check || sig.check(buffer))) {
      return { mime: sig.mime, ext: sig.ext };
    }
  }
  return null;
}

export function validateAudioType(buffer: Buffer): { isValid: boolean; mime?: string; error?: string } {
  if (buffer.length === 0) return { isValid: false, error: 'File is empty' };
  const type = detectAudioType(buffer);
  if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
    return { isValid: false, error: 'Invalid audio format. Allowed: MP3, WAV, OGG, FLAC, M4A, AAC.' };
  }
  return { isValid: true, mime: type.mime };
}
