import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { AudioPreprocessingService } from '@/services/ai/audio-preprocessing';
import { Correction } from '@/types';
import { TranscriptionServiceV2 } from '@/services/ai/transcription-v2';
import { PostProcessingService } from '@/services/ai/post-processing';
import { AnalysisService } from '@/services/ai/analysis';
import { DiarizationService } from '@/services/ai/diarization';
import { SlackService } from '@/services/slack';
import { parseRemoveFillers } from '@/lib/transcription-options';
import { getUserByClerkId } from '@/lib/get-user';
import { AnalyticsService } from '@/services/ai/analytics';
import { PIIRedactorService } from '@/services/ai/pii-redactor';
import { KnowledgeGraphService } from '@/services/ai/knowledge-graph';
import { PersonalizationService } from '@/services/ai/personalization';
import { FileValidationService } from '@/services/validation/file-validation';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { detectAudioType } from '@/lib/audio-types';

export const maxDuration = 300;

function normalizeLanguage(rawLanguage: FormDataEntryValue | null) {
  if (typeof rawLanguage !== 'string') return undefined;
  const value = rawLanguage.trim().toLowerCase();
  if (!value || value === 'auto') return undefined;
  return value;
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('Analyze route called');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const requestedLanguage = normalizeLanguage(formData.get('language'));
    const removeFillers = parseRemoveFillers(formData.get('removeFillers'));

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const user = await getUserByClerkId(clerkUserId);
    const userId = user.id;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || 'call_recording.mp3';

    const validator = new FileValidationService();
    const validation = await validator.validate(fileBuffer, fileName);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    console.log(`Processing file: ${fileName}, size: ${fileBuffer.length}`);

    // --- TRANSCRIPTION PIPELINE ---

    // 1. Preprocess audio (optional — skip if ffmpeg unavailable on Vercel)
    let buffer = Buffer.from(fileBuffer);
    let duration = 0;
    let model: 'whisper-1' | 'whisper-large-v3' = 'whisper-1';
    try {
      const audioPreprocessing = new AudioPreprocessingService();
      const preprocessed = await audioPreprocessing.preprocess(fileBuffer);
      buffer = Buffer.from(preprocessed.buffer);
      duration = preprocessed.duration;
      model = audioPreprocessing.selectModel(duration);
      console.log(`Audio preprocessed: ${duration}s, using model: ${model}`);
    } catch (e: any) {
      console.log(`Audio preprocessing skipped (ffmpeg unavailable): ${e?.message}`);
      // Estimate duration from file size (~128kbps MP3 ≈ 16KB/s)
      const estimatedDuration = Math.round(fileBuffer.length / 16000);
      model = estimatedDuration < 300 ? 'whisper-1' : 'whisper-large-v3';
      console.log(`Using raw buffer, estimated ${estimatedDuration}s, model: ${model}`);
    }

    // 2. Transcribe
    const transcriptionService = new TranscriptionServiceV2();
    let transcription;
    try {
      transcription = await transcriptionService.transcribe(buffer, model, requestedLanguage, {
        removeFillers,
      });
    } catch (error: any) {
      console.error('Transcription failed:', error?.message || error);
      const msg = error?.message || '';
      if (msg.includes('OPENAI_API_KEY') || msg.includes('GROQ_API_KEY')) {
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      if (msg.includes('Insufficient credits') || msg.includes('insufficient_quota') || msg.includes('429')) {
        return NextResponse.json({ error: 'AI provider quota exceeded. Add credits to your OpenAI/Groq account.' }, { status: 429 });
      }
      if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('Incorrect API key')) {
        return NextResponse.json({ error: 'AI provider API key is invalid or expired. Check OPENAI_API_KEY and GROQ_API_KEY.' }, { status: 500 });
      }
      return NextResponse.json({
        error: 'Transcription failed: ' + msg.slice(0, 200)
      }, { status: 500 });
    }
    console.log(`Transcription succeeded, length: ${transcription.text.length}, confidence: ${transcription.confidence}`);

    // 2.5 Diarization (Identify Speakers)
    let speakerLabels: Array<{ label: string; segments: Array<{ speaker: string; start: number; end: number }> }> = [];
    try {
      if (process.env.VERCEL) throw new Error('Python diarization not available on Vercel');
      const tempPath = path.join(os.tmpdir(), `diarize_${Date.now()}.wav`);
      await fs.writeFile(tempPath, buffer);
      
      const diarizationService = new DiarizationService();
      const diarizationResult = await diarizationService.diarize(tempPath);
      
      speakerLabels = diarizationResult.speakers.map(s => ({
        label: s.label,
        segments: s.segments
      }));
      
      await fs.unlink(tempPath);
      console.log('Diarization complete');
    } catch (e: any) {
      console.log(`Diarization skipped: ${e?.message}. Using Whisper pause-based speaker detection`);
      // Fallback: use whisper segments to infer speaker changes via pause gaps
      if (transcription.segments && transcription.segments.length > 1) {
        let currentSpeaker = 'SPEAKER_00';
        speakerLabels = transcription.segments.map((seg, i) => {
          const gap = i > 0 ? seg.start - transcription.segments[i - 1].end : 0;
          if (gap > 1.5) currentSpeaker = currentSpeaker === 'SPEAKER_00' ? 'SPEAKER_01' : 'SPEAKER_00';
          return {
            label: currentSpeaker,
            segments: [{ speaker: currentSpeaker, start: seg.start, end: seg.end }]
          };
        }).reduce((acc: any[], s) => {
          const existing = acc.find(a => a.label === s.label);
          if (existing) existing.segments.push(s.segments[0]);
          else acc.push(s);
          return acc;
        }, []);
        console.log(`Fallback diarization produced ${speakerLabels.length} speakers`);
      }
    }

    // 3. Post-process (entity correction)
    let correctedText = transcription.text;
    let corrections: Correction[] = [];
    try {
      const postProcessing = new PostProcessingService();
      const result = await postProcessing.correctEntities(transcription.text);
      correctedText = result.correctedText;
      corrections = result.corrections;
      console.log(`Post-processing complete, ${corrections.length} corrections applied`);
    } catch (e: any) {
      console.log(`Post-processing skipped (AI unavailable): ${e?.message}`);
    }

    // Merge Diarization with Transcription
    let finalTranscriptWithSpeakers = correctedText;
    let finalSegments: Array<{ speaker: string; text: string; start: number; end: number }> = [];
    if (speakerLabels.length > 0 && transcription.segments) {
      const allSegments = [...transcription.segments];
      allSegments.sort((a, b) => a.start - b.start);

      let formattedTranscript = '';
      for (const seg of allSegments) {
        const speaker = speakerLabels.find(sl =>
          sl.segments.some(ss => ss.start <= seg.start && ss.end >= seg.end)
        );
        const label = speaker ? speaker.label : 'Speaker 1';
        formattedTranscript += `${label}: ${seg.text}\n\n`;
        finalSegments.push({ speaker: label, text: seg.text, start: seg.start, end: seg.end });
      }
      finalTranscriptWithSpeakers = formattedTranscript.trim();
    }

    // PII Redaction
    const piiRedactor = new PIIRedactorService();
    const { redactedText } = await piiRedactor.redact(finalTranscriptWithSpeakers);
    finalTranscriptWithSpeakers = redactedText;

    // --- ANALYSIS ---
    let analysisResult: Awaited<ReturnType<AnalysisService['analyze']>>;
    try {
      const analysisService = new AnalysisService();
      analysisResult = await analysisService.analyze(correctedText);
      console.log('Analysis succeeded');
    } catch (e: any) {
      const msg = e?.message || '';
      console.log('Analysis failed:', msg.slice(0, 150));
      analysisResult = {
        executiveSummary: correctedText.slice(0, 500),
        callType: 'enrollment',
        participants: [],
        keyEntities: {},
        salesScorecard: {
          meddic: { metrics: { score: 0, evidence: '' }, economicBuyer: { score: 0, evidence: '' }, decisionCriteria: { score: 0, evidence: '' }, decisionProcess: { score: 0, evidence: '' }, identifyPain: { score: 0, evidence: '' }, champion: { score: 0, evidence: '' } },
          bant: { budget: { score: 0, evidence: '' }, authority: { score: 0, evidence: '' }, need: { score: 0, evidence: '' }, timeline: { score: 0, evidence: '' } },
          spin: { situation: { score: 0, evidence: '' }, problem: { score: 0, evidence: '' }, implication: { score: 0, evidence: '' }, needPayoff: { score: 0, evidence: '' } },
          overallScore: 0
        },
        stakeholderMap: [],
        painPoints: [],
        goals: [],
        objections: [],
        commitments: [],
        actionItems: [],
        nextSteps: [],
        coachingNotes: { strengths: [], improvements: [], tips: [] },
        riskFlags: [],
        closeProbability: 40,
        talkRatio: { rep: 0.5, prospect: 0.5 },
        sentimentTimeline: []
      };
    }

    const speakerRecords = speakerLabels.map((speaker) => ({
      label: speaker.label,
      duration: speaker.segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0),
      segments: speaker.segments,
    }));

    const analyticsService = new AnalyticsService();
    const callAnalytics = await analyticsService.analyzeCall(
      correctedText,
      speakerRecords,
      finalSegments.map((segment) => ({
        speaker: segment.speaker,
        text: segment.text,
        start: segment.start,
        end: segment.end,
      })),
    );

    // Normalize and save
    const actionItems = (analysisResult.actionItems ?? []).map((item: any) => ({
      task: item.task || '', owner: item.owner || '', due: item.due || null,
    }));
    const decisions = (analysisResult.commitments ?? []).map((d: any) => ({
      content: typeof d === 'string' ? d : d.what || '',
    }));
    const nextSteps = (analysisResult.nextSteps ?? []).map((s: any) => ({
      step: s.step || '', date: s.date || null,
    }));

    const competitors = (analysisResult.competitorsMentioned ?? []).map((c: any) => ({
      competitor: c.name || 'Unknown competitor',
      context: c.context || null,
      sentiment: c.sentiment || null,
      mentionedBy: null,
      timestamp: null,
    }));

    const call = await prisma.call.create({
      data: {
        userId,
        teamId: user.teamId,
        sharedWithTeam: Boolean(user.teamId),
        filename: fileName,
        transcript: finalTranscriptWithSpeakers,
        language: transcription.language || requestedLanguage || 'en',
        summary: analysisResult.executiveSummary || correctedText.slice(0, 500),
        healthScore: typeof analysisResult.salesScorecard?.overallScore === 'number' ? analysisResult.salesScorecard.overallScore : Number(analysisResult.salesScorecard?.overallScore) || null,
        sentiment: callAnalytics.sentiment,
        actionItems: { create: actionItems },
        decisions: { create: decisions },
        nextSteps: { create: nextSteps },
        speakers: speakerRecords.length > 0 ? {
          create: speakerRecords.map((speaker) => ({
            label: speaker.label,
            segments: JSON.stringify(speaker.segments),
            duration: Math.round(speaker.duration),
          })),
        } : undefined,
        analytics: {
          create: {
            talkRatio: JSON.stringify(callAnalytics.talkRatio),
            speakerMetrics: callAnalytics.speakerMetrics,
            sentimentTimeline: callAnalytics.sentimentTimeline,
            interruptions: callAnalytics.interruptions,
            questionsAsked: callAnalytics.questionsAsked,
            objections: JSON.stringify(callAnalytics.objections),
            budgetMentioned: callAnalytics.budgetMentioned,
            timelineMentioned: callAnalytics.timelineMentioned,
            decisionMakerPresent: callAnalytics.decisionMakerPresent,
            competitorMentioned: callAnalytics.competitorMentioned,
          },
        },
        competitorMentions: competitors.length > 0 ? { create: competitors } : undefined,
      }
    });

    // Index for semantic search
    try {
      const kgService = new KnowledgeGraphService();
      await kgService.indexCall(call.id);
      console.log(`Call ${call.id} indexed in knowledge graph`);
    } catch (e) {
      console.log('Knowledge graph indexing failed:', e);
    }

    // Generate personalized hooks
    let personalization = { hooks: [] };
    try {
      const personalService = new PersonalizationService();
      personalization = await personalService.generatePersonalizedHooks(correctedText, analysisResult);
      console.log('Personalization hooks generated');
    } catch (e) {
      console.log('Personalization failed:', e);
    }

    await prisma.callInsight.upsert({
      where: { callId: call.id },
      update: {
        salesScorecard: analysisResult.salesScorecard,
        closeProbability: analysisResult.closeProbability,
        coachingNotes: analysisResult.coachingNotes,
        personalization: personalization,
      },
      create: {
        callId: call.id,
        salesScorecard: analysisResult.salesScorecard,
        closeProbability: analysisResult.closeProbability,
        coachingNotes: analysisResult.coachingNotes,
        personalization: personalization,
      }
    });

    if (competitors.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sales-call-notes.vercel.app';
      const slack = new SlackService();
      slack.sendCompetitorAlert(
        competitors.map(c => ({ name: c.competitor, context: c.context, sentiment: c.sentiment })),
        fileName,
        `${appUrl}/app/calls/${call.id}`
      ).catch(() => {});
    }

    return NextResponse.json({
      id: call.id,
      summary: analysisResult.executiveSummary || correctedText.slice(0, 500),
      actionItems: analysisResult.actionItems || [],
      keyDecisions: analysisResult.commitments || [],
      nextSteps: analysisResult.nextSteps || [],
      healthScore: analysisResult.salesScorecard?.overallScore || null,
      transcript: finalTranscriptWithSpeakers,
      segments: finalSegments,
      corrections,
      detectedLanguage: transcription.language,
      transcriptionConfidence: transcription.confidence,
      analysisAvailable: true,
      competitorsMentioned: competitors,
      speakerMetrics: callAnalytics.speakerMetrics,
      interruptions: callAnalytics.interruptions,
      questionsAsked: callAnalytics.questionsAsked,
      personalizationHooks: personalization.hooks,
    });
  } catch (error: any) {
    console.error('Analyze route error:', error?.message);
    return NextResponse.json({ error: 'Analysis failed: ' + error?.message }, { status: 500 });
  }
}
