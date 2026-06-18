import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});

test('protected dashboard redirects to sign-in', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL('**/sign-in**');
});

test('pricing page shows plans', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('text=Pro')).toBeVisible();
});
