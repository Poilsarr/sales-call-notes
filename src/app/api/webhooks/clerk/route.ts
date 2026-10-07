import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Verification failed", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email =
      email_addresses?.find((entry) => entry.id === evt.data.primary_email_address_id)?.email_address ??
      email_addresses?.[0]?.email_address;

    if (!email) return new Response("No email", { status: 200 });

    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || email.split("@")[0];
    const user = await prisma.user.upsert({
      where: { clerkId: id },
      update: { email, name, avatar: image_url ?? undefined },
      create: { clerkId: id, email, name, avatar: image_url ?? undefined },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: evt.type === "user.created" ? "user.signup" : "user.updated",
      },
    }).catch(() => {});
  }

  if (evt.type === "user.deleted") {
    await prisma.user.delete({ where: { clerkId: evt.data.id } }).catch(() => {});
  }

  return new Response("OK", { status: 200 });
}
