import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('openai', () => {
  const MockOpenAI = vi.fn();
  return { OpenAI: MockOpenAI };
});

describe('TranscriptionService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should use OpenAI when API key is available', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const { OpenAI } = await import('openai');
    const mockCreate = vi.fn().mockResolvedValue({ text: 'Hello world transcript' });
    class MockOpenAI {
      audio = { transcriptions: { create: mockCreate } };
    }
    (OpenAI as any).mockImplementation(MockOpenAI);

    const { TranscriptionService } = await import('./transcription');
    const service = new TranscriptionService();
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
    const result = await service.transcribe(mockFile);

    expect(result.text).toBe('Hello world transcript');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-1', timestamp_granularities: ['word'] }),
      expect.anything()
    );
  });

  it('should fallback to Groq when OpenAI key missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', 'groq-key');
    const { OpenAI } = await import('openai');
    const mockCreate = vi.fn().mockResolvedValue({ text: 'Groq transcript' });
    class MockOpenAI {
      audio = { transcriptions: { create: mockCreate } };
    }
    (OpenAI as any).mockImplementation(MockOpenAI);

    const { TranscriptionService } = await import('./transcription');
    const service = new TranscriptionService();
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });
    const result = await service.transcribe(mockFile);

    expect(result.text).toBe('Groq transcript');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-large-v3' }),
      expect.anything()
    );
  });

  it('should throw when no API keys available', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', '');

    const { TranscriptionService } = await import('./transcription');
    const service = new TranscriptionService();
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mp3' });

    await expect(service.transcribe(mockFile)).rejects.toThrow('No transcription API key available');
  });
});
