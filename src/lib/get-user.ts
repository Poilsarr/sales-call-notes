import { createClerkClient } from '@clerk/backend';
import prisma from './prisma';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || '' });

export async function getUserByClerkId(clerkId: string) {
  let email = `${clerkId}@placeholder.dev`;
  try {
    const clerkUser = await clerk.users.getUser(clerkId);
    const primaryEmail = clerkUser.emailAddresses?.find(
      (e: { id: string }) => e.id === clerkUser.primaryEmailAddressId
    );
    if (primaryEmail?.emailAddress) {
      email = primaryEmail.emailAddress;
    }
  } catch {
    // Clerk API unavailable — fall back to placeholder
  }

  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: {
      clerkId,
      email,
      name: `User ${clerkId.slice(0, 8)}`,
    },
  });
}