import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('openai', () => {
  return {
    OpenAI: class MockOpenAI {
      constructor() {}
    },
    default: class MockOpenAI {
      constructor() {}
    },
  };
});

describe('PostProcessingService', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
  });

  it('should extract phone numbers correctly', async () => {
    const { PostProcessingService } = await import('./post-processing');
    const service = new PostProcessingService();
    const result = service.validateEntities('Call me at 555-123-4567 or (555) 987-6543');
    expect(result.phones).toContain('555-123-4567');
    expect(result.phones).toContain('(555) 987-6543');
  });

  it('should extract emails correctly', async () => {
    const { PostProcessingService } = await import('./post-processing');
    const service = new PostProcessingService();
    const result = service.validateEntities('Email john@example.com or jane.doe@company.org');
    expect(result.emails).toContain('john@example.com');
    expect(result.emails).toContain('jane.doe@company.org');
  });

  it('should return original transcript for empty input', async () => {
    const { PostProcessingService } = await import('./post-processing');
    const service = new PostProcessingService();
    const result = await service.correctEntities('');
    expect(result.correctedText).toBe('');
    expect(result.corrections).toEqual([]);
    expect(result.confidence).toBe(1);
  });

  it('should return zip codes from text', async () => {
    const { PostProcessingService } = await import('./post-processing');
    const service = new PostProcessingService();
    const result = service.validateEntities('Ship to 10001 or 90210');
    expect(result.zipCodes).toContain('10001');
    expect(result.zipCodes).toContain('90210');
  });
});
