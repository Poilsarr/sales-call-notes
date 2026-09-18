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
  // Tracks the last identified user so reset only fires on an actual
  // sign-out transition — never for never-signed-in visitors (whose
  // anonymous pageview id must survive Clerk finishing loading).
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!posthogKey || initialized.current) return;
    initialized.current = true;
  }, []);

  useEffect(() => {
    // Gate on Clerk load: user is undefined both before load and when signed
    // out, so an unconditional reset wipes the anonymous distinct_id that the
    // pageview effect stores on first paint.
    if (!posthogKey || !initialized.current || !isLoaded) return;
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;
      identifyPostHogUser(user.id, email);
      prevUserId.current = user.id;
    } else if (prevUserId.current) {
      resetPostHogUser();
      prevUserId.current = null;
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (!posthogKey || !initialized.current) return;
    capturePostHogPageview(pathname);
  }, [pathname]);

  return children;
}
