import { test, expect } from '@playwright/test';

test('team page requires auth', async ({ page }) => {
  await page.goto('/team');
  await page.waitForURL('**/sign-in**');
});
