"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Show } from "@/components/show";
import { useState, useEffect } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import GaugeLogo from "@/components/gauge-logo";

const links = [
  { href: "/features", label: "Features" },
  { href: "/integrations", label: "Integrations" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Live demo" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <nav aria-label="Primary" className="fixed top-0 left-0 right-0 z-40 flex justify-center px-3 sm:px-4 pt-4 sm:pt-5">
        <div className="bg-white rounded-full p-[5px] flex items-center justify-between w-full max-w-[1440px] shadow-sm">
          {/* Left */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2.5">
              <GaugeLogo size={42} />
              <span className="text-[17px] font-bold tracking-tight text-gray-900 hidden sm:inline">Gauge</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[14px] transition-colors duration-300 ${
                    pathname === link.href ? "text-gray-900" : "text-gray-900 hover:text-gray-500"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {!mounted ? (
              <Link href="/sign-in" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium">
                Sign In
              </Link>
            ) : user ? (
              <>
                <Link href="/app" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium">
                  Dashboard
                </Link>
                <UserButton />
              </>
            ) : (
              <Link href="/sign-in" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium">
                Sign In
              </Link>
            )}
            <Link href="/sign-up" className="group bg-gray-900 text-white text-[13px] font-medium rounded-full pl-5 pr-2 py-2 inline-flex items-center gap-1.5 transition-all duration-300">
              <span className="flex flex-col overflow-hidden h-[20px]">
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                  Start free
                </span>
                <span className="leading-[20px]">Start free</span>
              </span>
              <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                <ArrowRight size={14} className="text-gray-900" />
              </span>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden bg-gray-900 rounded-full p-2 text-white"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mounted && (
        <div
          className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div
            className={`relative bg-white rounded-2xl mx-3 mb-3 p-6 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              open ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <nav className="flex flex-col gap-4 mb-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-[28px] leading-[32px] font-medium text-gray-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/sign-up"
              onClick={() => setOpen(false)}
              className="group bg-gray-900 text-white rounded-full pl-5 pr-2 py-2 inline-flex items-center gap-1.5 text-[13px] font-medium"
            >
              <span className="flex flex-col overflow-hidden h-[20px]">
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2 leading-[20px]">
                  Start free
                </span>
                <span className="leading-[20px]">Start free</span>
              </span>
              <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
                <ArrowRight size={14} className="text-gray-900" />
              </span>
            </Link>
            <Show when="signed-in">
              <Link href="/app" onClick={() => setOpen(false)} className="block mt-4 text-[13px] text-gray-600 font-medium">
                Dashboard
              </Link>
            </Show>
            <Link href="/sign-in" onClick={() => setOpen(false)} className="block mt-4 text-[13px] text-gray-600 font-medium">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
