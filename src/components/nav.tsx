"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Show } from "@/components/show";
import { useState, useEffect } from "react";

const links = [
  { href: "/features", label: "Features" },
  { href: "/integrations", label: "Integrations" },
  { href: "/pricing", label: "Pricing" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggle = () => setOpen((v) => !v);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 flex justify-center px-4 pt-5">
        <div className="fluid-island h-12 px-2 pl-5 flex items-center justify-between rounded-full w-full max-w-5xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
            <div className="w-6 h-6 rounded-lg bg-[#5e6ad2] rotate-45 flex items-center justify-center group-hover:rotate-[135deg] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <svg className="w-3 h-3 text-white -rotate-45 group-hover:rotate-0 transition-all duration-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-display text-sm font-semibold tracking-tight">CallNote<span className="text-white/40 font-medium">Pro</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  pathname === link.href ? "text-white bg-white/10" : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide text-white/40 hover:text-white transition-all duration-500">Sign In</button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide text-white/40 hover:text-white transition-all duration-500">Dashboard</Link>
              <Link href="/billing" className="px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wide text-white/40 hover:text-white transition-all duration-500">Billing</Link>
              <UserButton />
            </Show>
            <Link href="/" className="btn-island flex items-center gap-2 bg-white text-[#050505] hover:bg-white/90 group">
              Launch App
              <span className="icon-wrap bg-[#050505]/10 group-hover:bg-[#050505]/15">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>

          <button onClick={toggle} className="md:hidden relative w-8 h-8 flex items-center justify-center">
            <div className="relative w-5 h-4">
              <span className={`absolute left-0 top-0 w-full h-[2px] bg-white/70 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "top-1/2 -translate-y-1/2 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/70 rounded-full transition-all duration-300 ${open ? "opacity-0 scale-x-0" : "opacity-100"}`} />
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-white/70 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>
      </nav>

      {mounted && (
        <div
          className={`fixed inset-0 z-30 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-3xl" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[100dvh] gap-6 px-6">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-3xl font-display font-semibold tracking-tight transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                } ${pathname === link.href ? "text-white" : "text-white/30 hover:text-white/60"}`}
                style={{ transitionDelay: `${150 + i * 100}ms` }}
              >
                {link.label}
              </Link>
            ))}
            <div className={`h-px w-16 bg-white/10 my-4 transition-all duration-700 delay-400 ${open ? "opacity-100" : "opacity-0"}`} />
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button onClick={() => setOpen(false)}
                  className={`text-sm text-white/40 hover:text-white transition-all duration-700 delay-[500ms] ${
                    open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}>
                  Sign In
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className={`text-sm text-white/40 hover:text-white transition-all duration-700 delay-[500ms] ${
                  open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}>
                Dashboard
              </Link>
            </Show>
          </div>
        </div>
      )}
    </>
  );
}
