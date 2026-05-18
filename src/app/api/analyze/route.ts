import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TranscriptionService } from '@/services/ai/transcription';
import { AnalysisService } from '@/services/ai/analysis';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // Stage 1: Transcription
    const transcriptionService = new TranscriptionService();
    const transcriptionResult = await transcriptionService.transcribe(file);

    // Stage 2: AI Analysis
    const analysisService = new AnalysisService();
    const analysisResult = await analysisService.analyze(transcriptionResult.text);

    // Stage 3: Store in database
    const call = await prisma.call.create({
      data: {
        userId,
        filename: file.name || 'call_recording.mp3',
        transcript: transcriptionResult.text,
        duration: Math.round(transcriptionResult.duration),
        language: transcriptionResult.language,
        summary: analysisResult.summary,
        healthScore: analysisResult.healthScore / 100,
        sentiment: analysisResult.topics.length > 0
          ? analysisResult.topics[0].sentiment
          : 'neutral',
        actionItems: {
          create: analysisResult.actionItems.map(item => ({
            task: item.task,
            owner: item.owner,
            due: item.due || null,
          })),
        },
        decisions: {
          create: analysisResult.keyDecisions.map(d => ({ content: d })),
        },
        nextSteps: {
          create: analysisResult.nextSteps.map(s => ({
            step: s.step,
            date: s.date || null,
          })),
        },
      },
      include: {
        actionItems: true,
        decisions: true,
        nextSteps: true,
      },
    });

    return NextResponse.json({
      callId: call.id,
      summary: analysisResult.summary,
      actionItems: analysisResult.actionItems,
      keyDecisions: analysisResult.keyDecisions,
      nextSteps: analysisResult.nextSteps,
      healthScore: analysisResult.healthScore,
      closeProbability: analysisResult.closeProbability,
      talkRatio: analysisResult.talkRatio,
      objections: analysisResult.objections,
      coachingNotes: analysisResult.coachingNotes,
      topics: analysisResult.topics,
      transcript: transcriptionResult.text,
      duration: transcriptionResult.duration,
      language: transcriptionResult.language,
    });
  } catch (error: any) {
    console.error('Analyze route error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
