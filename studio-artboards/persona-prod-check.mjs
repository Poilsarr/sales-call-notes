import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";
const URL = process.env.PROD_URL || "https://usegauge.vercel.app";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

await page.goto(URL, { waitUntil: "networkidle" });
const section = page.locator('[data-track-section="persona-switcher"]');
await section.scrollIntoViewIfNeeded();
// mouse parked at (0,0) — zero interaction, mirrors a viewer who never touches
await page.mouse.move(0, 0);
await page.waitForTimeout(500);

const activeLabel = () =>
  page
    .locator('[data-track-section="persona-switcher"] [data-pill-active="true"]')
    .first()
    .innerText()
    .then((t) => t.trim())
    .catch(() => "?");

console.log("start label:", await activeLabel());

/* Phase 1 — zero-touch autoplay: does the cycle reach EVERY persona? */
const seen = [];
const shots = {};
const want = ["sales", "vpsales", "revops", "productmarketing", "founders"];
for (let i = 0; i < 100; i++) {
  const label = await activeLabel();
  const key = label.toLowerCase().replace(/[\s-]+/g, "");
  if (!seen.includes(label)) {
    seen.push(label);
    if (key !== "vpsales" && !shots[key]) {
      shots[key] = true;
      await page.screenshot({ path: path.join(outDir, `prod-psw-${key}.png`) });
    }
  }
  if (want.every((w) => shots[w] || seen.map((s) => s.toLowerCase().replace(/[\s-]+/g, "")).includes(w))) break;
  await page.waitForTimeout(400);
}
console.log("zero-touch cycle reached:", seen.join(" → "), "| all-5:", seen.length >= 5);

/* Phase 2 — iPad-style stuck hover: synthetic mouseover with NO leave ever */
const stage = page.locator('[data-track-section="persona-switcher"] h3').first();
const box = await stage.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 2 });
await page.waitForTimeout(400);
const before = await activeLabel();
const fillSel = '[data-track-section="persona-switcher"] [data-pill-active="true"] .persona-progress-fill';
const pausedNow = await page
  .locator(fillSel)
  .first()
  .evaluate((el) => getComputedStyle(el).animationPlayState)
  .catch(() => "no-fill");
// now simulate the touch-device failure mode: enter fires, leave NEVER fires
await page.locator('[data-track-section="persona-switcher"]').dispatchEvent("mouseover", { bubbles: true });
let stuck = true;
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(500);
  if ((await activeLabel()) !== before) { stuck = false; break; }
}
console.log(`hover-freeze check : label ${before} paused=${pausedNow} | after 12s advanced=${!stuck} (stuck=${stuck})`);
console.log("page errors        :", errors.length ? errors.join(" | ") : "none");

await browser.close();
