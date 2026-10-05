import { expect, test } from '@playwright/test';

/**
 * Full happy-path E2E against the built app (vite preview). Completes all four
 * steps, verifies the results, the save-success state, and that "Corregir
 * datos" preserves previously entered values.
 */
test('completes the wizard, saves goals, and preserves data on edit', async ({
  page,
}) => {
  await page.goto('/');

  // Step 1: gender + age.
  await expect(page.getByText(/paso 1 de 4/i)).toBeVisible();
  await page.getByLabel('Género').selectOption('male');
  await page.getByLabel('Edad').fill('30');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Step 2: weight + height.
  await expect(page.getByText(/paso 2 de 4/i)).toBeVisible();
  await page.getByLabel('Peso (kg)').fill('80');
  await page.getByLabel('Altura (cm)').fill('180');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Step 3: activity.
  await expect(page.getByText(/paso 3 de 4/i)).toBeVisible();
  await page.getByLabel('Nivel de actividad').selectOption('moderate');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // Step 4: results.
  await expect(page.getByText(/paso 4 de 4/i)).toBeVisible();
  await expect(page.getByText(/objetivo de calorías/i)).toBeVisible();
  await expect(page.getByText(/proteína/i)).toBeVisible();

  // Save -> success banner.
  await page.getByRole('button', { name: 'Guardar mis metas' }).click();
  await expect(page.getByRole('status')).toContainText(/guardaron con éxito/i);

  // Edit -> back to step 1 with values preserved.
  await page.getByRole('button', { name: 'Corregir datos' }).click();
  await expect(page.getByText(/paso 1 de 4/i)).toBeVisible();
  await expect(page.getByLabel('Edad')).toHaveValue('30');
  await expect(page.getByLabel('Género')).toHaveValue('male');
});
