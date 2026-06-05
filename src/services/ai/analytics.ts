export interface CallAnalytics {
  talkRatio: Record<string, number>;
  interruptions: number;
  questionsAsked: number;
  speakerMetrics: Array<{
    speaker: string;
    talkRatio: number;
    sentiment: "positive" | "neutral" | "negative";
    questionsAsked: number;
    interruptions: number;
    turns: number;
  }>;
  sentimentTimeline: Array<{
    speaker: string;
    timestamp: number;
    sentiment: "positive" | "neutral" | "negative";
  }>;
  objections: string[];
  budgetMentioned: boolean;
  timelineMentioned: boolean;
  decisionMakerPresent: boolean;
  competitorMentioned: boolean;
  sentiment: "positive" | "neutral" | "negative";
  healthScore: number;
}

export class AnalyticsService {
  async analyzeCall(
    transcript: string,
    speakers: any[],
    turns: Array<{ speaker: string; text: string; start: number; end: number }> = [],
  ): Promise<CallAnalytics> {
    const lowerTranscript = transcript.toLowerCase();
    const normalizedTurns = turns.length > 0 ? turns : this.parseTurnsFromTranscript(transcript);

    const budgetMentioned = this.detectBudget(lowerTranscript);
    const timelineMentioned = this.detectTimeline(lowerTranscript);
    const decisionMakerPresent = this.detectDecisionMaker(lowerTranscript);
    const competitorMentioned = this.detectCompetitor(lowerTranscript);
    const objections = this.extractObjections(lowerTranscript);
    const questionsAsked = this.countQuestions(lowerTranscript);
    const sentiment = this.analyzeSentiment(lowerTranscript);

    const talkRatio = this.calculateTalkRatio(speakers);
    const interruptions = this.countInterruptions(normalizedTurns);
    const speakerInterruptions = this.countInterruptionsBySpeaker(normalizedTurns);
    const speakerQuestions = this.countQuestionsBySpeaker(normalizedTurns);
    const sentimentTimeline = normalizedTurns.map((turn) => ({
      speaker: turn.speaker,
      timestamp: turn.start,
      sentiment: this.analyzeSentiment(turn.text.toLowerCase()),
    }));
    const speakerMetrics = Object.entries(talkRatio).map(([speaker, ratio]) => {
      const matchingTurns = normalizedTurns.filter((turn) => turn.speaker === speaker);
      const sentiments = matchingTurns.map((turn) =>
        this.analyzeSentiment(turn.text.toLowerCase()),
      );

      return {
        speaker,
        talkRatio: ratio,
        sentiment: this.mergeSentiments(sentiments),
        questionsAsked: speakerQuestions[speaker] || 0,
        interruptions: speakerInterruptions[speaker] || 0,
        turns: matchingTurns.length,
      };
    });
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
      speakerMetrics,
      sentimentTimeline,
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

  private countQuestionsBySpeaker(
    turns: Array<{ speaker: string; text: string }>,
  ): Record<string, number> {
    return turns.reduce<Record<string, number>>((acc, turn) => {
      acc[turn.speaker] = (acc[turn.speaker] || 0) + this.countQuestions(turn.text.toLowerCase());
      return acc;
    }, {});
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

  private countInterruptions(
    turns: Array<{ speaker: string; start: number; end: number }>,
  ): number {
    let interruptions = 0;

    for (let i = 1; i < turns.length; i++) {
      const currentSpeaker = turns[i];
      const previousSpeaker = turns[i - 1];

      if (currentSpeaker.speaker !== previousSpeaker.speaker) {
        const gap = currentSpeaker.start - previousSpeaker.end;
        if (gap < 0.5) {
          interruptions++;
        }
      }
    }

    return interruptions;
  }

  private countInterruptionsBySpeaker(
    turns: Array<{ speaker: string; start: number; end: number }>,
  ): Record<string, number> {
    const interruptions: Record<string, number> = {};

    for (let i = 1; i < turns.length; i++) {
      const currentSpeaker = turns[i];
      const previousSpeaker = turns[i - 1];

      if (currentSpeaker.speaker !== previousSpeaker.speaker) {
        const gap = currentSpeaker.start - previousSpeaker.end;
        if (gap < 0.5) {
          interruptions[currentSpeaker.speaker] =
            (interruptions[currentSpeaker.speaker] || 0) + 1;
        }
      }
    }

    return interruptions;
  }

  private parseTurnsFromTranscript(
    transcript: string,
  ): Array<{ speaker: string; text: string; start: number; end: number }> {
    return transcript
      .split('\n\n')
      .filter(Boolean)
      .map((block, index) => {
        const [speaker, ...content] = block.split(': ');
        const text = content.join(': ') || block;
        return {
          speaker: speaker || 'Unknown',
          text,
          start: index * 10,
          end: index * 10 + 10,
        };
      });
  }

  private mergeSentiments(
    sentiments: Array<"positive" | "neutral" | "negative">,
  ): "positive" | "neutral" | "negative" {
    const positive = sentiments.filter((value) => value === 'positive').length;
    const negative = sentiments.filter((value) => value === 'negative').length;

    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
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
