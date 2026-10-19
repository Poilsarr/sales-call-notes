"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

interface IntegrationLogo {
  name: string;
  src: string;
  /** hex color used for the subtle tint ring */
  accent: string;
}

const ROW_A: IntegrationLogo[] = [
  { name: "Google Meet", src: "https://cdn.simpleicons.org/googlemeet/00897B", accent: "#00897B" },
  { name: "Zoom", src: "https://cdn.simpleicons.org/zoom/2D8CFF", accent: "#2D8CFF" },
  { name: "Slack", src: "https://cdn.simpleicons.org/slack/4A154B", accent: "#4A154B" },
  { name: "HubSpot", src: "https://cdn.simpleicons.org/hubspot/FF7A59", accent: "#FF7A59" },
  { name: "Salesforce", src: "https://cdn.simpleicons.org/salesforce/00A1E0", accent: "#00A1E0" },
  { name: "Notion", src: "https://cdn.simpleicons.org/notion/000000", accent: "#333333" },
  { name: "Google Meet", src: "https://cdn.simpleicons.org/googlemeet/00897B", accent: "#00897B" },
  { name: "Zoom", src: "https://cdn.simpleicons.org/zoom/2D8CFF", accent: "#2D8CFF" },
  { name: "Slack", src: "https://cdn.simpleicons.org/slack/4A154B", accent: "#4A154B" },
  { name: "HubSpot", src: "https://cdn.simpleicons.org/hubspot/FF7A59", accent: "#FF7A59" },
  { name: "Salesforce", src: "https://cdn.simpleicons.org/salesforce/00A1E0", accent: "#00A1E0" },
  { name: "Notion", src: "https://cdn.simpleicons.org/notion/000000", accent: "#333333" },
];

const ROW_B: IntegrationLogo[] = [
  { name: "OpenAI", src: "https://cdn.simpleicons.org/openai/412991", accent: "#412991" },
  { name: "Zapier", src: "https://cdn.simpleicons.org/zapier/FF4A00", accent: "#FF4A00" },
  { name: "Microsoft Teams", src: "https://cdn.simpleicons.org/microsoftteams/6264A7", accent: "#6264A7" },
  { name: "Linear", src: "https://cdn.simpleicons.org/linear/5E6AD2", accent: "#5E6AD2" },
  { name: "Anthropic", src: "https://cdn.simpleicons.org/anthropic/191919", accent: "#444444" },
  { name: "Gmail", src: "https://cdn.simpleicons.org/gmail/EA4335", accent: "#EA4335" },
  { name: "OpenAI", src: "https://cdn.simpleicons.org/openai/412991", accent: "#412991" },
  { name: "Zapier", src: "https://cdn.simpleicons.org/zapier/FF4A00", accent: "#FF4A00" },
  { name: "Microsoft Teams", src: "https://cdn.simpleicons.org/microsoftteams/6264A7", accent: "#6264A7" },
  { name: "Linear", src: "https://cdn.simpleicons.org/linear/5E6AD2", accent: "#5E6AD2" },
  { name: "Anthropic", src: "https://cdn.simpleicons.org/anthropic/191919", accent: "#444444" },
  { name: "Gmail", src: "https://cdn.simpleicons.org/gmail/EA4335", accent: "#EA4335" },
];

function LogoPill({ logo }: { logo: IntegrationLogo }) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white border border-black/[0.07] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default mx-2"
      style={{ minWidth: "158px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src}
        alt={logo.name}
        width={28}
        height={28}
        className="w-7 h-7 object-contain flex-shrink-0"
        loading="lazy"
      />
      <span className="text-[13.5px] font-semibold text-gray-800 whitespace-nowrap tracking-[-0.01em]">
        {logo.name}
      </span>
    </div>
  );
}

export function StudioIntegrationsGrid() {
  return (
    <section
      data-track-section="studio-integrations"
      aria-label="App Ecosystem Integrations"
      className="py-16 sm:py-20 lg:py-24 bg-[#F8F9FA] border-b border-black/[0.05] overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-[12px] font-mono uppercase tracking-[0.18em] text-[#F26522] font-semibold mb-3">
            Plug In Everywhere
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-medium tracking-[-0.03em] text-gray-900 leading-[1.1] mb-3">
            Connect to your favorite apps
          </h2>
          <p className="text-[15px] sm:text-[16px] text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Gauge plugs into Google Meet, Zoom, Slack, HubSpot, Salesforce, and dozens more —
            with one-click setup and no bot invites.
          </p>
        </div>
      </div>

      {/* Marquee rows — full bleed, no container cap */}
      <div className="relative w-full overflow-hidden mb-4">
        {/* Fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28 z-10 bg-gradient-to-r from-[#F8F9FA] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28 z-10 bg-gradient-to-l from-[#F8F9FA] to-transparent" />

        {/* Row A — slides left */}
        <div className="flex animate-marquee-left hover:[animation-play-state:paused] mb-3">
          {ROW_A.map((logo, i) => (
            <LogoPill key={`a-${i}`} logo={logo} />
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden mb-12">
        {/* Fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28 z-10 bg-gradient-to-r from-[#F8F9FA] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28 z-10 bg-gradient-to-l from-[#F8F9FA] to-transparent" />

        {/* Row B — slides right (opposite direction) */}
        <div className="flex animate-marquee-right hover:[animation-play-state:paused]">
          {ROW_B.map((logo, i) => (
            <LogoPill key={`b-${i}`} logo={logo} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/integrations"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-all text-[13px] font-semibold shadow-sm"
        >
          <span>View all integrations</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
