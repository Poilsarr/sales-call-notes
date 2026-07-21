'use client';

import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import TrialBanner from '@/components/trial-banner';
import FreePlanBanner from '@/components/free-plan-banner';
import UsageLimitBanner from '@/components/usage-limit-banner';
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
  const [plan, setPlan] = useState<string | null>(null);
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState<number | "unlimited">(5);
  const [minuteUsage, setMinuteUsage] = useState(0);
  const [minuteLimit, setMinuteLimit] = useState<number | "unlimited">(300);
  const [onboardChecked, setOnboardChecked] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  // ponytail: onboarding gate — redirect to /onboarding if user hasn't completed it
  useEffect(() => {
    if (!userId) return;
    fetch("/api/user")
      .then(r => r.json())
      .then(d => {
        if (d.hasOnboarded === false) {
          router.replace("/onboarding");
        } else {
          setOnboardChecked(true);
        }
      })
      .catch(() => setOnboardChecked(true)); // fail open
  }, [userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/billing?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.trialEndsAt) setTrialEndsAt(d.trialEndsAt);
        if (d.plan) setPlan(d.plan);
        if (typeof d.usage === "number") setUsage(d.usage);
        if (d.limit !== undefined) setLimit(d.limit);
        if (typeof d.minuteUsage === "number") setMinuteUsage(d.minuteUsage);
        if (d.minuteLimit !== undefined) setMinuteLimit(d.minuteLimit);
      })
      .catch(() => {});
  }, [userId]);

  if (!isLoaded || !isSignedIn || !onboardChecked) return null;

  return (
    <div className="flex h-screen bg-linear-black">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <TrialBanner trialEndsAt={trialEndsAt} />
        <FreePlanBanner plan={plan} />
        <UsageLimitBanner
          plan={plan}
          usage={usage}
          limit={limit}
          minuteUsage={minuteUsage}
          minuteLimit={minuteLimit}
        />
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
