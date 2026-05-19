import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function transcribeGroq(apiKey: string, fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const CRLF = '\r\n';
  const parts = [
    `--${boundary}${CRLF}`,
    `Content-Disposition: form-data; name="model"${CRLF}${CRLF}`,
    `whisper-large-v3${CRLF}`,
    `--${boundary}${CRLF}`,
    `Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`,
    `Content-Type: ${mimeType}${CRLF}${CRLF}`,
  ].join('');

  const prefix = Buffer.from(parts, 'utf-8');
  const suffix = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf-8');
  const formData = Buffer.concat([prefix, fileBuffer, suffix]);

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq transcription failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.text;
}

async function transcribeOpenAI(apiKey: string, fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const CRLF = '\r\n';
  const parts = [
    `--${boundary}${CRLF}`,
    `Content-Disposition: form-data; name="model"${CRLF}${CRLF}`,
    `whisper-1${CRLF}`,
    `--${boundary}${CRLF}`,
    `Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`,
    `Content-Type: ${mimeType}${CRLF}${CRLF}`,
  ].join('');

  const prefix = Buffer.from(parts, 'utf-8');
  const suffix = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf-8');
  const formData = Buffer.concat([prefix, fileBuffer, suffix]);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI transcription failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.text;
}

async function analyzeWithGroq(apiKey: string, transcript: string): Promise<any> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a JSON-only API. Your response must be ONLY valid JSON with no other text, no markdown, no code fences.' },
        { role: 'user', content: `Analyze this sales transcript. Respond with ONLY this JSON structure (no other text): {"summary":"...","actionItems":[{"task":"...","owner":"...","due":"..."}],"keyDecisions":["..."],"nextSteps":[{"step":"...","date":"..."}],"healthScore":0.85}\n\nTranscript: ${transcript}` },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq analysis failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();
  return JSON.parse(cleaned);
}

async function analyzeWithOpenAI(apiKey: string, transcript: string): Promise<any> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a JSON-only API. Your response must be ONLY valid JSON with no other text, no markdown, no code fences.' },
        { role: 'user', content: `Analyze this sales transcript. Respond with ONLY this JSON structure (no other text): {"summary":"...","actionItems":[{"task":"...","owner":"...","due":"..."}],"keyDecisions":["..."],"nextSteps":[{"step":"...","date":"..."}],"healthScore":0.85}\n\nTranscript: ${transcript}` },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI analysis failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();
  return JSON.parse(cleaned);
}

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

    // --- TRANSCRIPTION ---
    let transcript = '';
    const openAIKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // Try Groq first (OpenAI quota exhausted), then OpenAI
    const transcribeAttempts = [
      { name: 'Groq', key: groqKey, fn: transcribeGroq },
      { name: 'OpenAI', key: openAIKey, fn: transcribeOpenAI },
    ];

    let transcribed = false;
    for (const a of transcribeAttempts) {
      if (!a.key) continue;
      try {
        console.log(`Trying ${a.name} transcription...`);
        transcript = await a.fn(a.key, fileBuffer, fileName, mimeType);
        transcribed = true;
        console.log(`${a.name} transcription succeeded, length: ${transcript.length}`);
        break;
      } catch (e: any) {
        const msg = e?.message || '';
        console.log(`${a.name} transcription failed:`, msg.slice(0, 150));
      }
    }

    if (!transcribed) {
      return NextResponse.json({ 
        error: 'Transcription failed. All AI providers unavailable. Please add credits to your OpenAI account or ensure GROQ_API_KEY is set.' 
      }, { status: 500 });
    }

    // --- ANALYSIS ---
    let analysisResult: any;
    const analyzeAttempts = [
      { name: 'Groq', key: groqKey, fn: analyzeWithGroq },
      { name: 'OpenAI', key: openAIKey, fn: analyzeWithOpenAI },
    ];

    let analyzed = false;
    for (const a of analyzeAttempts) {
      if (!a.key) continue;
      try {
        console.log(`Trying ${a.name} analysis...`);
        analysisResult = await a.fn(a.key, transcript);
        analyzed = true;
        console.log(`${a.name} analysis succeeded`);
        break;
      } catch (e: any) {
        const msg = e?.message || '';
        console.log(`${a.name} analysis failed:`, msg.slice(0, 150));
      }
    }

    if (!analyzed) {
      console.log('All AI analysis failed, using raw transcript as summary');
      analysisResult = {
        summary: transcript.slice(0, 500),
        actionItems: [],
        keyDecisions: [],
        nextSteps: [],
        healthScore: null,
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
        userId, filename: fileName, transcript,
        summary: analysisResult.summary || transcript.slice(0, 500),
        healthScore: analysisResult.healthScore || null,
        actionItems: { create: actionItems },
        decisions: { create: decisions },
        nextSteps: { create: nextSteps },
      }
    }).catch((e) => console.error('Failed to save call:', e));

    return NextResponse.json({
      summary: analysisResult.summary || transcript.slice(0, 500),
      actionItems: analysisResult.actionItems || [],
      keyDecisions: analysisResult.keyDecisions || [],
      nextSteps: analysisResult.nextSteps || [],
      healthScore: analysisResult.healthScore || null,
    });
  } catch (error: any) {
    console.error('Analyze route error:', error?.message);
    return NextResponse.json({ error: 'Analysis failed: ' + error?.message }, { status: 500 });
  }
}
