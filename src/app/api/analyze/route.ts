import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const prisma = new PrismaClient();

async function transcribe(provider: string, apiKey: string, file: File): Promise<string> {
  const { OpenAI } = await import('openai');
  const baseURL = provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined;
  const model = provider === 'groq' ? 'whisper-large-v3' : 'whisper-1';
  const openai = new OpenAI({ apiKey, baseURL });
  const r = await openai.audio.transcriptions.create({ file, model });
  return r.text;
}

async function transcribeLocal(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() || 'mp3';
  const tmp = path.join('/tmp', `audio_${Date.now()}.${ext}`);
  await writeFile(tmp, buffer);
  const result = await new Promise<string>((resolve, reject) => {
    const py = spawn('python3', ['-c', `
import sys
try:
    import whisper
    m = whisper.load_model("base")
    r = m.transcribe("${tmp.replace(/"/g, '\\"')}")
    print(r["text"])
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`]);
    let out = '', err = '';
    py.stdout.on('data', (d: Buffer) => out += d.toString());
    py.stderr.on('data', (d: Buffer) => err += d.toString());
    py.on('close', (code) => {
      unlink(tmp).catch(() => {});
      code === 0 ? resolve(out.trim()) : reject(new Error(err || 'Local whisper failed'));
    });
  });
  return result;
}

async function analyzeWithAI(transcript: string): Promise<any> {
  const openAIKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const attempts = [
    { name: 'Groq', key: groqKey, baseURL: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
    { name: 'OpenAI', key: openAIKey, baseURL: undefined, model: 'gpt-4o' },
  ];

  for (const a of attempts) {
    if (!a.key) continue;
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: a.key, baseURL: a.baseURL });
      const r = await openai.chat.completions.create({
        model: a.model,
        messages: [
          { role: 'system', content: 'You are a JSON-only API. Your response must be ONLY valid JSON with no other text, no markdown, no code fences.' },
          { role: 'user', content: `Analyze this sales transcript. Respond with ONLY this JSON structure (no other text): {"summary":"...","actionItems":[{"task":"...","owner":"...","due":"..."}],"keyDecisions":["..."],"nextSteps":[{"step":"...","date":"..."}],"healthScore":0.85}\n\nTranscript: ${transcript}` }
        ],
        temperature: 0.3,
      });
      const raw = r.choices?.[0]?.message?.content || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e: any) {
      const msg = e?.message || '';
      console.log(`${a.name} analysis failed:`, msg.slice(0, 100));
      if (msg.includes('quota') || msg.includes('insufficient')) {
        console.warn(`${a.name} quota exceeded, skipping to next provider`);
      }
      if (a.name === 'Groq' && msg.includes('valid JSON')) {
        try {
          const match = (e as any).response?.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
        } catch {}
      }
    }
  }
  throw new Error('All AI providers failed for analysis');
}

async function tryAnalyzeOllama(text: string): Promise<any> {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'minimax-m2:cloud',
      messages: [
        { role: 'system', content: 'You respond only with valid JSON.' },
        { role: 'user', content: `Analyze this sales transcript. Return JSON ONLY: {"summary":"...","actionItems":[{"task":"...","owner":"...","due":"..."}],"keyDecisions":["..."],"nextSteps":[{"step":"...","date":"..."}],"healthScore":0.85}\n\n${text}` },
      ],
      temperature: 0.3,
      stream: false,
    }),
  });
  const data = await res.json();
  const raw = data?.message?.content || '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('Could not parse Ollama response as JSON');
}

export async function POST(req: Request) {
  try {
    console.log('Analyze route called');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // --- TRANSCRIPTION ---
    let transcript = '';
    const openAIKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // Try Groq first (OpenAI quota exhausted), then OpenAI, then local whisper
    const transcribeAttempts = [
      { name: 'Groq', key: groqKey, provider: 'groq' as const },
      { name: 'OpenAI', key: openAIKey, provider: 'openai' as const },
    ];

    let transcribed = false;
    for (const a of transcribeAttempts) {
      if (!a.key) continue;
      try {
        transcript = await transcribe(a.provider, a.key, file);
        transcribed = true;
        break;
      } catch (e: any) {
        const msg = e?.message || '';
        console.log(`${a.name} transcription failed:`, msg.slice(0, 100));
        if (msg.includes('quota') || msg.includes('insufficient')) {
          console.warn(`${a.name} quota exceeded, skipping to next provider`);
        }
      }
    }

    if (!transcribed) {
      console.log('Cloud transcription failed, trying local whisper...');
      try {
        transcript = await transcribeLocal(file);
        transcribed = true;
      } catch (localErr: any) {
        console.error('Local whisper also failed:', localErr?.message);
        return NextResponse.json({ 
          error: 'Transcription failed. All AI providers unavailable. Please add credits to your OpenAI account or ensure GROQ_API_KEY is set.' 
        }, { status: 500 });
      }
    }

    // --- ANALYSIS ---
    let analysisResult: any;
    try {
      analysisResult = await analyzeWithAI(transcript);
    } catch {
      console.log('AI analysis failed, trying Ollama...');
      try {
        analysisResult = await tryAnalyzeOllama(transcript);
      } catch {
        console.log('Ollama also failed, using raw transcript as summary');
        analysisResult = {
          summary: transcript.slice(0, 300),
          actionItems: [],
          keyDecisions: [],
          nextSteps: [],
          healthScore: null,
        };
      }
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
        userId, filename: file.name || 'call_recording.mp3', transcript,
        summary: analysisResult.summary || transcript.slice(0, 300),
        healthScore: analysisResult.healthScore || null,
        actionItems: { create: actionItems },
        decisions: { create: decisions },
        nextSteps: { create: nextSteps },
      }
    }).catch(() => {});

    return NextResponse.json({
      summary: analysisResult.summary || transcript.slice(0, 300),
      actionItems: analysisResult.actionItems || [],
      keyDecisions: analysisResult.keyDecisions || [],
      nextSteps: analysisResult.nextSteps || [],
      healthScore: analysisResult.healthScore || null,
    });
  } catch (error: any) {
    console.error('Analyze route error:', error?.message);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
