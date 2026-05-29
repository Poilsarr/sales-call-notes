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

    if (fileBuffer.length > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 100MB limit' }, { status: 400 });
    }
    if (!mimeType.startsWith('audio/')) {
      return NextResponse.json({ error: 'Only audio files are supported' }, { status: 400 });
    }

    console.log(`Processing file: ${fileName}, size: ${fileBuffer.length}, type: ${mimeType}`);

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
      transcription = await transcriptionService.transcribe(buffer, model);
    } catch (error) {
      console.error('Transcription failed:', error);
      return NextResponse.json({
        error: 'Transcription failed. All AI providers unavailable. Please add credits to your OpenAI account or ensure GROQ_API_KEY is set.'
      }, { status: 500 });
    }
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
        executiveSummary: correctedText.slice(0, 500),
        callType: 'enrollment',
        participants: [],
        keyEntities: {},
        salesScorecard: {
          meddic: { metrics: 0, economicBuyer: 0, decisionCriteria: 0, decisionProcess: 0, identifyPain: 0, champion: 0 },
          bant: { budget: 0, authority: 0, need: 0, timeline: 0 },
          spin: { situation: 0, problem: 0, implication: 0, needPayoff: 0 },
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

    await prisma.call.create({
      data: {
        userId, filename: fileName, transcript: correctedText,
        summary: analysisResult.executiveSummary || correctedText.slice(0, 500),
        healthScore: analysisResult.salesScorecard?.overallScore || null,
        actionItems: { create: actionItems },
        decisions: { create: decisions },
        nextSteps: { create: nextSteps },
      }
    });

    return NextResponse.json({
      summary: analysisResult.executiveSummary || correctedText.slice(0, 500),
      actionItems: analysisResult.actionItems || [],
      keyDecisions: analysisResult.commitments || [],
      nextSteps: analysisResult.nextSteps || [],
      healthScore: analysisResult.salesScorecard?.overallScore || null,
      transcript: correctedText,
      corrections,
      transcriptionConfidence: transcription.confidence,
      analysisAvailable: true,
    });
  } catch (error: any) {
    console.error('Analyze route error:', error?.message);
    return NextResponse.json({ error: 'Analysis failed: ' + error?.message }, { status: 500 });
  }
}
