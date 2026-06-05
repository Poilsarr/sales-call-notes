import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/get-user";
import { CRMFormatterService } from "@/services/crm/formatter";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);

    const call = await prisma.call.findUnique({
      where: { id: params.id },
      include: {
        actionItems: true,
        decisions: true,
        nextSteps: true,
        analytics: true,
        user: { select: { teamId: true } },
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (user.teamId && call.user?.teamId && call.user.teamId !== user.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") || "hubspot";

    const formatter = new CRMFormatterService();
    const formattedText = formatter.formatNote(call, provider as 'hubspot' | 'salesforce');

    return NextResponse.json({ formattedText });
  } catch (error) {
    console.error("CRM formatting error:", error);
    return NextResponse.json(
      { error: "Formatting failed" },
      { status: 500 }
    );
  }
}
