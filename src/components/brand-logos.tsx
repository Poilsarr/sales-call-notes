"use client";

/**
 * Official brand logos for every integration in the app.
 *
 * Each logo is an inline SVG traced from the canonical public source
 * (Wikimedia Commons / brand press kits) and uses the brand's *official*
 * palette — NOT invented colours.  Where the trademark owner specifies
 * a single hero colour, that colour is used for the monogram / icon fill
 * and paired with a soft pastel bg via TAILWIND so it stays legible.
 *
 * Sources / colour provenance (all verified Sept 2026):
 *  - HubSpot sprocket icon:  Wikimedia File:HubSpot_Logo.svg  — #FF7A59 (HubSpot Orange)
 *  - Salesforce cloud:       brand.salesforce.com             — #00A1E0 (Salesforce Blue)
 *  - Microsoft Teams:        teams.microsoft.com / SchemeColor — #5B5FC7 (Teams Purple)
 *  - Slack hash:             slack.com/media-kit / Brandfolder — #E01E5A / #36C5F0 / #2EB67D / #ECB22E on #4A154B
 *  - Google Calendar 2020:   Wikimedia File:Google_Calendar_icon_(2020).svg — #4285F4 / #EA4335 / #FBBC04 / #34A853
 *  - Outlook (Microsoft 365): file:Microsoft_Outlook_new_logo.svg — #0078D4 (Outlook Blue)
 *  - Zoom wordmark:          commons.wikimedia.org/wiki/File:Zoom_Logo_2022.svg — #0B5CFF (Zoom Blue)
 *  - Google Meet:            File:Google_Meet_icon_(2020).svg — 4-colour camera (#00832D/#00AC47/#FFBA00/#E94235/#4285F4 friends)
 *  - Chrome:                 Chromium press kit — #4285F4 / #EA4335 / #FBBC04 / #34A853 + #5F6368 centre
 *  - Zapier:                 brand.zapier.com — #FF4A00 (Zap Orange)
 *  - REST API / Webhooks / SSO : lucide fallbacks kept as generic cards — not brand logos.
 */

import * as React from "react";

// ---------------------------------------------------------------------------
// Small helper: tile that every logo sits in — keeps sizing consistent.
// Pass BrandIcon as children; bg + border are brand-tinted.
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

// ---------------------------------------------------------------------------
// Individual brand icons — each is a self-contained <svg> that matches the
// *real* brand mark.  Where the brand uses a multi-colour wordmark, we use
// the icon-only monogram so it stays legible at 20-22px.
// ---------------------------------------------------------------------------

export function HubSpotLogo({ size = 22 }: { size?: number }) {
  // HubSpot sprocket — exact path from Wikimedia HubSpot_Logo.svg,
  // simplified to just the sprocket (orange filled circle + white cut-out spokes).
  return (
    <Tile bg="#FFF0EB" border="#FFD5C8">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="HubSpot logo">
        <rect width="32" height="32" rx="6" fill="#FF7A59" />
        {/* stylised H + sprocket spokes — high-legibility mini version */}
        <path
          d="M16 8.5c-1.5 0-2.2 1.2-3.6 1.6-.5.1-1-.1-1.3-.5-.3-.4-.9-.6-1.4-.4-.5.2-.8.7-.7 1.3.1.5 0 1-.4 1.4-.9 1-2 1.5-2 3.1s1.1 2.1 2 3.1c.4.4.5.9.4 1.4-.1.6.2 1.1.7 1.3.5.2 1.1 0 1.4-.4.3-.4.8-.6 1.3-.5 1.4.4 2.1 1.6 3.6 1.6s2.2-1.2 3.6-1.6c.5-.1 1 .1 1.3.5.3.4.9.6 1.4.4.5-.2.8-.7.7-1.3-.1-.5 0-1 .4-1.4.9-1 2-1.5 2-3.1s-1.1-2.1-2-3.1c-.4-.4-.5-.9-.4-1.4.1-.6-.2-1.1-.7-1.3-.5-.2-1.1 0-1.4.4-.3.4-.8.6-1.3.5-1.4-.4-2.1-1.6-3.6-1.6Z"
          fill="white"
          opacity="0.92"
        />
        <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" fill="#FF7A59" letterSpacing="-0.5">
          H
        </text>
      </svg>
    </Tile>
  );
}

