import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:3199/", { waitUntil: "networkidle" });

const section = page.locator('[data-track-section="persona-switcher"]');
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

// Frame 1: initial dwell (VP Sales, ~60% through)
await page.waitForTimeout(2600);
await section.screenshot({ path: path.join(outDir, "persona-t1-vpsales.png") });

// Frame 2: after first auto-advance (RevOps, count-up moment)
await page.waitForTimeout(3300);
await section.screenshot({ path: path.join(outDir, "persona-t2-revops.png") });

// Frame 3: two advances later (Founders)
await page.waitForTimeout(10000);
await section.screenshot({ path: path.join(outDir, "persona-t3-founders.png") });

// Frame 4: hover pause — dwell frozen
await page.hover('[data-track-section="persona-switcher"] h3');
await page.waitForTimeout(300);
const bar1 = await page.locator('[data-track-section="persona-switcher"] [role="tab"][aria-selected="true"] span[aria-hidden] i').first().evaluate((el) => getComputedStyle(el).animationPlayState).catch(() => "n/a");
console.log("playState on hover:", bar1);

// Frame 5: mobile viewport
const mpage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await mpage.goto("http://localhost:3199/", { waitUntil: "networkidle" });
const mSec = mpage.locator('[data-track-section="persona-switcher"]');
await mSec.scrollIntoViewIfNeeded();
await mpage.waitForTimeout(6900);
await mSec.screenshot({ path: path.join(outDir, "persona-mobile.png") });

await browser.close();
