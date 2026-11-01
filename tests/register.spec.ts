import { test, expect, type Page } from '@playwright/test';
import { requireEnv } from './support/env';

type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const validData: RegistrationData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'qa-validation@example.com',
  password: 'Test1234!',
  confirmPassword: 'Test1234!',
};

test.describe('Registration', () => {
  const fillRegistrationForm = async (page: Page, data: RegistrationData) => {
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
    // so scope each message to its field's container.
    await expect(
      page.locator('.inputs').filter({ has: page.getByLabel('Password:', { exact: true }) }).getByText('Password is required.'),
    ).toBeVisible();
    await expect(
      page.locator('.inputs').filter({ has: page.getByLabel('Confirm password:') }).getByText('Password is required.'),
    ).toBeVisible();
  });

  test('rejects an invalid email address', async ({ page }) => {
    await fillRegistrationForm(page, { ...validData, email: 'abc' });
    await submit(page);

    await expect(page.getByText('Wrong email')).toBeVisible();
  });

  test('rejects a password shorter than 6 characters', async ({ page }) => {
    await fillRegistrationForm(page, { ...validData, password: 'abc', confirmPassword: 'abc' });
    await submit(page);

    await expect(page.getByText('The password should have at least 6 characters.')).toBeVisible();
  });

  test('rejects a confirmation password that does not match', async ({ page }) => {
    await fillRegistrationForm(page, { ...validData, confirmPassword: 'Different1234!' });
    await submit(page);

    await expect(page.getByText('The password and confirmation password do not match.')).toBeVisible();
  });

  test('rejects an email that is already registered', async ({ page }) => {
    await fillRegistrationForm(page, { ...validData, email: requireEnv('TEST_USER_EMAIL') });
    await submit(page);

    await expect(page.getByText('The specified email already exists')).toBeVisible();
  });

  test('registers a new account and signs the user in', { tag: '@creates-data' }, async ({ page }) => {
    const email = `qa+${crypto.randomUUID()}@example.com`;
    await fillRegistrationForm(page, { ...validData, email });
    await submit(page);

    await expect(page.getByText('Your registration completed')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log out' })).toBeVisible();
    await expect(page.getByRole('link', { name: email })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeHidden();

    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL('/');
  });
});
