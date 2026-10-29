import path from "node:path";
import { chromium } from "playwright";

const outDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:3199/", { waitUntil: "networkidle" });

// the bottom full-width card of the showcase section (Automate the action items)
const sec = page.locator('[data-track-section="studio-showcase"]');
await sec.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(3000);   // catch mid-loop: rows checked + sync band up
const card = page.locator('[data-track-section="studio-showcase"] .crm-loop').locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
await card.screenshot({ path: path.join(outDir, "bento-capture-card.png") });
await browser.close();
