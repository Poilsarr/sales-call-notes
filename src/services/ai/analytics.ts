export interface CallAnalytics {
  talkRatio: Record<string, number>;
  interruptions: number;
  questionsAsked: number;
  objections: string[];
  budgetMentioned: boolean;
  timelineMentioned: boolean;
  decisionMakerPresent: boolean;
  competitorMentioned: boolean;
  sentiment: "positive" | "neutral" | "negative";
  healthScore: number;
}

export class AnalyticsService {
  async analyzeCall(transcript: string, speakers: any[]): Promise<CallAnalytics> {
    const lowerTranscript = transcript.toLowerCase();

    const budgetMentioned = this.detectBudget(lowerTranscript);
    const timelineMentioned = this.detectTimeline(lowerTranscript);
    const decisionMakerPresent = this.detectDecisionMaker(lowerTranscript);
    const competitorMentioned = this.detectCompetitor(lowerTranscript);
    const objections = this.extractObjections(lowerTranscript);
    const questionsAsked = this.countQuestions(lowerTranscript);
    const sentiment = this.analyzeSentiment(lowerTranscript);

    const talkRatio = this.calculateTalkRatio(speakers);
    const interruptions = this.countInterruptions(speakers);
    const healthScore = this.calculateHealthScore({
      budgetMentioned,
      timelineMentioned,
      decisionMakerPresent,
      competitorMentioned,
      objections: objections.length,
      sentiment,
    });

    return {
      talkRatio,
      interruptions,
      questionsAsked,
      objections,
      budgetMentioned,
      timelineMentioned,
      decisionMakerPresent,
      competitorMentioned,
      sentiment,
      healthScore,
    };
  }

  private detectBudget(transcript: string): boolean {
    const budgetKeywords = [
      "budget", "price", "cost", "pricing", "afford", "expensive",
      "cheap", "investment", "spend", "dollar", "$", "money",
    ];
    return budgetKeywords.some((keyword) => transcript.includes(keyword));
  }

  private detectTimeline(transcript: string): boolean {
    const timelineKeywords = [
      "timeline", "deadline", "when", "date", "schedule", "timeframe",
      "quarter", "month", "week", "asap", "urgent", "immediately",
    ];
    return timelineKeywords.some((keyword) => transcript.includes(keyword));
  }

  private detectDecisionMaker(transcript: string): boolean {
    const decisionMakerKeywords = [
      "manager", "director", "vp", "ceo", "cto", "decision maker",
      "approve", "sign off", "budget authority", "final decision",
    ];
    return decisionMakerKeywords.some((keyword) => transcript.includes(keyword));
  }

  private detectCompetitor(transcript: string): boolean {
    const competitors = [
      "competitor", "alternative", "other option", "comparing",
      "looking at", "considering", "vendor", "provider",
    ];
    return competitors.some((keyword) => transcript.includes(keyword));
  }

  private extractObjections(transcript: string): string[] {
    const objectionPatterns = [
      /too (expensive|costly|pricey)/gi,
      /not (sure|ready|interested)/gi,
      /need (more time|to think|to discuss)/gi,
      /concerned about/gi,
      /worried about/gi,
      /hesitant/gi,
    ];

    const objections: string[] = [];
    objectionPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern);
      if (matches) {
        objections.push(...matches);
      }
    });

    return Array.from(new Set(objections));
  }

  private countQuestions(transcript: string): number {
    const questionMarks = (transcript.match(/\?/g) || []).length;
    const questionWords = [
      "what", "why", "how", "when", "where", "who", "which",
      "can", "could", "would", "should", "will", "do", "does",
    ];

    let questionWordCount = 0;
    questionWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      questionWordCount += (transcript.match(regex) || []).length;
    });

    return Math.max(questionMarks, questionWordCount);
  }

  private analyzeSentiment(transcript: string): "positive" | "neutral" | "negative" {
    const positiveWords = [
      "great", "good", "excellent", "perfect", "love", "like",
      "interested", "excited", "happy", "pleased", "agree",
      "yes", "absolutely", "definitely", "certainly",
    ];

    const negativeWords = [
      "bad", "terrible", "awful", "hate", "dislike", "not interested",
      "concerned", "worried", "hesitant", "uncertain", "maybe",
      "no", "not sure", "probably not", "unlikely",
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      positiveCount += (transcript.match(regex) || []).length;
    });

    negativeWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      negativeCount += (transcript.match(regex) || []).length;
    });

    if (positiveCount > negativeCount * 1.5) return "positive";
    if (negativeCount > positiveCount * 1.5) return "negative";
    return "neutral";
  }

  private calculateTalkRatio(speakers: any[]): Record<string, number> {
    const totalDuration = speakers.reduce((acc, speaker) => acc + speaker.duration, 0);
    const ratio: Record<string, number> = {};

    speakers.forEach((speaker) => {
      ratio[speaker.label] = speaker.duration / totalDuration;
    });

    return ratio;
  }

  private countInterruptions(speakers: any[]): number {
    let interruptions = 0;

    for (let i = 1; i < speakers.length; i++) {
      const currentSpeaker = speakers[i];
      const previousSpeaker = speakers[i - 1];

      if (currentSpeaker.label !== previousSpeaker.label) {
        const gap = currentSpeaker.segments[0]?.start - previousSpeaker.segments[previousSpeaker.segments.length - 1]?.end;
        if (gap < 0.5) {
          interruptions++;
        }
      }
    }

    return interruptions;
  }

  private calculateHealthScore(metrics: {
    budgetMentioned: boolean;
    timelineMentioned: boolean;
    decisionMakerPresent: boolean;
    competitorMentioned: boolean;
    objections: number;
    sentiment: string;
  }): number {
    let score = 0.5;

    if (metrics.budgetMentioned) score += 0.15;
    if (metrics.timelineMentioned) score += 0.1;
    if (metrics.decisionMakerPresent) score += 0.1;
    if (!metrics.competitorMentioned) score += 0.05;
    score -= metrics.objections * 0.05;

    if (metrics.sentiment === "positive") score += 0.1;
    else if (metrics.sentiment === "negative") score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }
}