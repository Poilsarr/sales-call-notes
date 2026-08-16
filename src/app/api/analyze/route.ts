import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { AudioPreprocessingService } from '@/services/ai/audio-preprocessing';
import { Correction } from '@/types';
import { TranscriptionServiceV2 } from '@/services/ai/transcription-v2';
import { PostProcessingService } from '@/services/ai/post-processing';
import { AnalysisService } from '@/services/ai/analysis';
import { DiarizationService } from '@/services/ai/diarization';
import { SlackService } from "@/services/slack";
import { WebhookService } from "@/services/webhooks";
import { sendTranscriptReadyEmail } from "@/services/email";
import { parseRemoveFillers } from '@/lib/transcription-options';
import { getUserByClerkId } from '@/lib/get-user';
import { getByokKeys } from '@/lib/byok-resolver';
import { AnalyticsService } from '@/services/ai/analytics';
import { PIIRedactorService } from '@/services/ai/pii-redactor';
import { KnowledgeGraphService } from '@/services/ai/knowledge-graph';
import { buildGraphFromText } from '@/services/ai/knowledge-extract';
import { PersonalizationService } from '@/services/ai/personalization';
import { enforceCallRetention } from '@/services/call-retention';
import { FileValidationService } from '@/services/validation/file-validation';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { detectAudioType } from '@/lib/audio-types';
import { captureApiError } from '@/lib/sentry';
import { getSecret } from '@/lib/secrets';
import { isQuotaError, quotaErrorResponse, captureQuotaEvent } from '@/lib/quota-guard';
import { HubSpotService } from '@/services/crm/hubspot';
import { SalesforceService } from '@/services/crm/salesforce';
import { logAuditAction } from '@/lib/audit-logger';
import { refreshIntegrationToken } from '@/lib/integrations/token-refresh';
import { decryptConfig } from '@/lib/integrations/config-crypto';
import { isTrustedBlobUrl } from '@/lib/blob-url';
import { put as blobPut, del as blobDel } from '@vercel/blob';

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

    // Determine whether this is a blob upload (JSON) or legacy upload (FormData).
    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let fileBuffer: Buffer;
    let fileName: string;
    let requestedLanguage: string | undefined;
    let removeFillers: boolean;
    let requestedTemplate: string | null;
    let audioUrl: string | null = null;
    let isBlobUpload = false;

    if (isJson) {
      const body = await req.json();
      const blobUrl: string | undefined = body.blobUrl;
      if (!blobUrl) {
        return NextResponse.json({ error: 'No blobUrl provided' }, { status: 400 });
      }

      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not set' }, { status: 500 });
      }

      if (!isTrustedBlobUrl(blobUrl)) {
        return NextResponse.json({ error: 'Invalid blobUrl: must point to this store' }, { status: 400 });
      }

      const response = await fetch(blobUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        return NextResponse.json({ error: `Failed to fetch blob: ${response.status}` }, { status: 502 });
      }

      fileBuffer = Buffer.from(await response.arrayBuffer());
      fileName = body.filename || blobUrl.split('/').pop() || 'recording.webm';
      requestedLanguage = normalizeLanguage(body.language ?? null);
      removeFillers = typeof body.removeFillers === 'boolean' ? body.removeFillers : parseRemoveFillers(body.removeFillers ?? null);
      requestedTemplate = (body.template as string) || null;
      audioUrl = blobUrl;
      isBlobUpload = true;
    } else {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name || 'call_recording.mp3';
      requestedLanguage = normalizeLanguage(formData.get('language'));
      removeFillers = parseRemoveFillers(formData.get('removeFillers'));
      requestedTemplate = formData.get('template') as string | null;

      // Legacy upload to Vercel Blob (non-fatal if it fails)
      try {
        const blobResult = await blobPut(fileName, fileBuffer, {
          access: 'public',
          addRandomSuffix: true,
        });
        audioUrl = blobResult.url;
        console.log(`Audio uploaded to Blob: ${audioUrl}`);
      } catch (e: any) {
        console.error(`Audio upload failed (non-fatal): ${e?.message}`);
      }
    }

    const validator = new FileValidationService();
    const validation = await validator.validate(fileBuffer, fileName);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // BYOK: Pro+ users can supply their own AI keys — their call bills
    // against their key, not Gauge's shared pool. Resolved after file
    // validation (junk uploads never pay an extra DB query), once, and used
    // for every AI step below (transcription, post-processing, analysis,
    // embeddings). Falls back to shared keys when unset.
    const user = await getUserByClerkId(clerkUserId);
    const userId = user.id;
    const byok = await getByokKeys(userId);

    console.log(`Processing file: ${fileName}, size: ${fileBuffer.length}`);

    // --- TRANSCRIPTION PIPELINE ---

    // Guard: transcription requires at least one AI provider key.
    if (!getSecret("OPENAI_API_KEY") && !getSecret("GROQ_API_KEY") && !byok.openaiKey && !byok.groqKey) {
      return NextResponse.json(
        { error: "Transcription requires an AI API key. Set OPENAI_API_KEY or GROQ_API_KEY in Vercel env vars." },
        { status: 500 },
      );
    }

    // 1. Preprocess audio (optional — skip if ffmpeg unavailable on Vercel)
    let buffer = Buffer.from(fileBuffer);
    let duration = 0;
    // Groq-first: any available Groq key (shared or BYOK) → whisper-large-v3
    // (cheaper + more accurate than whisper-1 on OpenAI); otherwise whisper-1.
    const groqAvailable = Boolean(getSecret("GROQ_API_KEY") || byok.groqKey);
    let model: 'whisper-1' | 'whisper-large-v3' = groqAvailable ? 'whisper-large-v3' : 'whisper-1';
    try {
      const audioPreprocessing = new AudioPreprocessingService();
      const preprocessed = await audioPreprocessing.preprocess(fileBuffer);
      buffer = Buffer.from(preprocessed.buffer);
      duration = preprocessed.duration;
      model = audioPreprocessing.selectModel(groqAvailable);
      console.log(`Audio preprocessed: ${duration}s, using model: ${model}`);
    } catch (e: any) {
      console.log(`Audio preprocessing skipped (ffmpeg unavailable): ${e?.message}`);
      console.log(`Using raw buffer, estimated ${Math.round(fileBuffer.length / 16000)}s, model: ${model}`);
    }

    // 2. Transcribe
    const transcriptionService = new TranscriptionServiceV2(byok);
    let transcription;
    try {
      transcription = await transcriptionService.transcribe(buffer, model, requestedLanguage, {
        removeFillers,
        filename: fileName,
      });
    } catch (error: any) {
      console.error('Transcription failed:', error?.message || error);
      console.error('Transcription error cause:', error?.cause);
      console.error('Transcription error stack:', error?.stack);
      const msg = error?.message || '';
      const causeMsg = error?.cause?.message || '';
      const fullError = causeMsg ? `${msg} | Cause: ${causeMsg}` : msg;
      if (msg.includes('OPENAI_API_KEY') || msg.includes('GROQ_API_KEY')) {
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      if (isQuotaError(error)) {
        captureQuotaEvent(error, "analyze/transcribe");
        return quotaErrorResponse();
      }
      if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('Incorrect API key') || causeMsg.includes('401')) {
        return NextResponse.json({ error: 'AI provider API key is invalid or expired. Check OPENAI_API_KEY and GROQ_API_KEY — or your saved keys under Settings → API Keys → Bring your own AI keys.' }, { status: 500 });
      }
      // Normalize generic connection/network errors into actionable messages
      if (msg.toLowerCase().includes('connection') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('econnrefused') || causeMsg.toLowerCase().includes('fetch failed')) {
        console.error('Transcription network error details:', error?.message, error?.cause, error?.stack);
        return NextResponse.json({
          error: `Transcription failed: could not reach the AI provider (${fullError.slice(0, 300)}). Try again in a moment. If it persists, check that OPENAI_API_KEY and GROQ_API_KEY are set in Vercel.`
        }, { status: 500 });
      }
      return NextResponse.json({
        error: 'Transcription failed: ' + fullError.slice(0, 300)
      }, { status: 500 });
    }
    console.log(`Transcription succeeded, length: ${transcription.text.length}, confidence: ${transcription.confidence}`);

    // 2.5 Diarization (Identify Speakers)
    let speakerLabels: Array<{ label: string; segments: Array<{ speaker: string; start: number; end: number }> }> = [];
    try {
      if (getSecret("DIARIZATION_PROVIDER") !== "deepgram" || !getSecret("DEEPGRAM_API_KEY")) {
        throw new Error('Diarization not configured (set DIARIZATION_PROVIDER=deepgram and DEEPGRAM_API_KEY)');
      }
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
      const postProcessing = new PostProcessingService(byok.openaiKey);
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
      // S7: teams can teach the analyst their internal terminology — the
      // glossary rides in the system prompt so summaries use the right words.
      const vocabulary =
        user.teamId
          ? await prisma.vocabularyEntry.findMany({
              where: { teamId: user.teamId },
              orderBy: { term: 'asc' },
              take: 50,
              select: { id: true, term: true, definition: true },
            })
          : [];
      const analysisService = new AnalysisService(byok);
      analysisResult = await analysisService.analyze(
        correctedText,
        finalSegments.length > 0
          ? finalSegments.map((s) => ({
              id: 0,
              text: s.text,
              start: s.start,
              end: s.end,
              speaker: s.speaker,
            }))
          : undefined,
        requestedTemplate || undefined,
        vocabulary,
      );
      console.log('Analysis succeeded');
    } catch (e: any) {
      const msg = e?.message || '';
      console.error('Analysis failed:', msg.slice(0, 300));
      analysisResult = {
        executiveSummary: "Analysis unavailable — the AI provider returned an error. Raw transcript is shown below.",
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
      timestamp: (item as any).timestamp ?? null,
    }));
    const decisions = (analysisResult.commitments ?? []).map((d: any) => ({
      content: typeof d === 'string' ? d : d.what || '',
    }));
    const nextSteps = (analysisResult.nextSteps ?? []).map((s: any) => ({
      step: s.step || '', date: s.date || null,
    }));

    const seen = new Set<string>();
    const competitors: Array<{ competitor: string; context: string | null; sentiment: string | null; mentionedBy: null; timestamp: null }> = [];
    const addComp = (name: string, context: string | null, sentiment: string | null) => {
      const key = name.toLowerCase().trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      competitors.push({ competitor: name, context, sentiment, mentionedBy: null, timestamp: null });
    };
    (analysisResult.competitorsMentioned ?? []).forEach((c: any) => {
      const cname = typeof c === 'string' ? c : c.name;
      if (cname) addComp(cname, c.context || null, c.sentiment || null);
    });
    const keyEntities = (analysisResult as any).keyEntities;
    if (keyEntities?.competitors) {
      (keyEntities.competitors as string[]).forEach((name: string) => {
        if (name) addComp(name, null, null);
      });
    }

    const call = await prisma.call.create({
      data: {
        userId,
        teamId: user.teamId,
        sharedWithTeam: Boolean(user.teamId),
        filename: fileName,
        audioUrl: audioUrl,
        transcript: finalTranscriptWithSpeakers,
        language: transcription.language || requestedLanguage || 'en',
        summary: analysisResult.executiveSummary || correctedText.slice(0, 500),
        healthScore: Number.isFinite(analysisResult.salesScorecard?.overallScore) ? analysisResult.salesScorecard.overallScore : null,
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

    // Index for semantic search & extract knowledge entities
    try {
      const kgService = new KnowledgeGraphService();
      await kgService.indexCall(call.id, byok.openaiKey);
      console.log(`Call ${call.id} indexed in knowledge graph`);
    } catch (e) {
      console.log('Knowledge graph indexing failed:', e);
    }

    // Populate Knowledge Graph Entities & Relations from analysis keyEntities / text
    if (userId && (finalTranscriptWithSpeakers || correctedText)) {
      try {
        const textForKg = finalTranscriptWithSpeakers || correctedText;
        const graph = buildGraphFromText({ text: textForKg, callId: call.id, userId });
        if (graph.entities.length > 0) {
          for (const e of graph.entities) {
            const key = { userId_type_value: { userId, type: e.type, value: e.value } };
            await prisma.knowledgeEntity.upsert({
              where: key,
              update: { calls: { push: call.id } },
              create: { userId, type: e.type, value: e.value, calls: [call.id] },
            });
          }
        }
        if (graph.relations.length > 0) {
          for (const r of graph.relations) {
            const [fromEnt, toEnt] = await Promise.all([
              prisma.knowledgeEntity.findUnique({
                where: { userId_type_value: { userId, type: r.fromType, value: r.from } },
              }),
              prisma.knowledgeEntity.findUnique({
                where: { userId_type_value: { userId, type: r.toType, value: r.to } },
              }),
            ]);
            if (fromEnt && toEnt) {
              await prisma.knowledgeRelation.create({
                data: { userId, fromEntityId: fromEnt.id, toEntityId: toEnt.id, relation: r.relation, calls: [call.id] },
              });
            }
          }
        }
      } catch (e) {
        console.log('Knowledge graph entity extraction failed (non-fatal):', e);
      }
    }

    // Generate personalized hooks
    let personalization: { hooks: string[] } = { hooks: [] };
    try {
      const personalService = new PersonalizationService();
      personalization = await personalService.generatePersonalizedHooks(correctedText, analysisResult);
      console.log('Personalization hooks generated');
    } catch (e) {
      console.log('Personalization failed:', e);
    }

    const insightData = {
      salesScorecard: analysisResult.salesScorecard,
      closeProbability: analysisResult.closeProbability,
      coachingNotes: analysisResult.coachingNotes,
      personalization: personalization,
      sentimentScore: Number.isFinite(analysisResult.salesScorecard?.overallScore)
        ? analysisResult.salesScorecard.overallScore / 100
        : (callAnalytics.sentiment === "positive" ? 0.8 : callAnalytics.sentiment === "negative" ? 0.2 : 0.5),
      talkRatio: callAnalytics.talkRatio ?? null,
      objections: callAnalytics.objections?.map((o: string) => ({ type: o })) ?? null,
      topics: (analysisResult as any).topics ?? null,
    };

    await prisma.callInsight.upsert({
      where: { callId: call.id },
      update: insightData,
      create: {
        callId: call.id,
        ...insightData,
      }
    });

    // ponytail: fire-and-forget email, don't block response
    void sendTranscriptReadyEmail(user.email, call.id, fileName);

    if (competitors.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://usegauge.vercel.app';
      const slack = new SlackService();
      slack.sendCompetitorAlert(
        competitors.map(c => ({ name: c.competitor, context: c.context, sentiment: c.sentiment })),
        fileName,
        `${appUrl}/app/calls/${call.id}`
      ).catch(() => {});
    }

    if (user.teamId) {
      try {
        const crmIntegrations = await prisma.integration.findMany({
          where: { teamId: user.teamId, enabled: true, provider: { in: ["hubspot", "salesforce"] } },
        });
        if (crmIntegrations.length > 0) {
          const crmCall = {
            filename: fileName,
            createdAt: call.createdAt,
            transcript: finalTranscriptWithSpeakers,
            summary: analysisResult.executiveSummary || correctedText.slice(0, 500),
            analytics: callAnalytics,
            actionItems: actionItems.map(a => ({ task: a.task, owner: a.owner, due: a.due })),
            decisions: decisions.map(d => ({ content: d.content })),
            nextSteps: nextSteps.map(n => ({ step: n.step, date: n.date })),
          };
          for (const integration of crmIntegrations) {
            try {
              const provider = integration.provider as "hubspot" | "salesforce";
              let result: Record<string, string>;
              if (provider === "hubspot") {
                const service = new HubSpotService(user.teamId);
                result = await service.syncCall(crmCall);
              } else {
                // Legacy plaintext passes through; encrypted envelopes are
                // decrypted. decryptConfig never throws — on failure treat as
                // unconfigured ({}) so the sync degrades gracefully.
                const rawConfig = integration.config ? decryptConfig(integration.config) : null;
                const config = rawConfig ? JSON.parse(rawConfig) : {};
                const service = new SalesforceService(user.teamId, config.instanceUrl || null);
                result = await service.syncCall(crmCall);
              }
              await logAuditAction(user.id, "CRM_SYNC", call.id, "Call", { provider, result });
            } catch (err) {
              console.error(`CRM auto-sync failed for ${integration.provider} (non-fatal):`, err);
            }
          }
        }
      } catch (err) {
        console.error("CRM auto-sync setup failed (non-fatal):", err);
      }
    }

    // Fire webhook to subscribed endpoints (Zapier, custom).
    // Fire-and-forget; failures are logged in WebhookService, not blocking the response.
    try {
      const webhooks = new WebhookService();
      void webhooks.trigger({
        event: "call.analyzed",
        callId: call.id,
        userId: user.id,
        teamId: user.teamId,
        data: {
          summary: analysisResult.executiveSummary ?? null,
          healthScore: analysisResult.salesScorecard?.overallScore ?? null,
          actionItems: (analysisResult.actionItems ?? []).map((a: any) => ({
            task: a.task || "",
            owner: a.owner || null,
            due: a.due || null,
          })),
          competitors: competitors.map((c) => ({
            name: c.competitor,
            context: c.context,
          })),
          duration: call.duration ?? null,
          language: transcription.language || null,
          recordedAt: call.createdAt?.toISOString() ?? null,
        },
      });
    } catch (e) {
      console.warn("Webhook trigger setup failed (non-fatal):", e);
    }

    // Plan-based retention: archive oldest overflow calls for limited plans
    // (free users keep uploadLimit most-recent; pro/business = unlimited).
    let archivedCount = 0;
    try {
      const plan = (user.plan?.toLowerCase() as any) || "free";
      archivedCount = await enforceCallRetention(userId, plan);

      // Free users: delete the original audio from blob storage after processing.
      if (isBlobUpload && plan === "free" && audioUrl) {
        try {
          await blobDel(audioUrl);
          console.log(`Blob deleted for free user: ${audioUrl}`);
        } catch (e: any) {
          console.warn(`Blob cleanup failed (non-fatal): ${e?.message}`);
        }
      }
    } catch (e) {
      console.warn("Call retention enforcement failed (non-fatal):", e);
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
      archivedCount,
      // BYOK: if a stored user key failed to decrypt (corrupt row / rotated
      // master key), the call fell back to Gauge's shared pool — tell the
      // client so the billing-isolation promise stays honest.
      ...(byok.dropped && byok.dropped.length > 0
        ? {
            byokWarning:
              "One of your saved AI keys could not be decrypted and was skipped. " +
              "This call used Gauge's shared keys. Re-save your key under Settings → API Keys.",
          }
        : {}),
    });
  } catch (error: any) {
    if (isQuotaError(error)) {
      captureQuotaEvent(error, "analyze");
      return quotaErrorResponse();
    }
    captureApiError('/api/analyze', error, { method: 'POST' });
    console.error('Analyze route error:', error?.message);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
