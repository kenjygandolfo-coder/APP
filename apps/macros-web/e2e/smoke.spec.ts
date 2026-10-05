import { expect, test } from '@playwright/test';

test('loads the macros wizard on step 1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/paso 1 de 4/i)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /sobre ti/i }),
  ).toBeVisible();
});
