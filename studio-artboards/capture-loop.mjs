import path from "node:path";
import { chromium } from "playwright";

const outDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:3199/", { waitUntil: "networkidle" });

const card = page.locator('[data-track-section="studio-showcase"] .crm-loop');
await card.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);          // t≈0.5s — r0 about to pop
await card.screenshot({ path: path.join(outDir, "loop-a.png") });
await page.waitForTimeout(2500);         // t≈3s — r0 on, r1 popping
await card.screenshot({ path: path.join(outDir, "loop-b.png") });
await page.waitForTimeout(3300);         // t≈6.3s — all on + sync band up
await card.screenshot({ path: path.join(outDir, "loop-c.png") });
await page.waitForTimeout(2600);         // t≈9s — resetting
await card.screenshot({ path: path.join(outDir, "loop-d.png") });
await browser.close();