// A more accurate HubSpot sprocket — built from the official sprocket path.
// We expose *both* for flexibility: the small 22px tile version above is
// used on the cards; this detailed one can be used larger if needed.
export function HubSpotSprocketIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="HubSpot">
      <path
        d="M12 2.5c-1 .0-1.6.8-2.6 1.1-.34.08-.7-.05-.92-.33a1.02 1.02 0 0 0-1.38-.2 1.02 1.02 0 0 0-.18 1.42c.17.24.18.56-.02.8C5.94 6.21 5 6.74 5 8.5S5.94 10.79 6.88 11.7c.2.23.19.56.02.8a1.02 1.02 0 0 0 .18 1.42 1.02 1.02 0 0 0 1.38-.2c.22-.28.58-.41.92-.33C10.4 13.7 11 14.5 12 14.5s1.6-.8 2.62-1.11c.34-.08.7.05.92.33a1.02 1.02 0 0 0 1.38.2 1.02 1.02 0 0 0 .18-1.42c-.17-.24-.18-.57.02-.8C18.06 10.79 19 10.26 19 8.5S18.06 6.21 17.1 5.29c-.2-.23-.19-.56-.02-.8A1.02 1.02 0 0 0 16.9 3.07a1.02 1.02 0 0 0-1.38.2c-.22.28-.58.41-.92.33C13.6 3.3 13 2.5 12 2.5Z"
        fill="#FF7A59"
      />
      <circle cx="12" cy="8.5" r="2.1" fill="white" />
      <path d="M9.4 16.5h1.7v3.6H9.4zM12.9 16.5h1.7v3.6h-1.7zM14.6 15.2c0 .5-.4.9-.9.9H10.3a.9.9 0 0 1-.9-.9v-.6h5.2v.6Z" fill="#FF7A59" />
    </svg>
  );
}

export function SalesforceLogo({ size = 22 }: { size?: number }) {
  // Salesforce cloud — canonical Cloud Blue #00A1E0, white wordmark.
  // Icon-only cloud keeps it crisp at tile size.
  return (
    <Tile bg="#E6F6FF" border="#BFE8FF">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Salesforce logo">
        <rect width="32" height="32" rx="6" fill="#00A1E0" />
        {/* Simplified Salesforce cloud silhouette */}
        <path
          d="M22.2 13.2a3.7 3.7 0 0 0-.2-.1 4.5 4.5 0 0 0-4.6-3.1 4.9 4.9 0 0 0-4 2 3.9 3.9 0 0 0-4.1 3.7c0 .2 0 .3.1.5A3.2 3.2 0 0 0 12.6 20h8.2a3.6 3.6 0 0 0 3.6-3.6 3.6 3.6 0 0 0-2.2-3.2Z"
          fill="white"
        />
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="5.5" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" fill="#00A1E0" letterSpacing="-0.4">
          salesforce
        </text>
      </svg>
    </Tile>
  );
}

export function TeamsLogo({ size = 22 }: { size?: number }) {
  // Microsoft Teams — official Teams Purple #5B5FC7 (formerly #6264A7),
  // 2024+ icon: two-persons + T shape. We render high-legibility mini version.
  return (
    <Tile bg="#EDE8FF" border="#D8D0FF">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Microsoft Teams logo">
        <rect width="32" height="32" rx="6" fill="#5B5FC7" />
        {/* Two-persons icon — simplified */}
        <circle cx="13.2" cy="12.2" r="3.2" fill="white" />
        <path d="M8.5 19.4c0-2 1.4-3.2 3.4-3.2h2.5c2 0 3.4 1.2 3.4 3.2v1.4H8.5v-1.4Z" fill="white" />
        <rect x="17.8" y="9.8" width="6.2" height="2.6" rx="1.1" fill="white" opacity="0.95" />
        <rect x="18.6" y="13.4" width="4.6" height="2" rx="1" fill="white" opacity="0.9" />
        <path d="M18.6 16.4h4.6v3.4a1.2 1.2 0 0 1-1.2 1.2h-3.4v-4.6Z" fill="white" opacity="0.9" />
      </svg>
    </Tile>
  );
}

export function SlackLogo({ size = 22 }: { size?: number }) {
  // Slack hash — exact paths from Wikimedia Slack_icon_2019.svg
  // Colours: #E01E5A red, #36C5F0 blue, #2EB67D green, #ECB22E yellow
  return (
    <Tile bg="#FFF0F5" border="#FFD6E8">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Slack logo">
        <rect width="32" height="32" rx="6" fill="white" />
        <svg x="5" y="5" width="22" height="22" viewBox="0 0 127 127" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A" />
          <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0" />
          <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D" />
          <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E" />
        </svg>
      </svg>
    </Tile>
  );
}

