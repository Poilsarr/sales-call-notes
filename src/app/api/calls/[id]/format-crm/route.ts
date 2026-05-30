import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CRMFormatterService } from "@/services/crm/formatter";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") || "hubspot";

    const call = await prisma.call.findUnique({
      where: { id: params.id },
      include: {
        actionItems: true,
        decisions: true,
        nextSteps: true,
        analytics: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const formatter = new CRMFormatterService();
    const formattedText = formatter.formatNote(call, provider as 'hubspot' | 'salesforce');

    return NextResponse.json({ formattedText });
  } catch (error) {
    console.error("CRM formatting error:", error);
    return NextResponse.json(
      { error: "Formatting failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
