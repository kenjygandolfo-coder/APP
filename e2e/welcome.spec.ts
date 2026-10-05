import { expect, test } from '@playwright/test';

test('shows the welcome screen on the web build', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('FitApp')).toBeVisible();
  await expect(page.getByText('Tu energía, en números claros.')).toBeVisible();
});
