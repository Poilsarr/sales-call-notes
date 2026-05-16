import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "No transcript" }, { status: 400 });
    }

    // Ollama (local/free)
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "minimax-m2:cloud",
        messages: [
          {
            role: "system",
            content: `You are a sales call analyst. Analyze this transcript and extract:

Return JSON with exactly these 4 fields:
- summary: 2-3 sentence summary
- actionItems: [{"task": "...", "owner": "...", "due": "..."}] - THINGS SOMEONE WILL DO AFTER THE CALL (send welcome email, send contract, get utility bill, process enrollment)
- keyDecisions: ["..."] - DECISIONS MADE during the call (enrolled, agreed to terms, accepted plan)
- nextSteps: [{"step": "...", "date": "..."}] - FUTURE TOUCHPOINTS (follow-up calls, customer decision dates, scheduled meetings)

CRITICAL - actionItems vs nextSteps distinction:
- actionItems = tasks/deliverables that need to happen (send something, provide something, process something)
- nextSteps = scheduled future interactions (call back on Tuesday, follow up next week, customer will decide on Friday)

For enrollment calls:
- "We will send you a welcome package" → actionItem: {task: "Send welcome package", owner: "Company", due: "3-5 days"}
- "Customer to provide utility bill" → actionItem: {task: "Provide copy of utility bill", owner: "Customer", due: " ASAP"}
- "Call scheduled for Tuesday" → nextStep: {step: "Follow-up call", date: "Tuesday"}
- "Customer will decide by Friday" → nextStep: {step: "Customer decision", date: "Friday"}

Return ONLY valid JSON:`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.message?.content;

    if (!content) {
      throw new Error("No content received from Ollama");
    }

    // Strip markdown code blocks
    let cleanContent = content.replace(/^```json\s*/,"").replace(/```$/,"").trim();
    console.log("Ollama response:", cleanContent);

    let result;
    try {
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse JSON from response");
      }
    }

    // Normalize snake_case to camelCase for frontend
    const normalized = {
      summary: result.summary || result.SUMMARY || "",
      actionItems: (result.actionItems || result.action_items || result.ACTION_ITEMS || []).map((item: any) => ({
        task: item.task || item.Task || item.task_name || "",
        owner: item.owner || item.Owner || "",
        due: item.due || item.Due || item.date || item.timeline || "",
      })),
      keyDecisions: result.keyDecisions || result.key_decisions || result.KEY_DECISIONS || result.decisions || [],
      nextSteps: (result.nextSteps || result.next_steps || result.NEXT_STEPS || result.next_steps || []).map((item: any) => ({
        step: item.step || item.Step || item.action || item.action_name || "",
        date: item.date || item.Date || item.timeline || item.due || "",
      })),
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Summarization failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}