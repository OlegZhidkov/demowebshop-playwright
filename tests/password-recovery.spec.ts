import { randomUUID } from 'node:crypto';
import { test } from '@playwright/test';
import { Header } from './pages/header';
import { LoginPage } from './pages/login-page';
import { requireEnv } from './support/env';
import { expect } from './support/matchers';

test.describe('Password recovery', () => {
  const sentMessage = 'Email with instructions has been sent to you.';

  test('opens from the login page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: 'Forgot password?' }).click();

    await expect(page).toHaveURL('/passwordrecovery');
    await expect(page.getByRole('heading', { name: 'Password recovery' })).toBeVisible();
    await expect(page.getByLabel('Your email address:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recover' })).toBeVisible();
  });

  test('asks for an email when the field is empty', async ({ page }) => {
    await page.goto('/passwordrecovery');

    await page.getByRole('button', { name: 'Recover' }).click();

    await expect(page.getByText('Enter your email', { exact: true })).toBeVisible();
    await expect(page.getByText(sentMessage)).toHaveCount(0);
  });

  test('rejects an unknown email', async ({ page }) => {
    await page.goto('/passwordrecovery');

    await page.getByLabel('Your email address:').fill(`qa-nobody-${randomUUID()}@example.com`);
    await page.getByRole('button', { name: 'Recover' }).click();

    await expect(page.getByText('Email not found.')).toBeVisible();
  });

  // Only checks the confirmation message; no mail is delivered to the test account.
  test('shows the confirmation message for a registered email', async ({ page }) => {
    const email = requireEnv('TEST_USER_EMAIL');
    await page.goto('/passwordrecovery');

    await page.getByLabel('Your email address:').fill(email);
    await page.getByRole('button', { name: 'Recover' }).click();

    await expect(page.getByText(sentMessage)).toBeVisible();

    // The password is unchanged, so the account still works.
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.logIn(email, requireEnv('TEST_USER_PASSWORD'));
    await expect(new Header(page)).toBeLoggedInAs(email);
  });
});
