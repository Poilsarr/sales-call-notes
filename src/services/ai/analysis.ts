import OpenAI from 'openai';
import { CallAnalysis, TranscriptionSegment } from '@/types';
import fs from 'fs';
import path from 'path';

export class AnalysisService {
  private openai: OpenAI;
  private groqOpenai: OpenAI | null = null;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (process.env.GROQ_API_KEY) {
      this.groqOpenai = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        timeout: 60000,
        maxRetries: 2
      });
    }
  }

  async analyze(transcript: string, segments?: TranscriptionSegment[]): Promise<CallAnalysis> {
    const prompt = await this.loadPrompt('enrollment-calls');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: transcript }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });
      return this.parseResponse(response, segments);
    } catch (openaiError: any) {
      console.log('OpenAI analysis failed, trying Groq:', openaiError?.message?.slice(0, 100));

      if (!this.groqOpenai) {
        throw openaiError;
      }

      const response = await this.groqOpenai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: transcript }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });
      return this.parseResponse(response, segments);
    }
  }

  private parseResponse(response: any, segments?: TranscriptionSegment[]): CallAnalysis {
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return this.normalizeAnalysis({});
    }

    let analysis: Partial<CallAnalysis>;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = {};
    }

    if (segments) {
      analysis.sentimentTimeline = this.analyzeSentiment(segments);
      analysis.talkRatio = this.calculateTalkRatio(segments);
    }

    return this.normalizeAnalysis(analysis);
  }

  private async loadPrompt(domain: string): Promise<string> {
    const promptPath = path.join(process.cwd(), 'src/lib/prompts', `${domain}.md`);
    return fs.readFileSync(promptPath, 'utf-8');
  }

  private analyzeSentiment(segments: TranscriptionSegment[]): { timestamp: number; sentiment: string }[] {
    const positiveWords = ['great', 'perfect', 'excellent', 'yes', 'agree', 'happy', 'good'];
    const negativeWords = ['no', 'expensive', 'problem', 'issue', 'difficult', 'concern'];

    return segments.map(segment => {
      const text = segment.text.toLowerCase();
      const posCount = positiveWords.filter(w => text.includes(w)).length;
      const negCount = negativeWords.filter(w => text.includes(w)).length;

      let sentiment = 'neutral';
      if (posCount > negCount) sentiment = 'positive';
      if (negCount > posCount) sentiment = 'negative';

      return { timestamp: segment.start, sentiment };
    });
  }

  private calculateTalkRatio(segments: TranscriptionSegment[]): { rep: number; prospect: number } {
    let repTime = 0;
    let prospectTime = 0;

    segments.forEach((segment, index) => {
      const duration = segment.end - segment.start;
      if (index % 2 === 0) {
        repTime += duration;
      } else {
        prospectTime += duration;
      }
    });

    const total = repTime + prospectTime;
    return {
      rep: total > 0 ? Math.round((repTime / total) * 100) / 100 : 0.5,
      prospect: total > 0 ? Math.round((prospectTime / total) * 100) / 100 : 0.5
    };
  }

  private normalizeAnalysis(raw: Partial<CallAnalysis>): CallAnalysis {
    return {
      executiveSummary: raw.executiveSummary || 'No summary available',
      callType: raw.callType || 'enrollment',
      participants: Array.isArray(raw.participants) ? raw.participants : [],
      keyEntities: raw.keyEntities || {},
      salesScorecard: raw.salesScorecard || {
        meddic: { metrics: 0, economicBuyer: 0, decisionCriteria: 0, decisionProcess: 0, identifyPain: 0, champion: 0 },
        bant: { budget: 0, authority: 0, need: 0, timeline: 0 },
        spin: { situation: 0, problem: 0, implication: 0, needPayoff: 0 },
        overallScore: 0
      },
      stakeholderMap: raw.stakeholderMap || [],
      painPoints: raw.painPoints || [],
      goals: raw.goals || [],
      objections: Array.isArray(raw.objections) ? raw.objections : [],
      roiAnalysis: raw.roiAnalysis,
      qualifications: raw.qualifications,
      commitments: Array.isArray(raw.commitments) ? raw.commitments : [],
      actionItems: Array.isArray(raw.actionItems) ? raw.actionItems : [],
      nextSteps: Array.isArray(raw.nextSteps) ? raw.nextSteps : [],
      coachingNotes: raw.coachingNotes || { strengths: [], improvements: [], tips: [] },
      riskFlags: Array.isArray(raw.riskFlags) ? raw.riskFlags : [],
      closeProbability: this.clamp(raw.closeProbability ?? 50, 0, 100),
      talkRatio: raw.talkRatio || { rep: 0.5, prospect: 0.5 },
      sentimentTimeline: Array.isArray(raw.sentimentTimeline) ? raw.sentimentTimeline : []
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
