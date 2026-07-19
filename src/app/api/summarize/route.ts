import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AnalysisService } from "@/services/ai/analysis";
import { getSecret } from "@/lib/secrets";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript" }, { status: 400 });
    }

    if (!getSecret("OPENAI_API_KEY") && !getSecret("GROQ_API_KEY")) {
      return NextResponse.json(
        { error: "Analysis requires an AI API key. Set OPENAI_API_KEY or GROQ_API_KEY in Vercel env vars." },
        { status: 500 },
      );
    }

    const analysisService = new AnalysisService();
    const analysis = await analysisService.analyze(transcript);

    return NextResponse.json({
      summary: analysis.executiveSummary || "",
      actionItems: (analysis.actionItems ?? []).map((item: any) => ({
        task: item.task || "",
        owner: item.owner || "",
        due: item.due || null,
      })),
      keyDecisions: (analysis.commitments ?? []).map((d: any) =>
        typeof d === "string" ? d : d.what || ""
      ),
      nextSteps: (analysis.nextSteps ?? []).map((s: any) => ({
        step: s.step || "",
        date: s.date || null,
      })),
    });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Summarization failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
