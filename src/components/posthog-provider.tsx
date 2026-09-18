"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { capturePostHogPageview, identifyPostHogUser, resetPostHogUser } from "@/lib/posthog";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export default function GaugePostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const initialized = useRef(false);

  useEffect(() => {
    if (!posthogKey || initialized.current) return;
    initialized.current = true;
  }, []);

  useEffect(() => {
    // Gate on Clerk load: user is undefined both before load and when signed
    // out, so resetting before isLoaded wipes the anonymous distinct_id that
    // the pageview effect just stored.
    if (!posthogKey || !initialized.current || !isLoaded) return;
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;
      identifyPostHogUser(user.id, email);
    } else {
      resetPostHogUser();
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (!posthogKey || !initialized.current) return;
    capturePostHogPageview(pathname);
  }, [pathname]);

  return children;
}
