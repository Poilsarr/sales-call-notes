import { describe, expect, it } from 'vitest';
import { loadPromptTemplate } from '@/lib/prompts-registry';

describe('prompt schema contract — competitorsMentioned', () => {
  it.each(['b2b-sales', 'sales-meddic'] as const)(
    '%s declares competitorsMentioned with lowercase sentiment enum',
    async (templateId) => {
      const t = await loadPromptTemplate(templateId);
      expect(t).toContain('competitorsMentioned');
      expect(t).toContain('"sentiment": "positive|negative|neutral"');
    }
  );
});