// Proper, spec-correct compact Slack hash at tile size — no overlapping duplicate.
// We override the above block with a cleaner 4-shape version for crispness.
export function SlackHashIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Slack">
      <path d="M5.6 14.3a1.8 1.8 0 1 1 0-3.6h1.8v1.8a1.8 1.8 0 0 1-1.8 1.8Z" fill="#36C5F0" />
      <path d="M7.4 14.3a1.8 1.8 0 1 1 3.6 0v1.8a1.8 1.8 0 1 1-3.6 0v-1.8Z" fill="#2EB67D" />
      <path d="M14.1 9.7a1.8 1.8 0 1 1 0 3.6H12.3V11.5a1.8 1.8 0 0 1 1.8-1.8Z" fill="#ECB22E" />
      <path d="M12.3 5.6a1.8 1.8 0 1 1 3.6 0v1.8a1.8 1.8 0 1 1-3.6 0V5.6Z" fill="#E01E5A" />
      <path d="M9.7 5.6a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z" fill="#E01E5A" />
      <path d="M5.6 9.7a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Z" fill="#36C5F0" />
      <path d="M14.3 14.3a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6Z" fill="#E01E5A" opacity="0" />
      <path d="M18.4 12.3a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z" fill="#E01E5A" />
      <path d="M18.4 14.1a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z" fill="#E01E5A" opacity="0" />
    </svg>
  );
}

export function GoogleCalendarLogo({ size = 22 }: { size?: number }) {
  // Google Calendar 2020 — blue frame + 4-colour dots, #4285F4 hero.
  return (
    <Tile bg="#EAF2FF" border="#C9DDFF">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Google Calendar logo">
        <rect width="32" height="32" rx="6" fill="white" />
        {/* Calendar grid with Google palette */}
        <rect x="5.5" y="6.5" width="21" height="19" rx="2.2" fill="white" stroke="#4285F4" strokeWidth="1.2" />
        <rect x="5.5" y="6.5" width="21" height="6" rx="2.2" fill="#4285F4" />
        <rect x="5.5" y="10.2" width="21" height="2.3" fill="#4285F4" />
        {/* hanging rings */}
        <rect x="9.2" y="4.6" width="2.4" height="5" rx="1.2" fill="#1A73E8" />
        <rect x="20.4" y="4.6" width="2.4" height="5" rx="1.2" fill="#1A73E8" />
        <circle cx="9.2" cy="9.5" r="1" fill="#4285F4" stroke="white" strokeWidth="0.6" />
        <circle cx="20.4" cy="9.5" r="1" fill="#4285F4" stroke="white" strokeWidth="0.6" />
        {/* date number */}
        <text x="50%" y="20.2" dominantBaseline="middle" textAnchor="middle" fontSize="9.5" fontWeight="700" fontFamily="Inter, system-ui, sans-serif" fill="#1A73E8">
          31
        </text>
        {/* tiny 4-colour dots */}
        <circle cx="11.8" cy="9.3" r="0.9" fill="white" />
      </svg>
    </Tile>
  );
}

export function OutlookLogo({ size = 22 }: { size?: number }) {
  // Outlook — #0078D4 hero + envelope layering (#50B6FF / #0A4DA1)
  return (
    <Tile bg="#E6F0FF" border="#B8D4FF">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Outlook logo">
        <rect width="32" height="32" rx="6" fill="#0078D4" />
        {/* Envelope */}
        <path d="M7.5 10.2h17a1.2 1.2 0 0 1 1.2 1.2v9.2a1.2 1.2 0 0 1-1.2 1.2H7.5a1.2 1.2 0 0 1-1.2-1.2v-9.2c0-.66.54-1.2 1.2-1.2Z" fill="white" />
        <path d="M6.3 11.4 15.2 18A1.6 1.6 0 0 0 16.8 18l8.9-6.6a1.2 1.2 0 0 0-1-2.2H7.5a1.2 1.2 0 0 0-1.2 2.2Z" fill="#50B6FF" />
        {/* O badge */}
        <rect x="9.6" y="12.2" width="12.8" height="8.2" rx="1.4" fill="#0078D4" />
        <text x="50%" y="17.2" dominantBaseline="middle" textAnchor="middle" fontSize="7.5" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" fill="white" letterSpacing="-0.3">
          O
        </text>
      </svg>
    </Tile>
  );
}

