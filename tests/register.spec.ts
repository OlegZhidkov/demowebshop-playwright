import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { requireEnv } from './support/env';

test.describe('Registration', () => {
  // Fresh values on every call, so tests never share an account or credentials.
  const validData = () => {
    const password: string = randomUUID();
    return {
      firstName: 'Test',
      lastName: 'User',
      email: `qa+${randomUUID()}@example.com`,
      password,
      confirmPassword: password,
    };
  };

  const fillRegistrationForm = async (page: Page, data: ReturnType<typeof validData>) => {
    await page.getByLabel('First name:').fill(data.firstName);
    await page.getByLabel('Last name:').fill(data.lastName);
    await page.getByLabel('Email:').fill(data.email);
    await page.getByLabel('Password:', { exact: true }).fill(data.password);
    await page.getByLabel('Confirm password:').fill(data.confirmPassword);
  };

  const submit = (page: Page) => page.getByRole('button', { name: 'Register' }).click();

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('shows required errors when the form is submitted empty', async ({ page }) => {
    await submit(page);

    await expect(page.getByText('First name is required.')).toBeVisible();
    await expect(page.getByText('Last name is required.')).toBeVisible();
    await expect(page.getByText('Email is required.')).toBeVisible();
    // "Password is required." appears twice and no user-facing locator tells the two apart,
    // so each message is scoped to its field's container.
    await expect(
      page.locator('.inputs', { has: page.getByLabel('Password:', { exact: true }) }).getByText('Password is required.'),
    ).toBeVisible();
    await expect(
      page.locator('.inputs', { has: page.getByLabel('Confirm password:') }).getByText('Password is required.'),
    ).toBeVisible();
  });

  test('rejects an invalid email address', async ({ page }) => {
    await fillRegistrationForm(page, { ...validData(), email: 'abc' });
    await submit(page);

    await expect(page.getByText('Wrong email')).toBeVisible();
  });

  test('rejects a password shorter than 6 characters', async ({ page }) => {
    await fillRegistrationForm(page, { ...validData(), password: 'abc', confirmPassword: 'abc' });
    await submit(page);

    await expect(page.getByText('The password should have at least 6 characters.')).toBeVisible();
  });

  test('rejects mismatched password and confirmation', async ({ page }) => {
    const data = validData();
    await fillRegistrationForm(page, { ...data, confirmPassword: `${data.password}-x` });
    await submit(page);

    await expect(page.getByText('The password and confirmation password do not match.')).toBeVisible();
  });

  test('registers a new account and signs the user in', { tag: '@creates-data' }, async ({ page }) => {
    const data = validData();
    await fillRegistrationForm(page, data);
    await submit(page);

    await expect(page.getByText('Your registration completed')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log out' })).toBeVisible();
    await expect(page.getByRole('link', { name: data.email })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL('/');
  });

  test('rejects an email that is already registered', async ({ page }) => {
    await fillRegistrationForm(page, { ...validData(), email: requireEnv('TEST_USER_EMAIL') });
    await submit(page);

    await expect(page.getByText('The specified email already exists')).toBeVisible();
  });
});
