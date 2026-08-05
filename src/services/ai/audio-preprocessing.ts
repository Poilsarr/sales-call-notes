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
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Audio buffer is empty');
    }
    if (audioBuffer.length > 100 * 1024 * 1024) {
      throw new Error('Audio buffer exceeds 100MB limit');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let duration = 0;

      const pipeStream = ffmpeg(Readable.from(audioBuffer))
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
        .on('start', (cmdline: string) => {
          // Extract duration from ffmpeg command line if available
          const durMatch = cmdline.match(/duration[=:]([\d.]+)/);
          if (durMatch) duration = parseFloat(durMatch[1]);
        })
        .on('error', reject)
        .on('end', () => {
          const buffer = Buffer.concat(chunks);
          // Calculate duration from WAV buffer if not already set
          // WAV PCM: 44 byte header + (sampleRate * channels * bitsPerSample/8 * duration)
          if (duration === 0 && buffer.length > 44) {
            const dataSize = buffer.length - 44;
            const bytesPerSecond = 16000 * 1 * 2; // sampleRate * channels * 2 bytes/sample
            duration = dataSize / bytesPerSecond;
          }
          resolve({
            buffer,
            format: 'wav',
            duration: Math.round(duration * 100) / 100,
            sampleRate: 16000,
            channels: 1
          });
        })
        .pipe();

      pipeStream.on('error', reject);
      pipeStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    });
  }

  selectModel(groqAvailable: boolean): 'whisper-1' | 'whisper-large-v3' {
    // Groq-first: whisper-large-v3 on Groq is cheaper per minute (~$0.002)
    // than whisper-1 on OpenAI (~$0.006) AND more accurate, so any call that
    // can use Groq does. Duration no longer decides — it only mattered when
    // the OpenAI price per minute made long calls expensive.
    return groqAvailable ? 'whisper-large-v3' : 'whisper-1';
  }
}