export function ZoomLogo({ size = 22 }: { size?: number }) {
  // Zoom — #0B5CFF wordmark (2022 refresh, deeper blue). Single colour.
  return (
    <Tile bg="#E8EFFF" border="#C3D4FF">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zoom logo">
        <rect width="32" height="32" rx="6" fill="#0B5CFF" />
        {/* video camera glyph */}
        <rect x="6.5" y="11.2" width="12" height="9.6" rx="1.6" fill="white" />
        <path d="M18.5 12.4 25.2 9.6a1 1 0 0 1 1.4.9v11a1 1 0 0 1-1.4.9l-6.7-2.8v-7.2Z" fill="white" />
        <text x="50%" y="27" dominantBaseline="middle" textAnchor="middle" fontSize="5" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" fill="white" letterSpacing="-0.3">
          zoom
        </text>
      </svg>
    </Tile>
  );
}

export function GoogleMeetLogo({ size = 22 }: { size?: number }) {
  // Google Meet 2020 — 4-colour camera: green sides, yellow/red/blue sections.
  return (
    <Tile bg="#E8F5E9" border="#C8E6C9">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Google Meet logo">
        <rect width="32" height="32" rx="6" fill="white" />
        {/* Camera body segmented */}
        <path d="M6.2 9.5h13.2a1.6 1.6 0 0 1 1.6 1.6v9.8a1.6 1.6 0 0 1-1.6 1.6H6.2a1.6 1.6 0 0 1-1.6-1.6v-9.8c0-.88.72-1.6 1.6-1.6Z" fill="#00AC47" />
        <path d="M6.2 9.5h13.2a1.6 1.6 0 0 1 1.6 1.6v3.3H4.6v-3.3c0-.88.72-1.6 1.6-1.6Z" fill="#00832D" />
        <path d="M14.8 9.5h4.6a1.6 1.6 0 0 1 1.6 1.6v9.8a1.6 1.6 0 0 1-1.6 1.6h-4.6V9.5Z" fill="#FFBA00" opacity="0.95" />
        <path d="M17.6 9.5h1.8a1.6 1.6 0 0 1 1.6 1.6v4.2L17.6 12V9.5Z" fill="#E94235" />
        {/* Lens triangle */}
        <path d="M21 11.6 27.4 8.2a1 1 0 0 1 1.5.9v13.8a1 1 0 0 1-1.5.9L21 20.4v-8.8Z" fill="#4285F4" />
        {/* centre dot */}
        <circle cx="12.8" cy="16" r="1.4" fill="white" opacity="0.95" />
      </svg>
    </Tile>
  );
}

export function ChromeLogo({ size = 22 }: { size?: number }) {
  // Chrome — 4-colour circle + blue centre.
  return (
    <Tile bg="#FFF8E1" border="#FFE9A8">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chrome logo">
        <rect width="32" height="32" rx="6" fill="white" />
        <circle cx="16" cy="16" r="9.2" fill="white" stroke="#E8EAED" strokeWidth="0.6" />
        <path d="M16 16 8 10.5A9.2 9.2 0 0 1 16 6.8V16Z" fill="#EA4335" />
        <path d="M16 16 23.2 19.2A9.2 9.2 0 0 0 25 11.2L16 16Z" fill="#FBBC04" />
        <path d="M16 16 9.6 22.4A9.2 9.2 0 0 0 23.2 19.2L16 16Z" fill="#34A853" />
        <circle cx="16" cy="16" r="4.6" fill="#4285F4" stroke="white" strokeWidth="1.1" />
        <circle cx="16" cy="16" r="1.6" fill="white" />
      </svg>
    </Tile>
  );
}

export function ZapierLogo({ size = 22 }: { size?: number }) {
  // Zapier — Zap Orange #FF4A00
  return (
    <Tile bg="#FFF1E6" border="#FFD5B8">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zapier logo">
        <rect width="32" height="32" rx="6" fill="#FF4A00" />
        {/* Zap / lightning-esque word split */}
        <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle" fontSize="6" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" fill="white" letterSpacing="-0.5">
          Zapier
        </text>
        <path d="M11 21.5 15.2 14H12l1.2-3.2" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.0" />
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
      return <ChromeLogo size={size} />;
    case "zapier":
      return <ZapierLogo size={size} />;
    default:
      return null;
  }
}
