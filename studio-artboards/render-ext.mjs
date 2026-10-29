import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "public", "studio");
const tmpDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";
fs.mkdirSync(tmpDir, { recursive: true });

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const jobs = [
    ["ext-step-unzip.html", "gauge_ext_step_unzip"],
    ["ext-step-chrome.html", "gauge_ext_step_chrome"],
    ["ext-step-connect.html", "gauge_ext_step_connect"],
    ["ext-permissions.html", "gauge_ext_permissions"],
    ["ext-cta-record.html", "gauge_ext_cta_record"],
    ["ext-console.html", "gauge_ext_console"],
  ];
  const page = await browser.newPage({
    viewport: { width: 860, height: 640 },
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
