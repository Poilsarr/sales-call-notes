import { fileTypeFromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class ValidationError extends Error {
  constructor(public message: string, public code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FileValidationService {
  private static readonly ALLOWED_MIME_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/flac',
    'audio/mp4',
    'audio/aac',
  ];
  private static readonly MAX_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MIN_DURATION = 0.5; // seconds

  async validate(fileBuffer: Buffer, fileName: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // 1. Size Check
      if (fileBuffer.length === 0) {
        throw new ValidationError('File is empty', 'EMPTY_FILE');
      }
      if (fileBuffer.length > FileValidationService.MAX_SIZE) {
        throw new ValidationError(`File size exceeds ${FileValidationService.MAX_SIZE / (1024 * 1024)}MB limit`, 'FILE_TOO_LARGE');
      }

      // 2. Magic Byte Check
      const type = await fileTypeFromBuffer(fileBuffer);
      if (!type || !FileValidationService.ALLOWED_MIME_TYPES.includes(type.mime)) {
        throw new ValidationError('Invalid audio file format. Please upload a valid audio file.', 'INVALID_FORMAT');
      }

      // 3. Audio Probe (Validates stream integrity and duration)
      await this.probeAudio(fileBuffer);

      return { isValid: true };
    } catch (e: any) {
      return {
        isValid: false,
        error: e instanceof ValidationError ? e.message : 'Invalid file content',
      };
    }
  }

  private async probeAudio(buffer: Buffer): Promise<void> {
    const tempPath = path.join(os.tmpdir(), `probe_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
    await fs.writeFile(tempPath, buffer);

    try {
      const info = await new Promise<any>((resolve, reject) => {
        ffmpeg.ffprobe(tempPath, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      if (!info || !info.format) {
        throw new Error('Could not probe audio format');
      }

      const duration = parseFloat(info.format.duration);
      if (isNaN(duration) || duration < FileValidationService.MIN_DURATION) {
        throw new ValidationError(`Audio file is too short or contains no valid audio data (min ${FileValidationService.MIN_DURATION}s)`, 'FILE_TOO_SHORT');
      }
    } catch (e: any) {
      throw new ValidationError(`Audio stream is corrupt or invalid: ${e.message}`, 'CORRUPT_AUDIO');
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}
