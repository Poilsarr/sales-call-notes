import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createOpenAIClient } from "@/lib/openai-client";
import { KnowledgeGraphService } from "@/services/ai/knowledge-graph";

export async function POST(req: NextRequest) {
  try {
    const { userId: sessionUserId } = await auth();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const userId = sessionUserId;
    const kg = new KnowledgeGraphService();

    // ponytail: RAG retrieval — embed the query, fetch top-5 similar calls
    // for THIS user instead of sending the entire history to the LLM.
    // Falls back to the 5 most recent calls if embeddings aren't indexed
    // yet (e.g. calls uploaded before indexing existed) or embedding fails.
    let retrieved: { id: string; filename: string; summary: string | null; transcript: string | null }[] = [];
    try {
      retrieved = await kg.searchByQuery(query, userId, 5);
    } catch (err) {
      console.error("RAG retrieval failed, falling back to recent calls:", err);
    }

    if (retrieved.length === 0) {
      const recent = await prisma.call.findMany({
        where: { userId },
        select: { id: true, filename: true, summary: true, transcript: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      retrieved = recent;
    }

    const openai = createOpenAIClient();

    const callContext = retrieved.map(c => ({
      filename: c.filename,
      summary: c.summary,
      transcript: c.transcript?.slice(0, 3000),
    }));

    const prompt = `
You are a sales call analyst assistant. Answer the user's question based on their meeting history.
Be specific. Reference exact call names and dates. If the answer isn't in the data, say so.

User question: "${query}"

Meeting history (${retrieved.length} calls retrieved by relevance):
${JSON.stringify(callContext, null, 2)}

Respond concisely in plain text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You analyze sales call transcripts and answer questions about meeting content. Be specific and reference actual calls." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "I couldn't find an answer based on the available meeting data.";

    return NextResponse.json({
      answer,
      relevantCalls: retrieved.map(c => ({
        id: c.id,
        filename: c.filename,
        date: (c as any).createdAt ? new Date((c as any).createdAt).toISOString() : c.id,
        summary: c.summary,
      })),
      totalCallsSearched: retrieved.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Chat query failed" }, { status: 500 });
  }
}
