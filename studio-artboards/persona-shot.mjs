import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";

const browser = await chromium.launch();

/* ---------------- desktop pass: all 5 personas + a mid-crossfade ---------------- */
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 2 });
await page.goto("http://localhost:3199/", { waitUntil: "networkidle" });

const section = page.locator('[data-track-section="persona-switcher"]');
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

const activePill = () =>
  page
    .locator('[data-track-section="persona-switcher"] [data-pill-active="true"]')
    .first()
    .innerText()
    .then((t) => t.trim());

/* wait until `name` becomes active, wait `dwell` ms into its 5.6s window, shoot */
async function shotFor(name, file, dwell = 2400) {
  const start = Date.now();
  while (Date.now() - start < 40000) {
    const cur = await activePill();
    if (cur === name) break;
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(dwell);
  await section.screenshot({ path: path.join(outDir, file) });
  return activePill();
}

await shotFor("VP Sales", "home-psw-a-vpsales.png");
await shotFor("RevOps", "home-psw-b-revops.png");
await shotFor("Product Marketing", "home-psw-c-pmm.png");
await shotFor("Founders", "home-psw-d-founders.png");
await shotFor("Sales", "home-psw-e-sales.png");

/* mid-crossfade: wait for the NEXT pill flip, shoot 380ms into the 700ms swap */
{
  const s0 = await activePill();
  const start = Date.now();
  while (Date.now() - start < 30000) {
    if ((await activePill()) !== s0) break;
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(380);
  await section.screenshot({ path: path.join(outDir, "home-psw-f-crossfade.png") });
}
await page.close();

/* ---------------- mobile pass: 390px, two representative personas ---------------- */
const mp = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await mp.goto("http://localhost:3199/", { waitUntil: "networkidle" });
const msection = mp.locator('[data-track-section="persona-switcher"]');
await msection.scrollIntoViewIfNeeded();
await mp.waitForTimeout(500);

const mActivePill = () =>
  mp
    .locator('[data-track-section="persona-switcher"] [data-pill-active="true"]')
    .first()
    .innerText()
    .then((t) => t.trim());

async function mShotFor(name, file, dwell = 2400) {
  const start = Date.now();
  while (Date.now() - start < 40000) {
    const cur = await mActivePill();
    if (cur === name) break;
    await mp.waitForTimeout(150);
  }
  await mp.waitForTimeout(dwell);
  await msection.screenshot({ path: path.join(outDir, file) });
}

await mShotFor("RevOps", "home-psw-m-revops.png");
await mShotFor("Founders", "home-psw-m-founders.png");

await browser.close();
console.log("done");
