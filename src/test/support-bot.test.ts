import { describe, expect, it } from 'vitest';
import { FALLBACK_ANSWER, SUPPORT_EMAIL, findSupportAnswer } from '@/lib/support-bot';

describe('support-bot instant matcher', () => {
  it('routes team-contact questions to the team gmail', () => {
    for (const q of [
      'How can I reach the team?',
      'how can i reach the team',
      'how do I contact you?',
      'give me your gmail for support',
    ]) {
      const hit = findSupportAnswer(q);
      expect(hit.id).toBe('contact-team');
      expect(hit.answer).toContain(SUPPORT_EMAIL);
    }
  });

  it('answers pricing / integrations / formats without delay (sync)', () => {
    expect(findSupportAnswer('What are your pricing plans?').id).toBe('pricing');
    expect(findSupportAnswer('Do you integrate with Hubspot?').id).toBe('integrations');
    expect(findSupportAnswer('Which audio formats can I upload?').id).toBe('formats');
  });

  it('handles greetings and thanks', () => {
    expect(findSupportAnswer('hello!').id).toBe('greeting');
    expect(findSupportAnswer('thanks a lot').id).toBe('thanks');
  });

  it('falls back gracefully (still pointing to support email) for unknown input', () => {
    const hit = findSupportAnswer('zxqw asdf jkl; unrelated gibberish 12345');
    expect(hit.id).toBe('fallback');
    expect(hit.answer).toBe(FALLBACK_ANSWER);
    expect(hit.answer).toContain(SUPPORT_EMAIL);
  });

  it('never returns an empty answer', () => {
    for (const q of ['', '   ', 'pricing', 'help!!!', 'HOW CAN I REACH THE TEAM???']) {
      expect(findSupportAnswer(q).answer.length).toBeGreaterThan(0);
    }
  });
});
