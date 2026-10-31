import { chromium } from "playwright";

const base = process.env.PD_BASE ?? "http://localhost:3199";
const outDir = "/var/folders/pr/9l205kmd19gg4f53dtlrdxf80000gn/T/opencode/studio-renders";
const SEL = '[data-track-section="product-architecture"]';

const browser = await chromium.launch();

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errs.push("console: " + m.text());
});

await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(SEL, { timeout: 30000 });
await page.mouse.move(10, 10);

const sec = page.locator(SEL);
await sec.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);

// copy + href truth
const checks = {};
checks.h3a = (await sec.locator("h3").nth(0).textContent())?.trim();
checks.h3b = (await sec.locator("h3").nth(1).textContent())?.trim();
const links = await sec.locator("a").evaluateAll((as) => as.map((a) => [a.getAttribute("href"), a.textContent?.trim()]));
checks.links = links;
checks.live = await sec.getAttribute("data-live");

await sec.screenshot({ path: `${outDir}/pd-local-desktop.png` });

// mobile
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
m.on("pageerror", (e) => errs.push("m pageerror: " + e.message));
await m.goto(base + "/", { waitUntil: "domcontentloaded" });
await m.waitForSelector(SEL, { timeout: 30000 });
const msec = m.locator(SEL);
await msec.scrollIntoViewIfNeeded();
await m.waitForTimeout(2000);
checks.mlive = await msec.getAttribute("data-live");
await msec.screenshot({ path: `${outDir}/pd-local-mobile.png` });

console.log(JSON.stringify(checks, null, 2));
console.log("errors:", errs.length ? errs : "none");
await browser.close();
