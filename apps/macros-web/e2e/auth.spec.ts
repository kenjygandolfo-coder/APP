import { expect, test } from '@playwright/test';

/**
 * Auth happy path against the built app (vite preview). Reaches the Auth view
 * from the top-level nav, logs in with valid credentials, asserts the success
 * state, then switches to Registro and checks the confirm-password field.
 */
test('logs in and can switch to the Registro form', async ({ page }) => {
  await page.goto('/');

  // The app defaults to the macros view; click the "Cuenta" tab to reach auth.
  await page.getByRole('button', { name: 'Cuenta' }).click();

  await expect(
    page.getByRole('heading', { name: 'Bienvenido de vuelta' }),
  ).toBeVisible();

  await page.getByLabel('Correo electrónico').fill('ana@ejemplo.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('superSecreta1');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page.getByRole('status')).toContainText(
    'Sesión iniciada con éxito',
  );

  // Switch to Registro and confirm the extra field is visible.
  await page.getByRole('button', { name: /no tienes cuenta/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Crea tu cuenta' }),
  ).toBeVisible();
  await expect(page.getByLabel('Confirmar contraseña')).toBeVisible();
});
