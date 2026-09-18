"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { capturePostHogPageview, identifyPostHogUser, resetPostHogUser } from "@/lib/posthog";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export default function GaugePostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const initialized = useRef(false);

  useEffect(() => {
    if (!posthogKey || initialized.current) return;
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!posthogKey || !initialized.current) return;
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;
      identifyPostHogUser(user.id, email);
    } else {
      resetPostHogUser();
    }
  }, [user]);

  useEffect(() => {
    if (!posthogKey || !initialized.current) return;
    capturePostHogPageview(pathname);
  }, [pathname]);

  return children;
}
