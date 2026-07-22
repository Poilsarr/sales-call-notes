import { createClerkClient } from '@clerk/backend';
import prisma from './prisma';

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

  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: {
      clerkId,
      email: email || `${clerkId}@placeholder.dev`,
      name: `User ${clerkId.slice(0, 8)}`,
    },
  });
}