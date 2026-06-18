import { test, expect } from '@playwright/test';

test('integrations page requires auth', async ({ page }) => {
  await page.goto('/integrations');
  await page.waitForURL('**/sign-in**');
});
