import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    groqKeySet: !!process.env.GROQ_API_KEY,
    groqKeyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.slice(0, 8) + '...' : null,
    openaiKeySet: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}
