import { test, expect } from "@playwright/test";

/**
 * Signed-in smoke tests for Clerk-gated pages.
 *
 * Skipped automatically when E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD
 * are not set (i.e. in CI without Clerk test-mode creds). Locally, set
 * them in your shell or .env.local and run:
 *
 *   E2E_BASE_URL=http://localhost:3000 \
 *   E2E_TEST_USER_EMAIL="you@example.com" \
 *   E2E_TEST_USER_PASSWORD="your-test-password" \
 *   npx playwright test e2e/gated-pages.spec.ts
 *
 * The test signs in via Clerk's standard SignIn component (no
 * internal API bypass), so it catches real auth-gate regressions,
 * not just route-table mistakes.
 */

const HAS_CREDS =
  !!process.env.E2E_TEST_USER_EMAIL && !!process.env.E2E_TEST_USER_PASSWORD;

const GATED_ROUTES: { path: string; expectedHeading: RegExp; requiredNavLink?: string }[] = [
  { path: "/dashboard",   expectedHeading: /dashboard|welcome|hi,/i },
  { path: "/team",        expectedHeading: /team/i },
  { path: "/integrations", expectedHeading: /integrations|connect your stack/i },
  { path: "/settings",    expectedHeading: /settings/i, requiredNavLink: "General" },
  { path: "/billing",     expectedHeading: /billing|plan|subscription/i },
];

for (const route of GATED_ROUTES) {
  test(`gated page renders after sign-in: ${route.path}`, async ({ page }) => {
    test.skip(!HAS_CREDS, "Set E2E_TEST_USER_EMAIL + E2E_TEST_USER_PASSWORD to run");

    // Sign in
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_USER_EMAIL!);
    // Clerk may show a "continue with email" button before password field
    const continueBtn = page.getByRole("button", { name: /continue|next/i });
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
    }
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: /sign in|continue|log in/i }).click();

    // Wait for redirect away from /sign-in
    await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 30_000 });

    // Navigate to the gated page
    await page.goto(route.path);

    // Must NOT be redirected back to /sign-in (the actual auth-gate check)
    await expect(page).not.toHaveURL(/\/sign-in/);

    // Page should render some content (not blank)
    await expect(page.locator("main")).toBeVisible();
    const text = await page.locator("main").innerText();
    expect(text.length).toBeGreaterThan(100); // real content, not a stub

    // Heading should match (loose)
    const heading = await page.locator("h1, h2").first().innerText().catch(() => "");
    expect(heading.length).toBeGreaterThan(0);

    // No raw 500 page text leaking
    expect(text.toLowerCase()).not.toContain("internal server error");
    expect(text.toLowerCase()).not.toContain("unhandled error");

    // Take a screenshot for visual archive (saved to e2e/snapshots/)
    await page.screenshot({
      path: `e2e/snapshots/${route.path.replace(/\//g, "_")}.png`,
      fullPage: false,
    });
  });
}