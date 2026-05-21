import { OpenAI } from 'openai';
import { SALES_ANALYSIS_PROMPT } from '@/lib/prompts';

export interface AnalysisResult {
  summary: string;
  actionItems: Array<{ task: string; owner: string; due: string }>;
  keyDecisions: string[];
  nextSteps: Array<{ step: string; date: string }>;
  healthScore: number;
  closeProbability: number;
  talkRatio: { rep: number; prospect: number };
  objections: Array<{ type: string; quote: string; timestamp: number }>;
  coachingNotes: { strengths: string[]; improvements: string[]; tips: string[] };
  topics: Array<{ name: string; sentiment: string }>;
  analysisAvailable?: boolean;
}

export class AnalysisService {
  async analyze(transcript: string): Promise<AnalysisResult> {
    const openAIKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (openAIKey) {
      return this.analyzeWithOpenAI(transcript, openAIKey);
    }
    if (groqKey) {
      return this.analyzeWithGroq(transcript, groqKey);
    }

    throw new Error('No analysis API key available. Set OPENAI_API_KEY or GROQ_API_KEY.');
  }

  private async analyzeWithOpenAI(transcript: string, apiKey: string): Promise<AnalysisResult> {
    const openai = new OpenAI({ apiKey });
    return this.analyzeWithProvider(openai, transcript, 'gpt-4o');
  }

  private async analyzeWithGroq(transcript: string, apiKey: string): Promise<AnalysisResult> {
    const openai = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' });
    return this.analyzeWithProvider(openai, transcript, 'llama-3.3-70b-versatile');
  }

  private async analyzeWithProvider(
    openai: OpenAI,
    transcript: string,
    model: string
  ): Promise<AnalysisResult> {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SALES_ANALYSIS_PROMPT },
        { role: 'user', content: transcript },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices?.[0]?.message?.content || '';
    return this.parseAndValidate(raw);
  }

  private parseAndValidate(raw: string): AnalysisResult {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from analysis response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      summary: parsed.summary || 'No summary available',
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      healthScore: this.clamp(parsed.healthScore ?? 50, 0, 100),
      closeProbability: this.clamp(parsed.closeProbability ?? 40, 0, 100),
      talkRatio: parsed.talkRatio || { rep: 0.5, prospect: 0.5 },
      objections: Array.isArray(parsed.objections) ? parsed.objections : [],
      coachingNotes: parsed.coachingNotes || { strengths: [], improvements: [], tips: [] },
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
