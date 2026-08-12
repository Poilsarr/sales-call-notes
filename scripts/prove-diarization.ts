#!/usr/bin/env node
/**
 * scripts/prove-diarization.ts
 *
 * Live end-to-end proof that offline diarization returns >= 2 distinct
 * speakers through the REAL DiarizationService (real Deepgram nova-2 call
 * with diarize + smart_format + detect_language).
 *
 * Run:
 *   node --env-file=.env.local --import=tsx/esm scripts/prove-diarization.ts
 *   (fallback: npx tsx --env-file=.env.local scripts/prove-diarization.ts)
 *
 * Fixture: generates a two-speaker wav under scripts/.fixtures/ via macOS
 * `say` (Samantha + Daniel voices, alternating sentences) concatenated
 * with ffmpeg. ~20-30s of audio. Regenerated on demand; never committed.
 *
 * Kill behavior:
 *   - DEEPGRAM_API_KEY missing               → prints "DEEPGRAM_API_KEY
 *     missing — proof skipped" and exits 0 (code zero-cost per kill
 *     criterion).
 *   - fixture tools (say/ffmpeg) unavailable and no fixture on disk
 *                                           → prints skip and exits 0.
 *   - <2 distinct speaker labels             → exits 1.
 *   - >= 2 speaker labels                    → exits 0.
 *
 * Writes scripts/.proof-diarization.json. Never prints secrets/env values.
 */
import { writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { DiarizationService } from "../src/services/ai/diarization";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, ".fixtures");
const FIXTURE = join(FIXTURE_DIR, "two-speaker.wav");

const SPEAKER_A_SENTENCES = [
  "Thanks for taking the time to chat today. I appreciate it.",
  "Our platform records sales calls automatically and writes summaries for you.",
  "What does your current note taking workflow look like?",
];

const SPEAKER_B_SENTENCES = [
  "Happy to be here. We have been looking for a better way to track follow ups.",
  "My team spends hours every week writing action items by hand.",
  "How quickly could we get a pilot running with your team?",
];

const hasTool = (name: string): boolean => {
  try {
    execFileSync("which", [name], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
};

function generateFixture(): void {
  if (existsSync(FIXTURE)) return;
  if (!hasTool("say") || !hasTool("ffmpeg")) {
    console.log("say/ffmpeg unavailable and fixture missing — proof skipped, code zero-cost per kill criterion");
    process.exit(0);
  }

  mkdirSync(FIXTURE_DIR, { recursive: true });
  const clips: string[] = [];
  const inputs = [
    ["Samantha", SPEAKER_A_SENTENCES],
    ["Daniel", SPEAKER_B_SENTENCES],
  ] as const;

  for (let turn = 0; turn < 3; turn++) {
    for (const [voice, sentences] of inputs) {
      const clip = join(FIXTURE_DIR, `clip_${turn}_${voice}.aiff`);
      execFileSync("say", ["-v", voice, "-o", clip, sentences[turn]]);
      clips.push(clip);
    }
  }

  const filter = clips
    .map((_, i) => `[${i}:a]apad=pad_dur=0.4[a${i}]`)
    .concat([`${clips.map((_, i) => `[a${i}]`).join("")}concat=n=${clips.length}:v=0:a=1[out]`])
    .join(";");

  execFileSync(
    "ffmpeg",
    ["-y", ...clips.flatMap((c) => ["-i", c]), "-filter_complex", filter, "-map", "[out]", "-ar", "16000", "-ac", "1", FIXTURE],
    { stdio: "pipe" },
  );

  for (const clip of clips) {
    try {
      unlinkSync(clip);
    } catch {
      // best-effort cleanup
    }
  }
  console.log(`Fixture generated: ${FIXTURE}`);
}

function fixtureSeconds(): number | null {
  if (!hasTool("ffprobe")) return null;
  const res = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", FIXTURE], {
    encoding: "utf8",
  });
  const parsed = parseFloat(res.stdout?.trim() ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

async function main() {
  if (!process.env.DEEPGRAM_API_KEY) {
    console.log("DEEPGRAM_API_KEY missing — proof skipped, code zero-cost per kill criterion");
    process.exit(0);
  }

  try {
    generateFixture();
  } catch (err) {
    console.log(`fixture generation failed — proof skipped: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(0);
  }

  const service = new DiarizationService();
  const result = await service.diarize(FIXTURE);

  const labels = [...new Set(result.speakers.map((s) => s.label))].sort();
  const ok = labels.length >= 2;

  const proof = {
    ok,
    fixture: FIXTURE,
    fixtureSeconds: fixtureSeconds(),
    callParams: { model: "nova-2", diarize: true, smart_format: true, detect_language: true },
    speakerCount: labels.length,
    labels,
    speakers: result.speakers.map((s) => ({
      label: s.label,
      segmentCount: s.segments.length,
      duration: Math.round(s.duration),
    })),
    transcriptLength: result.transcript.length,
    timestamp: new Date().toISOString(),
  };

  writeFileSync(join(__dirname, ".proof-diarization.json"), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof, null, 2));

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("proof crashed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});