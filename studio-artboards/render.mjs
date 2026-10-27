import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "public", "studio");
const tmpDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";

import fs from "node:fs";
fs.mkdirSync(tmpDir, { recursive: true });

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const jobs = [
    ["extension.html", "gauge_chrome_extension_studio"],
    ["transcript.html", "gauge_transcription_studio"],
    ["communities.html", "gauge_communities_studio"],
    ["review-jamie.html", "gauge_review_jamie_studio"],
    ["review-deepa.html", "gauge_review_deepa_studio"],
    ["review-marcus.html", "gauge_review_marcus_studio"],
    ["review-priya.html", "gauge_review_priya_studio"],
  ];
  const page = await browser.newPage({
    viewport: { width: 860, height: 580 },
    deviceScaleFactor: 3,
  });
  for (const [src, out] of jobs) {
    await page.goto(`file://${path.join(here, src)}`);
    await page.locator(".artboard").screenshot({ path: path.join(tmpDir, `${out}.png`) });
    console.log("rendered", out);
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
