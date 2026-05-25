import prisma from './prisma';

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId, email: `${clerkId}@placeholder.dev`, name: '' },
  });
}