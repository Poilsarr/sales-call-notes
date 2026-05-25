import { describe, expect, it } from 'vitest';

import { AnalyticsService } from './analytics';

describe('AnalyticsService', () => {
  it('derives per-speaker metrics, interruptions, and a sentiment timeline', async () => {
    const service = new AnalyticsService();

    const transcript = [
      'Rep: How are you feeling about the timeline?',
      'Buyer: I am worried about the price and not interested yet.',
      'Rep: What budget did you have in mind?',
      'Buyer: Yes, this sounds good.',
    ].join('\n\n');

    const speakers = [
      {
        label: 'Rep',
        duration: 30,
        segments: [
          { start: 0, end: 10 },
          { start: 15.3, end: 20 },
        ],
      },
      {
        label: 'Buyer',
        duration: 20,
        segments: [
          { start: 10.2, end: 15 },
          { start: 20.4, end: 24 },
        ],
      },
    ];

    const turns = [
      { speaker: 'Rep', text: 'How are you feeling about the timeline?', start: 0, end: 10 },
      { speaker: 'Buyer', text: 'I am worried about the price and not interested yet.', start: 10.2, end: 15 },
      { speaker: 'Rep', text: 'What budget did you have in mind?', start: 15.3, end: 20 },
      { speaker: 'Buyer', text: 'Yes, this sounds good.', start: 20.4, end: 24 },
    ];

    const result = await service.analyzeCall(transcript, speakers, turns);

    expect(result.interruptions).toBe(3);
    expect(result.questionsAsked).toBe(2);
    expect(result.speakerMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          speaker: 'Rep',
          talkRatio: 0.6,
          questionsAsked: 2,
          interruptions: 1,
        }),
        expect.objectContaining({
          speaker: 'Buyer',
          talkRatio: 0.4,
          interruptions: 2,
          sentiment: 'neutral',
        }),
      ]),
    );
    expect(result.sentimentTimeline).toEqual([
      { speaker: 'Rep', timestamp: 0, sentiment: 'neutral' },
      { speaker: 'Buyer', timestamp: 10.2, sentiment: 'negative' },
      { speaker: 'Rep', timestamp: 15.3, sentiment: 'neutral' },
      { speaker: 'Buyer', timestamp: 20.4, sentiment: 'positive' },
    ]);
  });
});
