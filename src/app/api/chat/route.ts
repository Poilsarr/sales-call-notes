import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getLangfuseHandler, flushLangfuse } from "@/lib/langfuse";

export async function POST(req: NextRequest) {
  try {
    const { userId: sessionUserId } = await auth();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const userId = sessionUserId;

    const calls = await prisma.call.findMany({
      where: { userId },
      include: { actionItems: true, decisions: true, nextSteps: true, analytics: true },
      orderBy: { createdAt: "desc" },
    });

    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const callContext = calls.map(c => ({
      filename: c.filename,
      date: c.createdAt.toISOString().split("T")[0],
      summary: c.summary,
      transcript: c.transcript?.slice(0, 2000),
      healthScore: c.healthScore,
      sentiment: c.sentiment,
      actionItems: c.actionItems.map(a => `${a.task} (${a.owner})`),
      decisions: c.decisions.map(d => d.content),
      nextSteps: c.nextSteps.map(n => n.step),
      analytics: c.analytics ? {
        budgetMentioned: c.analytics.budgetMentioned,
        timelineMentioned: c.analytics.timelineMentioned,
        decisionMakerPresent: c.analytics.decisionMakerPresent,
      } : null,
    }));

    const prompt = `
You are a sales call analyst assistant. Answer the user's question based on their meeting history.
Be specific. Reference exact call names and dates. If the answer isn't in the data, say so.

User question: "${query}"

Meeting history (${calls.length} calls):
${JSON.stringify(callContext, null, 2)}

Respond concisely in plain text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You analyze sales call transcripts and answer questions about meeting content. Be specific and reference actual calls." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }, {
      callbacks: [getLangfuseHandler()].filter(Boolean)
    });

    const answer = completion.choices[0]?.message?.content || "I couldn't find an answer based on the available meeting data.";

    const relevantCalls = calls.filter(c => {
      const searchText = [c.summary, c.transcript, ...c.actionItems.map(a => a.task), ...c.decisions.map(d => d.content)].join(" ").toLowerCase();
      const queryTerms = query.toLowerCase().split(" ").filter((t: string) => t.length > 3);
      return queryTerms.some((t: string) => searchText.includes(t));
    }).slice(0, 3);

    return NextResponse.json({
      answer,
      relevantCalls: relevantCalls.map(c => ({
        id: c.id,
        filename: c.filename,
        date: c.createdAt,
        summary: c.summary,
      })),
      totalCallsSearched: calls.length,
    });
  } catch (error) {
    return NextResponse.json({ error: "Chat query failed" }, { status: 500 });
  } finally {
    await flushLangfuse();
  }
}
