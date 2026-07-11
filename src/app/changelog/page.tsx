import Nav from "@/components/nav";
import { Sparkles } from "lucide-react";
import fs from "fs";
import path from "path";

export const metadata = {
  title: "Changelog — CallNote Pro",
  description: "Every notable change to CallNote Pro, from security fixes to new features. Follows Keep a Changelog format.",
};

interface ChangelogEntry {
  version: string;
  date: string;
  sections: { heading: string; items: string[] }[];
}

function parseChangelog(md: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;
  let currentSection: { heading: string; items: string[] } | null = null;

  for (const line of md.split("\n")) {
    // Version header: "## [Unreleased]" or "## [PRs #88-#100] — 2026-06-21 → 2026-06-25"
    const versionMatch = line.match(/^## \[([^\]]+)\](?:\s*[—–-]\s*(.*))?$/);
    if (versionMatch) {
      if (currentEntry) {
        if (currentSection) currentEntry.sections.push(currentSection);
        entries.push(currentEntry);
      }
      currentEntry = { version: versionMatch[1], date: versionMatch[2] || "", sections: [] };
      currentSection = null;
      continue;
    }

    // Section header: "### Added", "### Fixed", etc.
    const sectionMatch = line.match(/^### (.+)$/);
    if (sectionMatch) {
      if (currentSection && currentEntry) currentEntry.sections.push(currentSection);
      currentSection = { heading: sectionMatch[1], items: [] };
      continue;
    }

    // List item: "- **text** or just text"
    const itemMatch = line.match(/^- (.+)$/);
    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1]);
      continue;
    }
  }

  if (currentEntry) {
    if (currentSection) currentEntry.sections.push(currentSection);
    entries.push(currentEntry);
  }

  return entries;
}

export default function ChangelogPage() {
  const changelogPath = path.resolve(process.cwd(), "CHANGELOG.md");
  const raw = fs.readFileSync(changelogPath, "utf-8");
  const entries = parseChangelog(raw);

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-white text-zinc-900">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="eyebrow inline-flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F26522]/10 text-[#F26522] text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Changelog
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-3">What&apos;s new in CallNote Pro</h1>
          <p className="text-zinc-500 text-lg mb-12">
            Every notable change — security fixes, new features, improvements. Follows{" "}
            <a href="https://keepachangelog.com" className="text-[#F26522] hover:underline">
              Keep a Changelog
            </a>{" "}
            format.
          </p>

          <div className="space-y-12">
            {entries.map((entry) => (
              <div key={entry.version} className="doppel-outer">
                <div className="doppel-inner p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-semibold">{entry.version}</h2>
                    {entry.date && (
                      <span className="text-sm text-zinc-500">{entry.date}</span>
                    )}
                  </div>

                  <div className="space-y-6">
                    {entry.sections.map((section) => (
                      <div key={section.heading}>
                        <h3 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider mb-3">
                          {section.heading}
                        </h3>
                        <ul className="space-y-2">
                          {section.items.map((item, i) => (
                            <li key={i} className="text-sm text-zinc-600 leading-relaxed pl-4 border-l-2 border-zinc-200">
                              <span dangerouslySetInnerHTML={{
                                __html: item
                                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-900">$1</strong>')
                                  .replace(/\((#\d+)\)/g, '<span class="text-[#F26522] text-xs">($1)</span>')
                              }} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-zinc-400 mt-12">
            See{" "}
            <a href="https://github.com/Poilsarr/sales-call-notes/commits/main" className="text-[#F26522] hover:underline">
              git log
            </a>{" "}
            for the full commit history.
          </p>
        </div>
      </div>
    </>
  );
}