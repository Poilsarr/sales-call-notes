"use client";

import { useAuth } from "@clerk/nextjs";

type ShowProps = {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
};

export function Show({ when, children }: ShowProps) {
  const { isSignedIn } = useAuth();
  const shouldRender = when === "signed-in" ? isSignedIn : !isSignedIn;

  if (!shouldRender) return null;
  return <>{children}</>;
}
