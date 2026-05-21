import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

export interface AudioInfo {
  buffer: Buffer;
  format: string;
  duration: number;
  sampleRate: number;
  channels: number;
}

export class AudioPreprocessingService {
  async preprocess(audioBuffer: Buffer): Promise<AudioInfo> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      ffmpeg(Readable.from(audioBuffer))
        .audioFilters([
          'highpass=f=80',
          'lowpass=f=8000',
          'afftdn=nf=-20',
          'loudnorm=I=-16:TP=-1.5:LRA=11'
        ])
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('wav')
        .on('error', reject)
        .on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            format: 'wav',
            duration: 0,
            sampleRate: 16000,
            channels: 1
          });
        })
        .pipe()
        .on('data', (chunk: Buffer) => chunks.push(chunk));
    });
  }

  selectModel(duration: number): 'whisper-1' | 'whisper-large-v3' {
    return duration < 300 ? 'whisper-1' : 'whisper-large-v3';
  }
}
