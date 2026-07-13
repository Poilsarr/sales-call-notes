import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/get-user";
import prisma from "@/lib/prisma";
import { sendWelcomeEmail } from "@/services/email";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserByClerkId(clerkId);
    return NextResponse.json({ hasOnboarded: user.hasOnboarded });
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const user = await getUserByClerkId(clerkId);

    if (body.hasOnboarded === true) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hasOnboarded: true },
      });
      // ponytail: fire welcome email on onboarding complete
      void sendWelcomeEmail(user.email, user.name);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
