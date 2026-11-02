import type { Page } from '@playwright/test';

export async function logIn(
  page: Page,
  email: string,
  password: string,
  options: { rememberMe?: boolean } = {},
) {
  await page.goto('/login');
  await page.getByLabel('Email:').fill(email);
  await page.getByLabel('Password:', { exact: true }).fill(password);
  if (options.rememberMe) await page.getByLabel('Remember me?').check();
  await page.getByRole('button', { name: 'Log in' }).click();
}
