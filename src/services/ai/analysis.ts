import OpenAI from 'openai';
import { CallAnalysis, TranscriptionSegment } from '@/types';
import { createOpenAIClient } from '@/lib/openai-client';
import { getSecret } from '@/lib/secrets';
import { loadPromptTemplate, isValidTemplate, PromptTemplateId } from '@/lib/prompts-registry';
import { normalizeScorecard } from '@/lib/scorecard';
import { buildVocabularyPrompt, VocabularyEntry } from '@/lib/team-vocabulary';
import { buildCompetitorPrompt } from '@/lib/competitor-watchlist';

// ponytail: char-cap on transcript sent to the LLM. ~4 chars/token →
// 16000 chars ≈ 4k tokens, enough headroom for 60-min calls.
// gpt-4o-mini input is $0.15/1M tokens, so this caps each LLM call
// at ~$0.0006 input. 4 sends/call × $0.0006 = $0.0024 (was $0.003-0.005).
// Add proper tiktoken-based token counting when accuracy matters.
const MAX_TRANSCRIPT_CHARS = 16000;
const cap = (s: string) => (s.length > MAX_TRANSCRIPT_CHARS ? s.slice(0, MAX_TRANSCRIPT_CHARS) : s);

export interface AnalysisServiceOptions {
  openaiKey?: string;
  groqKey?: string;
}

export class AnalysisService {
  private openai: OpenAI | null = null;
  private groqOpenai: OpenAI | null = null;

  constructor(opts: AnalysisServiceOptions = {}) {
    const openaiKey = opts.openaiKey || getSecret("OPENAI_API_KEY");
    // Only build the OpenAI client when a real key resolves — otherwise the
    // SDK ships an empty `Authorization: Bearer ` header to api.openai.com.
    if (openaiKey) {
      this.openai = createOpenAIClient({ apiKey: openaiKey });
    }
    const groqKey = opts.groqKey || getSecret("GROQ_API_KEY");
    if (groqKey) {
      this.groqOpenai = createOpenAIClient({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
  }

  async analyze(
    transcript: string,
    segments?: TranscriptionSegment[],
    templateId?: string,
    vocabulary?: VocabularyEntry[],
    competitorOptions?: { companyName?: string | null; watchlist?: string[] },
  ): Promise<CallAnalysis> {
    // ponytail: default to b2b-sales — this product is "sales-call-notes",
    // not enrollment/insurance. enrollment-calls asked for utility/insurance
    // entities (accountNumber, utilityCompany) that don't fit sales calls.
    const prompt = await this.loadPrompt(templateId || 'b2b-sales', vocabulary, competitorOptions);

    if (!this.openai) {
      // No OpenAI key configured — skip straight to the Groq path instead
      // of a doomed empty-bearer call against api.openai.com.
      return this.analyzeWithGroq(transcript, prompt, segments);
    }

    try {
      // ponytail: gpt-4o-mini for cost (~$0.001/call vs $0.01 gpt-4o).
      // JSON mode, low temperature, same schema — quality holds for our prompts.
      // Groq path remains as overflow if OpenAI rate-limits.
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: "user", content: this.buildUserMessage(transcript, segments) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
      if (response.usage) console.log('[ai] openai usage:', JSON.stringify(response.usage));
      return this.parseResponse(response, segments);
    } catch (openaiError: any) {
      console.log('OpenAI analysis failed, trying Groq:', openaiError?.message?.slice(0, 100));
      return this.analyzeWithGroq(transcript, prompt, segments, openaiError);
    }
  }

  private async analyzeWithGroq(
    transcript: string,
    prompt: string,
    segments?: TranscriptionSegment[],
    openaiError?: any,
  ): Promise<CallAnalysis> {
    if (!this.groqOpenai) {
      if (openaiError) throw openaiError;
      throw new Error(
        'Analysis unavailable: set OPENAI_API_KEY or GROQ_API_KEY in Vercel env vars (or add a key in Settings → API Keys).'
      );
    }

    const response = await this.groqOpenai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: this.buildUserMessage(transcript, segments) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    return this.parseResponse(response, segments);
  }

  private buildUserMessage(transcript: string, segments?: TranscriptionSegment[]): string {
    if (!segments || segments.length === 0) {
      return cap(transcript);
    }
    const timeline =
      '\n\n[timeline]\n' +
      segments
        .map((s) => `[${this.formatTimestamp(s.start)}] ${s.text.slice(0, 100)}`)
        .join('\n');
    return cap(transcript + timeline);
  }

  private formatTimestamp(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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

  private async loadPrompt(domain: string, vocabulary?: VocabularyEntry[], competitorOptions?: { companyName?: string | null; watchlist?: string[] }): Promise<string> {
    let template: string;
    if (isValidTemplate(domain)) {
      template = await loadPromptTemplate(domain);
    } else {
      template = await loadPromptTemplate('b2b-sales');
    }
    const vocabBlock = buildVocabularyPrompt(vocabulary || []);
    let prompt = vocabBlock ? `${template}\n\n${vocabBlock}` : template;
    const watchlist = competitorOptions?.watchlist?.filter(Boolean).slice(0, 20) ?? [];
    if (watchlist.length > 0) {
      const company = (competitorOptions?.companyName || "").trim().slice(0, 120);
      const competitorBlock = buildCompetitorPrompt(company || "your company", watchlist);
      prompt = `${prompt}\n\n${competitorBlock}`;
    }
    return prompt;
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
      callType: raw.callType || 'b2b-sales',
      participants: Array.isArray(raw.participants) ? raw.participants : [],
      keyEntities: raw.keyEntities || {},
      competitorsMentioned: Array.isArray(raw.competitorsMentioned)
        ? raw.competitorsMentioned.map((m) => ({
            ...m,
            sentiment: typeof m.sentiment === 'string' ? m.sentiment.toLowerCase() : m.sentiment,
          }))
        : [],
      salesScorecard: normalizeScorecard(raw.salesScorecard),
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
