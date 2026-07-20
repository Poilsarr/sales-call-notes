import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPartnerApplicationEmail } from "@/services/email";

const AUDIENCES = [
  "sales-coach",
  "newsletter",
  "community",
  "agency",
  "consultant",
  "content-creator",
  "other",
];
const REACHES = ["<1k", "1k-10k", "10k-50k", "50k+"];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, email, audience, reach, message } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!AUDIENCES.includes(audience)) {
      return NextResponse.json({ error: "Please select an audience type" }, { status: 400 });
    }
    if (!REACHES.includes(reach)) {
      return NextResponse.json({ error: "Please select your reach" }, { status: 400 });
    }

    const application = await prisma.partnerApplication.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        audience,
        reach,
        message: message && typeof message === "string" ? message.trim().slice(0, 2000) : null,
        status: "new",
      },
    });

    // Best-effort alert email — never blocks the submission.
    await sendPartnerApplicationEmail({
      name: application.name,
      email: application.email,
      audience: application.audience,
      reach: application.reach,
      message: application.message,
    });

    return NextResponse.json({ ok: true, id: application.id }, { status: 201 });
  } catch (error) {
    console.error("Partner application failed:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
