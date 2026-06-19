'use client';

import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import TrialBanner from '@/components/trial-banner';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/billing?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.trialEndsAt) setTrialEndsAt(d.trialEndsAt);
      })
      .catch(() => {});
  }, [userId]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="flex h-screen bg-linear-black">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <TrialBanner trialEndsAt={trialEndsAt} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="p-8"
        >
          {children}
        </motion.div>
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
