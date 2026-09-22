import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimitStrict } from "@/lib/rate-limit";
import { captureApiError } from "@/lib/sentry";

const LeadSchema = z.object({
  email: z.string().trim().max(254).email(),
  source: z.string().trim().max(64).optional(),
  ctaId: z.string().trim().max(64).optional(),
  // Honeypot: never rendered to humans; bots fill it, real clients omit it.
  website: z.string().max(500).optional(),
  // Anonymous PostHog distinct_id for client-side $identify (Executor B).
  // Accepted here for forward-compat; identification happens client-side,
  // so the server intentionally does not persist it.
  distinctId: z.string().trim().max(128).optional(),
});

function getClientIp(req: Request): string {
  // Same convention as src/middleware-rate-limit.ts: Vercel appends the real
  // client IP at the END of x-forwarded-for; the first hop is spoofable.
  return (
    req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

// Best-effort audit trail for a captured lead. userId is null (anonymous
// pre-login visitor). Metadata must NEVER contain the raw email address.
async function logLeadAudit(
  leadId: string,
  source: string | undefined,
  ctaId: string | undefined,
  returning: boolean,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: "LEAD_CAPTURED",
        entityId: leadId,
        entityType: "EmailLead",
        metadata: { source: source ?? null, ctaId: ctaId ?? null, returning },
      },
    });
  } catch {
    // Audit failure must never block lead capture.
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    // Generic messages only — never echo submitted values (incl. the email).
    const emailFailed = parsed.error.issues.some((i) => i.path[0] === "email");
    return NextResponse.json(
      { error: emailFailed ? "A valid email is required" : "Invalid request" },
      { status: 400 },
    );
  }

  // Honeypot: silently accept bot submissions without touching Redis or the DB.
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // Fail-CLOSED rate limit: this is a public anonymous route, so any limiter
  // outage (no creds, Redis down, unexpected error) denies the write.
  let allowed = false;
  try {
    const rl = await checkRateLimitStrict(`leads:${getClientIp(req)}`, "leads");
    allowed = rl.success;
  } catch {
    allowed = false;
  }
  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = parsed.data.source || undefined;
  const ctaId = parsed.data.ctaId || undefined;

  try {
    const existing = await prisma.emailLead.findUnique({ where: { email } });
    if (existing) {
      // Idempotent re-POST: same email → 200 with the same id; refresh
      // source/ctaId only when the caller actually provided new values.
      const data: { source?: string; ctaId?: string } = {};
      if (source !== undefined) data.source = source;
      if (ctaId !== undefined) data.ctaId = ctaId;
      const lead =
        Object.keys(data).length > 0
          ? await prisma.emailLead.update({ where: { email }, data })
          : existing;
      await logLeadAudit(lead.id, source, ctaId, true);
      return NextResponse.json({ ok: true, id: lead.id }, { status: 200 });
    }

    let lead;
    try {
      lead = await prisma.emailLead.create({
        data: { email, source, ctaId, status: "pending" },
      });
    } catch (e) {
      // Concurrent double-submit race: unique violation → treat as idempotent.
      if ((e as { code?: string } | null)?.code === "P2002") {
        const raced = await prisma.emailLead.findUnique({ where: { email } });
        if (raced) {
          await logLeadAudit(raced.id, source, ctaId, true);
          return NextResponse.json({ ok: true, id: raced.id }, { status: 200 });
        }
      }
      throw e;
    }
    await logLeadAudit(lead.id, source, ctaId, false);
    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (error) {
    // NEVER include the raw email in logs, thrown objects, or Sentry context.
    captureApiError("api/leads", error, { method: "POST" });
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
