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
await page.waitForTimeout(600);

const fillSel = '[data-track-section="persona-switcher"] [role="tab"][aria-selected="true"] .persona-progress-fill';
const playState = () => page.locator(fillSel).first().evaluate((el) => getComputedStyle(el).animationPlayState).catch(() => "no-fill");

console.log("baseline           :", await playState());

await page.hover('[data-track-section="persona-switcher"] h3');
await page.waitForTimeout(300);
console.log("playState hover    :", await playState());

await page.mouse.move(60, 60);
await page.waitForTimeout(400);
console.log("playState resume   :", await playState());

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
console.log("playState offscreen:", await playState());

await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const before = await page.locator('[data-track-section="persona-switcher"] [role="tab"][aria-selected="true"]').textContent();
await page.locator('[data-track-section="persona-switcher"] [aria-label^="Next role"]').click();
await page.waitForTimeout(900);
const after = await page.locator('[data-track-section="persona-switcher"] [role="tab"][aria-selected="true"]').textContent();
console.log("arrow advance      :", before.trim(), "->", after.trim());

await page.getByRole("tab", { name: "Founders" }).click();
await page.waitForTimeout(1600);
await section.screenshot({ path: path.join(outDir, "persona-founders.png") });

await browser.close();
