import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AudioPreprocessingService } from '@/services/ai/audio-preprocessing';
import { TranscriptionServiceV2 } from '@/services/ai/transcription-v2';
import { PostProcessingService } from '@/services/ai/post-processing';
import { AnalysisService } from '@/services/ai/analysis';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    console.log('Analyze route called');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || 'call_recording.mp3';
    const mimeType = file.type || 'audio/mpeg';

    console.log(`Processing file: ${fileName}, size: ${fileBuffer.length}, type: ${mimeType}`);

    // --- TRANSCRIPTION PIPELINE ---

    // 1. Preprocess audio
    const audioPreprocessing = new AudioPreprocessingService();
    const { buffer, duration } = await audioPreprocessing.preprocess(fileBuffer);
    const model = audioPreprocessing.selectModel(duration);
    console.log(`Audio preprocessed: ${duration}s, using model: ${model}`);

    // 2. Transcribe
    const transcriptionService = new TranscriptionServiceV2();
    const transcription = await transcriptionService.transcribe(buffer, model);
    console.log(`Transcription succeeded, length: ${transcription.text.length}, confidence: ${transcription.confidence}`);

    // 3. Post-process (entity correction)
    const postProcessing = new PostProcessingService();
    const { correctedText, corrections } = await postProcessing.correctEntities(transcription.text);
    console.log(`Post-processing complete, ${corrections.length} corrections applied`);

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
        summary: correctedText.slice(0, 500),
        actionItems: [],
        keyDecisions: [],
        nextSteps: [],
        healthScore: 50,
        closeProbability: 40,
        talkRatio: { rep: 0.5, prospect: 0.5 },
        objections: [],
        coachingNotes: { strengths: [], improvements: [], tips: [] },
        topics: [],
      };
    }

    // Normalize and save
    const actionItems = (analysisResult.actionItems ?? []).map((item: any) => ({
      task: item.task || '', owner: item.owner || '', due: item.due || null,
    }));
    const decisions = (analysisResult.keyDecisions ?? []).map((d: any) => ({
      content: typeof d === 'string' ? d : d.content || '',
    }));
    const nextSteps = (analysisResult.nextSteps ?? []).map((s: any) => ({
      step: s.step || '', date: s.date || null,
    }));

    await prisma.call.create({
      data: {
        userId, filename: fileName, transcript: correctedText,
        summary: analysisResult.summary || correctedText.slice(0, 500),
        healthScore: analysisResult.healthScore || null,
        actionItems: { create: actionItems },
        decisions: { create: decisions },
        nextSteps: { create: nextSteps },
      }
    }).catch((e) => console.error('Failed to save call:', e));

    return NextResponse.json({
      summary: analysisResult.summary || correctedText.slice(0, 500),
      actionItems: analysisResult.actionItems || [],
      keyDecisions: analysisResult.keyDecisions || [],
      nextSteps: analysisResult.nextSteps || [],
      healthScore: analysisResult.healthScore || null,
      transcript: correctedText,
      corrections,
      transcriptionConfidence: transcription.confidence,
    });
  } catch (error: any) {
    console.error('Analyze route error:', error?.message);
    return NextResponse.json({ error: 'Analysis failed: ' + error?.message }, { status: 500 });
  }
}
