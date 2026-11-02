import { randomUUID } from 'node:crypto';
import { test, expect, type BrowserContext } from '@playwright/test';
import { Header } from './pages/header';
import { logIn } from './support/auth';
import { requireEnv } from './support/env';

async function authCookie(context: BrowserContext) {
  const cookie = (await context.cookies()).find((c) => c.name === 'NOPCOMMERCE.AUTH');
  expect(cookie, 'NOPCOMMERCE.AUTH cookie is set after login').toBeDefined();
  return cookie!;
}

test.describe('Login', () => {
  const failureSummary = 'Login was unsuccessful. Please correct the errors and try again.';

  test('logs a registered customer in', async ({ page }) => {
    const email = requireEnv('TEST_USER_EMAIL');

    await logIn(page, email, requireEnv('TEST_USER_PASSWORD'));

    await expect(page).toHaveURL('/');
    await new Header(page).expectLoggedInAs(email);
  });

  test('rejects a wrong password', async ({ page }) => {
    await logIn(page, requireEnv('TEST_USER_EMAIL'), randomUUID());

    await expect.soft(page.getByText(failureSummary)).toBeVisible();
    await expect.soft(page.getByText('The credentials provided are incorrect')).toBeVisible();
    await new Header(page).expectLoggedOut();
  });

  test('rejects an unknown email', async ({ page }) => {
    await logIn(page, `qa-nobody-${randomUUID()}@example.com`, randomUUID());

    await expect.soft(page.getByText(failureSummary)).toBeVisible();
    await expect.soft(page.getByText('No customer account found')).toBeVisible();
    await new Header(page).expectLoggedOut();
  });

  test('returns to the protected page after login', async ({ page }) => {
    await page.goto('/customer/info');
    await expect(page).toHaveURL(/\/login\?ReturnUrl=/);

    // Fill the redirected form in place; the logIn helper would navigate away and drop ReturnUrl.
    await page.getByLabel('Email:').fill(requireEnv('TEST_USER_EMAIL'));
    await page.getByLabel('Password:', { exact: true }).fill(requireEnv('TEST_USER_PASSWORD'));
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/customer/info');
    await expect(page.getByRole('heading', { name: 'My account - Customer info' })).toBeVisible();
  });

  test('resets the header after logout', async ({ page }) => {
    const email = requireEnv('TEST_USER_EMAIL');
    const header = new Header(page);
    await logIn(page, email, requireEnv('TEST_USER_PASSWORD'));
    await expect(header.logoutLink).toBeVisible();

    await header.logout();

    await expect(page).toHaveURL('/');
    await header.expectLoggedOut();
    await expect(header.accountLink(email)).toHaveCount(0);
  });

  test('keeps the login session-only without Remember me', async ({ page, context }) => {
    await logIn(page, requireEnv('TEST_USER_EMAIL'), requireEnv('TEST_USER_PASSWORD'));

    await expect(new Header(page).logoutLink).toBeVisible();
    const cookie = await authCookie(context);
    expect.soft(cookie.expires).toBe(-1);
    expect.soft(cookie.httpOnly).toBe(true);
  });

  test('persists the login with Remember me', async ({ page, context }) => {
    await logIn(page, requireEnv('TEST_USER_EMAIL'), requireEnv('TEST_USER_PASSWORD'), {
      rememberMe: true,
    });

    await expect(new Header(page).logoutLink).toBeVisible();
    const cookie = await authCookie(context);
    const daysLeft = (cookie.expires - Date.now() / 1000) / 86400;
    expect.soft(daysLeft).toBeGreaterThan(29);
    expect.soft(daysLeft).toBeLessThan(31);
    expect.soft(cookie.httpOnly).toBe(true);
  });
});
