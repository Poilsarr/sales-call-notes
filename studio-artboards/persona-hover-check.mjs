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

/* ---------- 1) no-click audit: passive pills only, zero arrows ---------- */
const tabs = await page.locator('[data-track-section="persona-switcher"] [role="tab"]').count();
const nextBtns = await page.locator('[data-track-section="persona-switcher"] [aria-label^="Next role"]').count();
const pills = await page.locator('[data-track-section="persona-switcher"] [data-pill-active]').count();
const pillRowHidden = await page
  .locator('[data-track-section="persona-switcher"] [data-pill-active]')
  .first()
  .evaluate((el) => el.closest('[aria-hidden="true"]') !== null);
console.log("no-click audit    : role=tab:", tabs, "| next-btns:", nextBtns, "| passive pills:", pills, "| pills-row aria-hidden:", pillRowHidden);

/* ---------- 2) smart pause: dwell -> hover (pause) -> leave (resume) ---------- */
const fillSel = '[data-track-section="persona-switcher"] [data-pill-active="true"] .persona-progress-fill';
const playState = () =>
  page
    .locator(fillSel)
    .first()
    .evaluate((el) => getComputedStyle(el).animationPlayState)
    .catch(() => "no-fill");

console.log("baseline          :", await playState());

const h3 = page.locator('[data-track-section="persona-switcher"] h3').first();
const box = await h3.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
await page.waitForTimeout(300);
console.log("hover-on-stage    :", await playState());

await page.mouse.move(10, 10, { steps: 4 });
await page.waitForTimeout(400);
console.log("hover-out         :", await playState());

/* ---------- 3) autoplay advances with zero clicks ---------- */
const activePillText = () =>
  page
    .locator('[data-track-section="persona-switcher"] [data-pill-active="true"]')
    .first()
    .innerText()
    .then((t) => t.trim());

const before = await activePillText();
let after = before;
for (let i = 0; i < 45; i++) {
  await page.waitForTimeout(200);
  after = await activePillText();
  if (after !== before) break;
}
console.log("autoplay w/o click:", after !== before ? `advanced "${before}" -> "${after}"` : "NO ADVANCE (FAIL)");

/* ---------- 4) chip cascade replays each activation ---------- */
const firstActiveForm = () =>
  page
    .locator('[data-track-section="persona-switcher"] [data-active="true"]')
    .first()
    .evaluate((el) => ({
      chips: el.querySelectorAll(".psw-chip span, .psw-chip").length,
      chipInCount: el.querySelectorAll(".psw-chip-in").length,
    }))
    .catch(() => ({ chips: -1, chipInCount: -1 }));
const chipInfo = await firstActiveForm();

/* ---------- 5) structural: one form per layer, active layer visible ---------- */
const layerInfo = await page.evaluate(() => {
  const section = document.querySelector('[data-track-section="persona-switcher"]');
  const layers = section ? Array.from(section.querySelectorAll(".psw-layer")) : [];
  const on = layers.filter((l) => l.classList.contains("psw-layer--on"));
  const off = layers.filter((l) => l.classList.contains("psw-layer--off"));
  const offPaused = off.length > 0;
  return { total: layers.length, on: on.length, off: off.length, offPaused };
});
console.log("layers            :", JSON.stringify(layerInfo));
console.log("active chips      :", JSON.stringify(chipInfo));

/* ---------- snapshot for the record ---------- */
await page.waitForTimeout(900);
await section.screenshot({ path: path.join(outDir, "home-psw-hovercheck.png") });

await browser.close();
console.log("done");
