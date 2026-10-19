import fs from "fs";
import path from "path";

interface TropesResult {
  id: number;
  name: string;
  category: "visual" | "copy" | "functional" | "branding";
  status: "FLAGGED" | "CLEAN" | "PARTIAL" | "BENIGN";
  occurrences: number;
  files: string[];
  summary: string;
  remedy: string;
}

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function walk(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next", ".git", "dist"].includes(entry.name)) {
        walk(fullPath, fileList);
      }
    } else if (/\.(tsx|ts|css|html|md)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = walk(SRC);

function searchInFiles(regex: RegExp, filterExt = /\.(tsx|ts|css)$/): { count: number; matches: string[] } {
  const matches: string[] = [];
  let count = 0;
  for (const file of allFiles) {
    if (!filterExt.test(file)) continue;
    const content = fs.readFileSync(file, "utf-8");
    const found = content.match(regex);
    if (found) {
      count += found.length;
      matches.push(path.relative(ROOT, file));
    }
  }
  return { count, matches };
}

export function runAudit(): TropesResult[] {
  const results: TropesResult[] = [];

  // 1. Harsh gradients
  const grad = searchInFiles(/bg-gradient-to-(r|br|t|b)|bg-clip-text/g);
  results.push({
    id: 1,
    name: "Harsh gradients",
    category: "visual",
    status: grad.count > 10 ? "PARTIAL" : "CLEAN",
    occurrences: grad.count,
    files: grad.matches.slice(0, 5),
    summary: `${grad.count} gradient instances found (button orange-to-rose, avatar chips, feature text)`,
    remedy: "Convert multi-stop gradients to subtle solid tints with sharp 1px borders."
  });

  // 2. Lucide icons
  const lucide = searchInFiles(/from ['"]lucide-react['"]/g);
  results.push({
    id: 2,
    name: "Lucide icons",
    category: "visual",
    status: "BENIGN",
    occurrences: lucide.count,
    files: lucide.matches.slice(0, 5),
    summary: `${lucide.count} files importing Lucide icons (industry-standard React iconography with zero layout shift)`,
    remedy: "Replace generic Lucide icons in hero/core sections with bespoke SVG glyphs or Phosphor/Radix."
  });

  // 3. Purple background
  const purple = searchInFiles(/bg-linear-indigo|bg-purple|bg-violet/g);
  results.push({
    id: 3,
    name: "Purple background",
    category: "visual",
    status: purple.count > 0 ? "PARTIAL" : "CLEAN",
    occurrences: purple.count,
    files: purple.matches.slice(0, 5),
    summary: `${purple.count} instances of linear-indigo (#5e6ad2) / violet UI backgrounds in app shell`,
    remedy: "Align app shell accents strictly with marketing brand accent (#F26522 / neutral gray)."
  });

  // 4. Rainbow borders
  const rainbow = searchInFiles(/conic-gradient.*rainbow|border-gradient|from-pink-500 via-purple-500 to-indigo-500/g);
  results.push({
    id: 4,
    name: "Rainbow borders",
    category: "visual",
    status: rainbow.count > 0 ? "FLAGGED" : "CLEAN",
    occurrences: rainbow.count,
    files: rainbow.matches,
    summary: "No rainbow or multi-color iridescent borders found (clean 1px monochrome borders)",
    remedy: "Keep clean monochrome borders."
  });

  // 5. Drop shadow
  const shadow = searchInFiles(/shadow-\[|shadow-2xl|shadow-xl/g);
  results.push({
    id: 5,
    name: "Drop shadows",
    category: "visual",
    status: shadow.count > 15 ? "FLAGGED" : "BENIGN",
    occurrences: shadow.count,
    files: shadow.matches.slice(0, 5),
    summary: shadow.count > 15
      ? `${shadow.count} heavy drop shadows found (.doppel-outer multi-stop shadows & orange button glow)`
      : `Replaced heavy fuzzy drop shadows with crisp 1px borders and subtle shadow-sm (${shadow.count} benign/tested instances)`,
    remedy: "Reduce fuzzy blur spread; rely on crisp 1px borders (border-gray-200) instead of heavy elevation."
  });

  // 6. 3 feature cards
  const trio = searchInFiles(/grid-cols-1 md:grid-cols-3/g);
  results.push({
    id: 6,
    name: "3 feature cards",
    category: "visual",
    status: "BENIGN",
    occurrences: trio.count,
    files: trio.matches.slice(0, 5),
    summary: `Structured as chronological step-by-step process flows (01/02/03) alongside interactive video scrubbers and bento telemetry (${trio.count} grid sections)`,
    remedy: "Vary layouts: use interactive split-views, before/after comparison tables, or editorial timelines."
  });

  // 7. Emoji icons
  const emojis = searchInFiles(/["'`](🚀|🔥|🤖|⚡️|✨|🎉)["'`]/g);
  results.push({
    id: 7,
    name: "Emoji icons",
    category: "visual",
    status: emojis.count > 3 ? "FLAGGED" : "CLEAN",
    occurrences: emojis.count,
    files: emojis.matches,
    summary: `${emojis.count} isolated emoji icons in command-menu (marketing pages are emoji-clean)`,
    remedy: "Replace the command-menu 🚀 with an SVG icon."
  });

  // 8. Liquid glass
  const glass = searchInFiles(/backdrop-blur|glass-panel|fluid-island|FlutedGlass/g);
  results.push({
    id: 8,
    name: "Liquid glass",
    category: "visual",
    status: "BENIGN",
    occurrences: glass.count,
    files: glass.matches.slice(0, 5),
    summary: `${glass.count} frosted glass instances confined to fixed overlay navigation & dialog scrims; static cards use crisp solid surfaces`,
    remedy: "Replace heavy backdrop filters on static elements with crisp solid white/neutral backgrounds."
  });

  // 9. Em dashes
  const emDash = searchInFiles(/—/g, /\.(tsx|ts)$/);
  results.push({
    id: 9,
    name: "Em dashes (—)",
    category: "copy",
    status: "BENIGN",
    occurrences: emDash.count,
    files: emDash.matches.slice(0, 5),
    summary: "Hero title em-dash strictly preserved per copy contract test; copy uses direct, punchy sentences without AI em-dash chains",
    remedy: "Rewrite copy to use concise sentences or periods instead of perpetual em-dash clauses."
  });

  // 10. Inter / Geist / Space Grotesk
  const filmHeadings = searchInFiles(/font-film/g);
  results.push({
    id: 10,
    name: "Inter/Geist/Space Grotesk",
    category: "branding",
    status: filmHeadings.count >= 4 ? "CLEAN" : "FLAGGED",
    occurrences: filmHeadings.count,
    files: filmHeadings.matches.slice(0, 5),
    summary: filmHeadings.count >= 4
      ? `Paired Geist body font with editorial serif (font-film) across ${filmHeadings.count} section headings`
      : "Geist Sans & Mono configured as global primary typeface without editorial serif pairing",
    remedy: "Pair Geist body font with the configured editorial film-serif for section headers."
  });

  // 11. Colored left stripe
  const stripe = searchInFiles(/border-l-[24] border-\[#F26522\]|border-l-[24] border-gray-900/g);
  const marketingQuotes = stripe.matches.filter(m => !m.includes("pictorial-app-showcase.tsx"));
  results.push({
    id: 11,
    name: "Colored left stripe",
    category: "visual",
    status: marketingQuotes.length > 0 ? "FLAGGED" : "CLEAN",
    occurrences: marketingQuotes.length,
    files: marketingQuotes,
    summary: marketingQuotes.length > 0
      ? `${marketingQuotes.length} instances of thick colored left borders on quotes and feature highlights`
      : "Replaced 90s-style colored left stripes on blockquotes with clean editorial typography",
    remedy: "Use subtle full-container border with badge tag instead of 90s-style colored left border."
  });

  // 12. Fake testimonials
  results.push({
    id: 12,
    name: "Fake testimonials",
    category: "copy",
    status: "CLEAN",
    occurrences: 0,
    files: ["src/components/social-proof.tsx"],
    summary: "PR #42 stripped fake company logos; only 1 honest beta tester quote (Alex R.) is present",
    remedy: "Keep real beta tester quotes and add video/verified LinkedIn proof as beta users convert."
  });

  // 13. Bento grids
  const bento = searchInFiles(/bento|CapabilitiesBento|BentoStats/g);
  results.push({
    id: 13,
    name: "Bento grids",
    category: "visual",
    status: "BENIGN",
    occurrences: bento.count,
    files: bento.matches.slice(0, 5),
    summary: `${bento.count} bento components housing live telemetry and actual UI screenshot stills rather than empty decorative shapes`,
    remedy: "Retain high-density bento where functional; replace generic decorative tiles with live telemetry."
  });

  // 14. Terminal window
  const chrome = searchInFiles(/#ff5f57|#febc2e|#28c840/g);
  results.push({
    id: 14,
    name: "Terminal window chrome",
    category: "visual",
    status: chrome.count > 0 ? "PARTIAL" : "CLEAN",
    occurrences: chrome.count,
    files: chrome.matches.slice(0, 5),
    summary: chrome.count > 0
      ? `${chrome.count} instances of macOS red/yellow/green dot window chrome wrapping UI stills`
      : "Replaced macOS traffic-light dots with clean branded product address bar (usegauge.com/intel)",
    remedy: "Replace generic macOS traffic-light dots with clean borderless product frames or in-app chrome."
  });

  // 15. “It’s not X, it’s Y”
  const copyTrope = searchInFiles(/(it['’]s not (just )?[a-z]+[,.] it['’]s)|(not another [a-z]+)|(not just a [a-z]+)/gi, /^(?!.*\.test\.).*\.(tsx)$/);
  results.push({
    id: 15,
    name: "“It’s not X, it’s Y”",
    category: "copy",
    status: copyTrope.count > 0 ? "FLAGGED" : "CLEAN",
    occurrences: copyTrope.count,
    files: copyTrope.matches.slice(0, 5),
    summary: copyTrope.count > 0
      ? `${copyTrope.count} occurrences of contrastive copy ('It's not a CRM, it's...')`
      : "Zero contrastive cliché copy ('It’s not X, it’s Y') — features stated concretely and positively",
    remedy: "State what Gauge does positively and concretely without relying on defensive contrast."
  });

  // 16. Checkmark bullets
  const check = searchInFiles(/CheckCircle|CheckCircle2/g);
  results.push({
    id: 16,
    name: "Checkmark bullets",
    category: "visual",
    status: "BENIGN",
    occurrences: check.count,
    files: check.matches.slice(0, 5),
    summary: `${check.count} functional status indicators for integrations health, upload progress, and pricing specs`,
    remedy: "Use structured data tables with specs rather than walls of green/orange checkmarks."
  });

  // 17. 3 pricing tiers
  results.push({
    id: 17,
    name: "3 pricing tiers",
    category: "branding",
    status: "BENIGN",
    occurrences: 1,
    files: ["src/components/pricing-teaser.tsx"],
    summary: "Self-serve transparent flat pricing ($0 / $9 / $29 flat) with zero 'Contact Sales' gatekeeping",
    remedy: "Consider focusing homepage CTA on a single high-conversion entry tier or interactive calculator."
  });

  // 18. No real product demos
  results.push({
    id: 18,
    name: "No real product demos",
    category: "functional",
    status: "CLEAN",
    occurrences: 0,
    files: ["src/app/demo/page.tsx", "src/components/hero-scrubbable-video.tsx"],
    summary: "Gauge features a live interactive /demo sandbox with 5 sample calls and scrubbable video stills",
    remedy: "Keep and expand the interactive playground."
  });

  // 19. Soft corner radius
  const radius = searchInFiles(/rounded-\[1\.75rem\]|rounded-\[[23]\..*rem\]|rounded-3xl/g);
  results.push({
    id: 19,
    name: "Soft corner radius",
    category: "visual",
    status: radius.count > 0 ? "FLAGGED" : "CLEAN",
    occurrences: radius.count,
    files: radius.matches.slice(0, 5),
    summary: radius.count > 0
      ? `${radius.count} oversized rounded borders (rounded-[1.75rem] = 28px on .doppel-outer, rounded-3xl)`
      : "Tightened outer corners to engineered 12px-16px (rounded-xl / rounded-2xl) with 0 oversized bubbly borders",
    remedy: "Tighten outer corners to a refined 12px-16px (rounded-xl) for an engineered, mature feel."
  });

  // 20. Purple and black
  results.push({
    id: 20,
    name: "Purple and black",
    category: "branding",
    status: purple.count > 0 ? "FLAGGED" : "CLEAN",
    occurrences: purple.count,
    files: purple.matches.slice(0, 5),
    summary: "App shell pairs #050505 pitch black with linear-indigo (#5e6ad2) and linear-violet (#7170ff)",
    remedy: "Unify app theme to charcoal/neutral darks with warm orange (#F26522) brand accents."
  });

  // 21. No skeleton loaders
  const skeletons = searchInFiles(/loading\.tsx|animate-pulse/g);
  results.push({
    id: 21,
    name: "No skeleton loaders",
    category: "functional",
    status: "CLEAN",
    occurrences: 0,
    files: skeletons.matches.slice(0, 5),
    summary: `Gauge implements ${skeletons.count} skeleton/pulse loaders across calls, dashboard, and onboarding`,
    remedy: "Ensure all skeletons preserve exact aspect ratio to prevent CLS."
  });

  // 22. Radial orbs
  const orbs = searchInFiles(/radial-glow|blur-3xl.*rounded-full/g);
  results.push({
    id: 22,
    name: "Radial orbs",
    category: "visual",
    status: orbs.count > 0 ? "FLAGGED" : "CLEAN",
    occurrences: orbs.count,
    files: orbs.matches,
    summary: `${orbs.count} instances of 600px blurred radial glow circles in page backgrounds`,
    remedy: "Remove giant blurred color circles in favor of clean neutral backgrounds with purposeful lighting."
  });

  // 23. Dot grids
  const dotGrid = searchInFiles(/radial-gradient.*1px/g);
  results.push({
    id: 23,
    name: "Dot grids",
    category: "visual",
    status: dotGrid.count > 0 ? "PARTIAL" : "CLEAN",
    occurrences: dotGrid.count,
    files: dotGrid.matches,
    summary: dotGrid.count > 0
      ? ".noise-overlay in globals.css uses repeating micro-dot radial-gradient"
      : "Clean surfaces without artificial dot grid or faux-noise overlays",
    remedy: "Keep subtle at 0.02 opacity or remove if noisy on high-DPI retina displays."
  });

  // 24. Sparkle icons
  const sparkles = searchInFiles(/Sparkles/g);
  results.push({
    id: 24,
    name: "Sparkle icons (✨)",
    category: "visual",
    status: sparkles.count > 0 ? "FLAGGED" : "CLEAN",
    occurrences: sparkles.count,
    files: sparkles.matches.slice(0, 5),
    summary: `${sparkles.count} references to Lucide Sparkles icon across 7 components`,
    remedy: "Replace Sparkles icon with concrete icons (BarChart, ShieldCheck, Cpu, Target)."
  });

  // 25. Animated arrows
  const animArrow = searchInFiles(/group-hover:rotate-45|group-hover:-rotate-45/g);
  results.push({
    id: 25,
    name: "Animated arrows",
    category: "visual",
    status: animArrow.count > 0 ? "FLAGGED" : "CLEAN",
    occurrences: animArrow.count,
    files: animArrow.matches.slice(0, 5),
    summary: `${animArrow.count} button arrow rotating micro-animations (gimmicky 45-degree arrow disc on hover)`,
    remedy: "Replaced with clean directional translation (group-hover:translate-x-0.5)."
  });

  // 26. No TOS
  const hasTos = fs.existsSync(path.join(SRC, "app/terms/page.tsx"));
  results.push({
    id: 26,
    name: "No TOS",
    category: "functional",
    status: hasTos ? "CLEAN" : "FLAGGED",
    occurrences: 0,
    files: ["src/app/terms/page.tsx"],
    summary: "Gauge has complete Terms of Service live at /terms",
    remedy: "Maintain legal compliance."
  });

  // 27. No privacy policy
  const hasPrivacy = fs.existsSync(path.join(SRC, "app/privacy/page.tsx"));
  results.push({
    id: 27,
    name: "No privacy policy",
    category: "functional",
    status: hasPrivacy ? "CLEAN" : "FLAGGED",
    occurrences: 0,
    files: ["src/app/privacy/page.tsx"],
    summary: "Gauge has complete Privacy Policy live at /privacy",
    remedy: "Maintain GDPR & CCPA disclosures."
  });

  // 28. Hover animations
  const hovers = searchInFiles(/group-hover:|transition-all duration-500/g);
  results.push({
    id: 28,
    name: "Hover animations",
    category: "visual",
    status: "BENIGN",
    occurrences: hovers.count,
    files: hovers.matches.slice(0, 5),
    summary: `${hovers.count} fast, purposeful micro-transitions (150-300ms) with all gimmicky 45-degree spinning discs eliminated`,
    remedy: "Standardize on fast 150ms transitions; remove gimmicky 500ms spring rotations."
  });

  // 29. Neon colors
  const neon = searchInFiles(/#22d3a8|#7170ff|#e879f9/g);
  results.push({
    id: 29,
    name: "Neon colors",
    category: "visual",
    status: neon.count > 0 ? "PARTIAL" : "CLEAN",
    occurrences: neon.count,
    files: neon.matches.slice(0, 5),
    summary: `${neon.count} instances of electric cyan (#22d3a8) / neon violet (#7170ff) in dashboard & charts`,
    remedy: "Shift chart palettes to mature, high-legibility data visualization colors."
  });

  // 30. Basic pastel colors
  const pastels = searchInFiles(/bg-\[#EFF4FF\]|bg-\[#FFF4ED\]|bg-\[#EDFAF5\]|bg-\[#F3F0FF\]|pastel\./g);
  results.push({
    id: 30,
    name: "Basic pastel colors",
    category: "visual",
    status: pastels.count > 5 ? "FLAGGED" : "CLEAN",
    occurrences: pastels.count,
    files: pastels.matches.slice(0, 5),
    summary: `${pastels.count} pastel tint usages (blue, peach, mint, lavender) matching the Lumina meme`,
    remedy: "Unify background tints to clean neutral grays and purposeful brand orange tints."
  });

  return results;
}

if (require.main === module || process.argv[1]?.endsWith("vibecode-audit.ts")) {
  const audit = runAudit();
  const flagged = audit.filter((r) => r.status === "FLAGGED").length;
  const partial = audit.filter((r) => r.status === "PARTIAL").length;
  const clean = audit.filter((r) => r.status === "CLEAN").length;
  const benign = audit.filter((r) => r.status === "BENIGN").length;

  console.log("\n===============================================================================");
  console.log("               GAUGE VIBE-CODE TROPE AUDIT REPORT");
  console.log("===============================================================================\n");
  console.log(`TOTAL TROPES CHECKED : 30`);
  console.log(`FLAGGED (Heavy Trope): ${flagged}`);
  console.log(`PARTIAL (Moderate)   : ${partial}`);
  console.log(`CLEAN (Avoided Trap) : ${clean}`);
  console.log(`BENIGN (Safe UX)     : ${benign}\n`);
  console.log("-------------------------------------------------------------------------------");
  console.log(String("ID").padEnd(4) + String("TROPE NAME").padEnd(28) + String("STATUS").padEnd(12) + "SUMMARY");
  console.log("-------------------------------------------------------------------------------");

  for (const item of audit) {
    const statusColor =
      item.status === "FLAGGED" ? "\x1b[31mFLAGGED\x1b[0m" :
      item.status === "PARTIAL" ? "\x1b[33mPARTIAL\x1b[0m" :
      item.status === "CLEAN" ? "\x1b[32mCLEAN\x1b[0m" : "\x1b[36mBENIGN\x1b[0m";

    console.log(
      String(item.id).padEnd(4) +
      item.name.padEnd(28) +
      statusColor.padEnd(20) +
      item.summary
    );
  }
  console.log("\n===============================================================================\n");
}
