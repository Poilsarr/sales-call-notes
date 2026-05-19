import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('openai', () => ({
  OpenAI: vi.fn(),
}));

describe('AnalysisService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return structured analysis from OpenAI', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            summary: 'Great sales call with qualified prospect',
            actionItems: [{ task: 'Send proposal', owner: 'Rep', due: 'Friday' }],
            keyDecisions: ['Prospect agreed to demo'],
            nextSteps: [{ step: 'Follow-up call', date: 'Next Monday' }],
            healthScore: 75,
            closeProbability: 60,
            talkRatio: { rep: 0.4, prospect: 0.6 },
            objections: [{ type: 'price', quote: 'Too expensive', timestamp: 120 }],
            coachingNotes: { strengths: ['Good discovery'], improvements: ['Ask more questions'], tips: ['Use SPIN framework'] },
            topics: [{ name: 'Budget', sentiment: 'neutral' }],
          }),
        },
      }],
    };

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockImplementation(function (this: any) {
      this.chat = { completions: { create: vi.fn().mockResolvedValue(mockResponse) } };
    });

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Transcript text here');

    expect(result.summary).toContain('Great sales call');
    expect(result.actionItems).toHaveLength(1);
    expect(result.healthScore).toBe(75);
    expect(result.closeProbability).toBe(60);
  });

  it('should fallback to Groq when OpenAI fails', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', 'groq-key');

    const mockResponse = {
      choices: [{
        message: { content: JSON.stringify({ summary: 'Groq summary', actionItems: [], keyDecisions: [], nextSteps: [], healthScore: 50, closeProbability: 40 }) },
      }],
    };

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockImplementation(function (this: any) {
      this.chat = { completions: { create: vi.fn().mockResolvedValue(mockResponse) } };
    });

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Transcript text');

    expect(result.summary).toBe('Groq summary');
  });

  it('should throw when no API keys available', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', '');

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();

    await expect(service.analyze('Transcript')).rejects.toThrow('No analysis API key available');
  });
});
