import { createClerkClient } from '@clerk/backend';
import prisma from './prisma';
import * as Sentry from '@sentry/nextjs';

if (!process.env.CLERK_SECRET_KEY) {
  console.warn(
    '[getUserByClerkId] CLERK_SECRET_KEY is empty — Clerk client created with placeholder, getUser calls will fail'
  );
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || '' });

export async function getUserByClerkId(clerkId: string) {
  let email: string | undefined;
  try {
    const clerkUser = await clerk.users.getUser(clerkId);
    const primaryEmail = clerkUser.emailAddresses?.find(
      (e: { id: string }) => e.id === clerkUser.primaryEmailAddressId
    );
    if (primaryEmail?.emailAddress) {
      email = primaryEmail.emailAddress;
    }
  } catch {
    console.warn(`[getUserByClerkId] Clerk API unavailable for ${clerkId}`);
  }

  const emailNorm = email || `${clerkId}@placeholder.dev`;
  const displayName = `User ${clerkId.slice(0, 8)}`;
  try {
    return await prisma.user.upsert({
      where: { clerkId },
      update: { email: emailNorm, name: displayName },
      create: {
        clerkId,
        email: emailNorm,
        name: displayName,
      },
    });
  } catch (e: any) {
    if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
      const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
      if (existing) {
        Sentry.captureException(e, {
          tags: { source: 'get-user', reason: 'P2002-email' },
          extra: { clerkId, email: emailNorm },
        });
        return existing;
      }
    }
    throw e;
  }
}