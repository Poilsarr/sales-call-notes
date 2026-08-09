import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AnalysisService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
  });

  it('should return structured analysis from OpenAI', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            executiveSummary: 'Great sales call with qualified prospect',
            callType: 'enrollment',
            participants: [{ role: 'rep', name: 'John' }],
            keyEntities: { customer: 'Acme Corp' },
            salesScorecard: { overallScore: 75, meddic: { metrics: 7, economicBuyer: 6, decisionCriteria: 8, decisionProcess: 7, identifyPain: 8, champion: 5 }, bant: { budget: 6, authority: 7, need: 8, timeline: 5 }, spin: { situation: 7, problem: 8, implication: 6, needPayoff: 7 } },
            objections: [{ type: 'price', quote: 'Too expensive', handled: false }],
            commitments: [{ who: 'Rep', what: 'Send proposal', by: 'Friday' }],
            actionItems: [{ task: 'Send proposal', owner: 'Rep', priority: 'high', due: 'Friday' }],
            nextSteps: [{ step: 'Follow-up call', date: 'Next Monday', owner: 'Rep' }],
            coachingNotes: { strengths: ['Good discovery'], improvements: ['Ask more questions'], tips: ['Use SPIN framework'] },
            riskFlags: ['Budget not confirmed'],
            closeProbability: 60,
            talkRatio: { rep: 0.4, prospect: 0.6 },
            sentimentTimeline: [{ timestamp: 0, sentiment: 'positive' }]
          }),
        },
      }],
    });

    class MockOpenAI {
      chat = { completions: { create: mockCreate } };
    }

    vi.mock('openai', () => {
      const MockOpenAI = vi.fn();
      return { default: MockOpenAI, OpenAI: MockOpenAI };
    });

    vi.mock('fs', () => ({
      default: { readFileSync: vi.fn().mockReturnValue('# Test Prompt\nAnalyze this call.') },
      promises: { readFile: vi.fn().mockResolvedValue('# Test Prompt\nAnalyze this call.') }
    }));

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockImplementation(MockOpenAI);

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Transcript text here');

    expect(result.executiveSummary).toContain('Great sales call');
    expect(result.actionItems).toHaveLength(1);
    expect(result.salesScorecard.overallScore).toBe(75);
    expect(result.closeProbability).toBe(60);
  });

  it('should enrich analysis with segment-level sentiment and talk ratio', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            executiveSummary: 'Test call',
            callType: 'enrollment',
            participants: [],
            keyEntities: {},
            salesScorecard: { overallScore: 50 },
            objections: [],
            commitments: [],
            actionItems: [],
            nextSteps: [],
            coachingNotes: { strengths: [], improvements: [], tips: [] },
            riskFlags: [],
            closeProbability: 50,
            talkRatio: { rep: 0.5, prospect: 0.5 },
            sentimentTimeline: []
          }),
        },
      }],
    });

    class MockOpenAI {
      chat = { completions: { create: mockCreate } };
    }

    vi.mock('openai', () => {
      const MockOpenAI = vi.fn();
      return { default: MockOpenAI, OpenAI: MockOpenAI };
    });

    vi.mock('fs', () => ({
      default: { readFileSync: vi.fn().mockReturnValue('# Test Prompt\nAnalyze this call.') },
      promises: { readFile: vi.fn().mockResolvedValue('# Test Prompt\nAnalyze this call.') }
    }));

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockImplementation(MockOpenAI);

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();

    const segments = [
      { id: 0, text: 'Great to meet you', start: 0, end: 10, speaker: 'rep' },
      { id: 1, text: 'This is a problem for us', start: 10, end: 20, speaker: 'prospect' },
      { id: 2, text: 'Yes, we can help with that', start: 20, end: 30, speaker: 'rep' },
      { id: 3, text: 'That sounds expensive', start: 30, end: 40, speaker: 'prospect' },
    ];

    const result = await service.analyze('Transcript', segments as any);

    expect(result.sentimentTimeline).toHaveLength(4);
    expect(result.sentimentTimeline[0].sentiment).toBe('positive');
    expect(result.sentimentTimeline[1].sentiment).toBe('negative');
    expect(result.talkRatio.rep).toBe(0.5);
    expect(result.talkRatio.prospect).toBe(0.5);
  });

  it('should normalize missing fields with defaults', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: { content: JSON.stringify({}) },
      }],
    });

    class MockOpenAI {
      chat = { completions: { create: mockCreate } };
    }

    vi.mock('openai', () => {
      const MockOpenAI = vi.fn();
      return { default: MockOpenAI, OpenAI: MockOpenAI };
    });

    vi.mock('fs', () => ({
      default: { readFileSync: vi.fn().mockReturnValue('# Test Prompt\nAnalyze this call.') },
      promises: { readFile: vi.fn().mockResolvedValue('# Test Prompt\nAnalyze this call.') }
    }));

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockImplementation(MockOpenAI);

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Short transcript');

    expect(result.executiveSummary).toBe('No summary available');
    expect(result.actionItems).toEqual([]);
    expect(result.competitorsMentioned).toEqual([]);
    expect(result.closeProbability).toBe(50);
    expect(result.talkRatio).toEqual({ rep: 0.5, prospect: 0.5 });
    expect(result.coachingNotes).toEqual({ strengths: [], improvements: [], tips: [] });
  });

  it('should clamp closeProbability to valid range', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            executiveSummary: 'Test',
            callType: 'enrollment',
            participants: [],
            keyEntities: {},
            salesScorecard: { overallScore: 50 },
            objections: [],
            commitments: [],
            actionItems: [],
            nextSteps: [],
            coachingNotes: { strengths: [], improvements: [], tips: [] },
            riskFlags: [],
            closeProbability: 150,
            talkRatio: { rep: 0.5, prospect: 0.5 },
            sentimentTimeline: []
          }),
        },
      }],
    });

    class MockOpenAI {
      chat = { completions: { create: mockCreate } };
    }

    vi.mock('openai', () => {
      const MockOpenAI = vi.fn();
      return { default: MockOpenAI, OpenAI: MockOpenAI };
    });

    vi.mock('fs', () => ({
      default: { readFileSync: vi.fn().mockReturnValue('# Test Prompt\nAnalyze this call.') },
      promises: { readFile: vi.fn().mockResolvedValue('# Test Prompt\nAnalyze this call.') }
    }));

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockImplementation(MockOpenAI);

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Transcript');

    expect(result.closeProbability).toBe(100);
  });

  it('should preserve and lowercase competitorsMentioned through parse + normalize', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            executiveSummary: 'Evaluating competitors',
            callType: 'b2b-sales',
            competitorsMentioned: [
              { name: 'Gong', context: 'We are evaluating Gong', sentiment: 'Negative' },
              { name: 'Otter', context: 'Used for notes', sentiment: 'positive' },
            ],
          }),
        },
      }],
    });

    class MockOpenAI {
      chat = { completions: { create: mockCreate } };
    }

    vi.mock('openai', () => {
      const MockOpenAI = vi.fn();
      return { default: MockOpenAI, OpenAI: MockOpenAI };
    });

    vi.mock('fs', () => ({
      default: { readFileSync: vi.fn().mockReturnValue('# Test Prompt\nAnalyze this call.') },
      promises: { readFile: vi.fn().mockResolvedValue('# Test Prompt\nAnalyze this call.') }
    }));

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockImplementation(MockOpenAI);

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Transcript with competitor mentions');

    expect(result.competitorsMentioned).toEqual([
      { name: 'Gong', context: 'We are evaluating Gong', sentiment: 'negative' },
      { name: 'Otter', context: 'Used for notes', sentiment: 'positive' },
    ]);
  });

  it('should return empty array for non-array competitorsMentioned', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            executiveSummary: 'Test',
            callType: 'b2b-sales',
            competitorsMentioned: { name: 'Gong' },
          }),
        },
      }],
    });

    class MockOpenAI {
      chat = { completions: { create: mockCreate } };
    }

    vi.mock('openai', () => {
      const MockOpenAI = vi.fn();
      return { default: MockOpenAI, OpenAI: MockOpenAI };
    });

    vi.mock('fs', () => ({
      default: { readFileSync: vi.fn().mockReturnValue('# Test Prompt\nAnalyze this call.') },
      promises: { readFile: vi.fn().mockResolvedValue('# Test Prompt\nAnalyze this call.') }
    }));

    const { OpenAI } = await import('openai');
    (OpenAI as any).mockImplementation(MockOpenAI);

    const { AnalysisService } = await import('./analysis');
    const service = new AnalysisService();
    const result = await service.analyze('Transcript');

    expect(result.competitorsMentioned).toEqual([]);
  });
});
