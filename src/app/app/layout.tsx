import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AppSidebar } from '@/components/app-sidebar';
import { AppBanners } from '@/components/app-banners';
import OnboardingChecklist from '@/components/onboarding-checklist';
import { Toaster } from 'sonner';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const clerkUser = await currentUser();
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { hasOnboarded: true } });
  if (dbUser?.hasOnboarded === false) redirect('/onboarding');

  const userData = clerkUser
    ? {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        email: clerkUser.emailAddresses?.[0]?.emailAddress ?? '',
        id: clerkUser.id,
      }
    : null;

  return (
    <div className="flex h-screen bg-linear-black">
      <AppSidebar user={userData} />
      <main className="flex-1 overflow-y-auto">
        <AppBanners />
        <div className="p-8">
          <OnboardingChecklist />
          {children}
        </div>
      </main>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#141416',
            color: '#ffffff',
            border: '1px solid #1c1c20',
          },
        }}
      />
    </div>
  );
}
