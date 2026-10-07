import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

function isAdminEmail(email?: string | null) {
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && allowlist.includes(email.toLowerCase()));
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId).catch(() => null);
  const email =
    clerkUser?.emailAddresses?.find((entry) => entry.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress;

  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const requestedTake = Number(searchParams.get("take") ?? 50);
  const requestedSkip = Number(searchParams.get("skip") ?? 0);
  const take = Number.isFinite(requestedTake) ? Math.min(Math.max(Math.floor(requestedTake), 1), 100) : 50;
  const skip = Number.isFinite(requestedSkip) ? Math.max(Math.floor(requestedSkip), 0) : 0;
  const q = searchParams.get("q")?.trim() ?? "";

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        _count: { select: { calls: true } },
      },
    }),
  ]);

  return NextResponse.json({ total, users });
}
