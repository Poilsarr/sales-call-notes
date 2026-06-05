import OpenAI from 'openai';
import { CallAnalysis } from '@/types';
import { wrapClient } from '@/lib/langfuse';
import { getSecret } from '@/lib/secrets';

export class PersonalizationService {
  private openai: OpenAI;

  constructor() {
    this.openai = wrapClient(new OpenAI({
      apiKey: getSecret("OPENAI_API_KEY"),
      timeout: 300000,
      maxRetries: 2
    }));
  }

  async generatePersonalizedHooks(transcript: string, analysis: CallAnalysis) {
    const prompt = `
      You are a world-class sales copywriter. Your goal is to generate "Hyper-Personalized Hooks" for a follow-up email.
      A hook is a short, punchy sentence that references a specific, emotionally charged, or highly relevant moment from the call.

      Avoid generic phrases like "It was great talking to you" or "I enjoyed our call".
      Instead, use specific "Emotional Hooks":
      - Refer to a specific pain point mentioned by the prospect.
      - Quote a specific word or phrase the prospect used.
      - Reference a personal detail or an analogy they shared.
      - Highlight a specific moment of agreement or excitement.

      Input:
      Transcript: ${transcript}
      Analysis Summary: ${analysis.executiveSummary}
      Pain Points: ${JSON.stringify(analysis.painPoints)}
      Objections: ${JSON.stringify(analysis.objections)}

      Return a JSON array of 3-5 hooks, each with:
      - "hook": The actual text to use in the email.
      - "rationale": Why this is a strong hook (e.g., "References their frustration with X").
      - "type": "pain-point" | "emotional" | "specific-quote" | "goal-aligned".
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a sales copywriting expert. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return { hooks: [] };

      const parsed = JSON.parse(content);
      return {
        hooks: Array.isArray(parsed.hooks) ? parsed.hooks : []
      };
    } catch (e) {
      console.error('Personalization generation failed:', e);
      return { hooks: [] };
    }
  }
}
