import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const instances: any[] = [];
  const MockOpenAI = vi.fn(function (this: any, opts?: any) {
    this.opts = opts;
    this.audio = {
      transcriptions: {
        create: vi.fn(),
      },
    };
    instances.push(this);
  });
  return {
    instances,
    MockOpenAI,
    toFile: vi.fn((_buf: any, name: string, opts?: any) => ({ name, opts })),
  };
});

vi.mock('openai', () => ({
  default: mocks.MockOpenAI,
  OpenAI: mocks.MockOpenAI,
  toFile: mocks.toFile,
}));

describe('TranscriptionServiceV2', () => {
  const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
  const openaiClient = () =>
    mocks.instances.find((i) => i.opts && i.opts.baseURL !== GROQ_BASE_URL);
  const groqClient = () =>
    mocks.instances.find((i) => i.opts && i.opts.baseURL === GROQ_BASE_URL);

  beforeEach(() => {
    vi.resetModules();
    mocks.instances.length = 0;
  });

  it('throws a size error for buffers over 25MB without calling either provider', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'openai-key');
    vi.stubEnv('GROQ_API_KEY', 'groq-key');

    const { TranscriptionServiceV2 } = await import('./transcription-v2');
    const service = new TranscriptionServiceV2();
    const bigBuffer = Buffer.alloc(26 * 1024 * 1024);

    await expect(service.transcribe(bigBuffer)).rejects.toThrow(/too large/);
    expect(groqClient()?.audio.transcriptions.create).not.toHaveBeenCalled();
    expect(openaiClient()?.audio.transcriptions.create).not.toHaveBeenCalled();
  });

  it('rethrows 413 size errors instead of falling back to OpenAI', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'openai-key');
    vi.stubEnv('GROQ_API_KEY', 'groq-key');

    const { TranscriptionServiceV2 } = await import('./transcription-v2');
    const service = new TranscriptionServiceV2();
    const groqCreate = groqClient()?.audio.transcriptions.create;
    const openaiCreate = openaiClient()?.audio.transcriptions.create;
    groqCreate.mockRejectedValue(
      Object.assign(new Error('413 Request Entity Too Large'), { status: 413 })
    );

    await expect(service.transcribe(Buffer.alloc(1000))).rejects.toThrow(/too large/i);
    expect(groqCreate).toHaveBeenCalledTimes(1);
    expect(openaiCreate).not.toHaveBeenCalled();
  });

  it('falls back to whisper-1 on OpenAI when Groq fails with a generic error', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'openai-key');
    vi.stubEnv('GROQ_API_KEY', 'groq-key');

    const { TranscriptionServiceV2 } = await import('./transcription-v2');
    const service = new TranscriptionServiceV2();
    const groqCreate = groqClient()?.audio.transcriptions.create;
    const openaiCreate = openaiClient()?.audio.transcriptions.create;
    groqCreate.mockRejectedValue(new Error('boom'));
    openaiCreate.mockResolvedValue({
      text: 'fallback ok',
      segments: [],
      language: 'en',
      duration: 1,
      model: 'whisper-1',
    });

    const result = await service.transcribe(Buffer.alloc(1000));

    expect(result.text).toBe('fallback ok');
    expect(groqCreate).toHaveBeenCalledTimes(1);
    expect(openaiCreate).toHaveBeenCalledTimes(1);
    const models = [groqCreate.mock.calls[0][0], openaiCreate.mock.calls[0][0]].map(
      (args: any) => args.model
    );
    expect(models).toEqual(['whisper-large-v3', 'whisper-1']);
  });

  it('throws an actionable error when no keys are configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', '');

    const { TranscriptionServiceV2 } = await import('./transcription-v2');
    const service = new TranscriptionServiceV2();

    await expect(service.transcribe(Buffer.alloc(1000))).rejects.toThrow(
      /Transcription unavailable/
    );
    expect(mocks.instances).toHaveLength(0);
  });

  it('threads the real filename into the uploaded file', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'openai-key');
    vi.stubEnv('GROQ_API_KEY', 'groq-key');

    const { TranscriptionServiceV2 } = await import('./transcription-v2');
    const service = new TranscriptionServiceV2();
    const openaiCreate = openaiClient()?.audio.transcriptions.create;
    openaiCreate.mockResolvedValue({ text: 'ok', segments: [] });

    await service.transcribe(Buffer.alloc(1000), 'whisper-1', undefined, {
      removeFillers: true,
      filename: 'call-recording.mp3',
    });

    const fileArg = openaiCreate.mock.calls[0][0] as any;
    expect(fileArg.file.name).toContain('call-recording.mp3');
  });
});