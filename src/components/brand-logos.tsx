"use client";

/**
 * Official brand logos for every integration in the app.
 *
 * Uses the *original* brand assets provided by the user (Sept 2026) —
 * served from /public/brand/ as static files (Wikimedia Commons /
 * brand press kits, verified). Where the trademark owner specifies
 * an icon-only monogram, that is used so it stays legible at 22px.
 *
 * Assets in /public/brand/:
 *  - hubspot.svg       — HubSpot sprocket (simple-icons, #FF7A59)
 *  - salesforce.svg    — Salesforce cloud (Wikimedia, #00A1E0)
 *  - teams.svg         — Microsoft Teams 2018–present (Wikimedia, #5059C9/#7B83EB)
 *  - slack.png         — Slack hash 2019 (Wikimedia, 256px)
 *  - google-calendar.svg — Google Calendar 2020 (Wikimedia, 31)
 *  - outlook.svg       — Microsoft Outlook 2018–present envelope+O (Wikimedia)
 *  - zoom.svg          — Zoom Communications 2022 (Wikimedia, #0B5CFF)
 *  - google-meet.svg   — Google Meet 2020 camera (Wikimedia)
 *  - chrome.svg        — Google Chrome 2022 (Wikimedia)
 *  - (chrome_extension = chrome + puzzle badge)
 */

import * as React from "react";

// ---------------------------------------------------------------------------
// Tile — keeps sizing consistent across all logos.
// ---------------------------------------------------------------------------

function Tile({
  bg,
  border,
  children,
  size = 44,
}: {
  bg: string;
  border: string;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, background: bg, borderColor: border }}
      className="shrink-0 rounded-xl border flex items-center justify-center overflow-hidden"
    >
      {children}
    </div>
  );
}

function BrandImg({
  src,
  alt,
  size = 26,
  style,
}: {
  src: string;
  alt: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Individual brand logos — now using the original uploaded assets.
// ---------------------------------------------------------------------------

export function HubSpotLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#FFF0EB" border="#FFD5C8">
      <BrandImg src="/brand/hubspot.svg" alt="HubSpot" size={size + 6} />
    </Tile>
  );
}

export function HubSpotSprocketIcon({ size = 20 }: { size?: number }) {
  return <BrandImg src="/brand/hubspot.svg" alt="HubSpot" size={size} />;
}

export function SalesforceLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#E6F6FF" border="#BFE8FF">
      <BrandImg src="/brand/salesforce.svg" alt="Salesforce" size={size + 10} style={{ objectFit: "contain" }} />
    </Tile>
  );
}

export function TeamsLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#EDE8FF" border="#D8D0FF">
      <BrandImg src="/brand/teams.svg" alt="Microsoft Teams" size={size + 8} />
    </Tile>
  );
}

export function SlackLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#FFF0F5" border="#FFD6E8">
      <BrandImg src="/brand/slack.png" alt="Slack" size={size + 4} />
    </Tile>
  );
}

export function SlackHashIcon({ size = 20 }: { size?: number }) {
  return <BrandImg src="/brand/slack.png" alt="Slack" size={size} />;
}

export function GoogleCalendarLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#EAF2FF" border="#C9DDFF">
      <BrandImg src="/brand/google-calendar.svg" alt="Google Calendar" size={size + 6} />
    </Tile>
  );
}

export function OutlookLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#E6F0FF" border="#B8D4FF">
      <BrandImg src="/brand/outlook.svg" alt="Outlook Calendar" size={size + 8} />
    </Tile>
  );
}

export function ZoomLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#E8EFFF" border="#C3D4FF">
      <BrandImg src="/brand/zoom.svg" alt="Zoom" size={size + 6} />
    </Tile>
  );
}

export function GoogleMeetLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#E8F5E9" border="#C8E6C9">
      <BrandImg src="/brand/google-meet.svg" alt="Google Meet" size={size + 6} />
    </Tile>
  );
}

export function ChromeLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#FFF8E1" border="#FFE9A8">
      <BrandImg src="/brand/chrome.svg" alt="Chrome" size={size + 6} />
    </Tile>
  );
}

export function ChromeExtensionLogo({ size = 22 }: { size?: number }) {
  // Chrome + puzzle badge — matches the user's uploaded Chrome extension image
  // (Chrome logo + blue puzzle piece, without the softwarekeep watermark).
  return (
    <Tile bg="#FFF8E1" border="#FFE9A8">
      <div className="relative" style={{ width: size + 6, height: size + 6 }}>
        <BrandImg src="/brand/chrome.svg" alt="Chrome" size={size + 6} />
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-[#4285F4] border-2 border-white flex items-center justify-center shadow-sm"
          style={{ width: 16, height: 16 }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19.5 11.5a2.5 2.5 0 0 0-2.5-2.5h-1V7.5A2.5 2.5 0 0 0 13.5 5h-1A2.5 2.5 0 0 0 10 7.5V9H8.5A2.5 2.5 0 0 0 6 11.5v1A2.5 2.5 0 0 0 8.5 15H10v1.5A2.5 2.5 0 0 0 12.5 19h1a2.5 2.5 0 0 0 2.5-2.5V15h1.5A2.5 2.5 0 0 0 20 12.5v-1Z"
              fill="white"
            />
          </svg>
        </span>
      </div>
    </Tile>
  );
}

export function ZapierLogo({ size = 22 }: { size?: number }) {
  return (
    <Tile bg="#FFF1E6" border="#FFD5B8">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zapier logo">
        <rect width="32" height="32" rx="6" fill="#FF4A00" />
        <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle" fontSize="6" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" fill="white" letterSpacing="-0.5">
          Zapier
        </text>
      </svg>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Mapping + dispatch: use everywhere cards render an integration icon.
// ---------------------------------------------------------------------------

export type BrandId =
  | "hubspot"
  | "salesforce"
  | "teams"
  | "slack"
  | "google_calendar"
  | "outlook_calendar"
  | "zoom"
  | "google_meet"
  | "chrome_extension"
  | "zapier"
  | "rest_api"
  | "webhooks"
  | "sso";

export function BrandLogo({ id, size = 22 }: { id: BrandId | string; size?: number }) {
  switch (id) {
    case "hubspot":
      return <HubSpotLogo size={size} />;
    case "salesforce":
      return <SalesforceLogo size={size} />;
    case "teams":
      return <TeamsLogo size={size} />;
    case "slack":
      return <SlackLogo size={size} />;
    case "google_calendar":
      return <GoogleCalendarLogo size={size} />;
    case "outlook_calendar":
    case "outlook":
      return <OutlookLogo size={size} />;
    case "zoom":
      return <ZoomLogo size={size} />;
    case "google_meet":
      return <GoogleMeetLogo size={size} />;
    case "chrome_extension":
    case "chrome":
      return <ChromeExtensionLogo size={size} />;
    case "zapier":
      return <ZapierLogo size={size} />;
    default:
      return null;
  }
}
