import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));

const shots = [
  { file: "product-duo-v1-obsidian.html", out: "duo-v1-obsidian.png" },
  { file: "product-duo-v2-light.html", out: "duo-v2-light.png" },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1180 }, deviceScaleFactor: 2 });
  await page.goto(`file://${path.join(here, s.file)}`, { waitUntil: "load" });
  await page.waitForTimeout(1400); // settle animations at a good frame
  await page.locator(".capture").screenshot({ path: `/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders/${s.out}` });
  console.log("rendered", s.out);
  await page.close();
}
await browser.close();
