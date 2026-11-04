import { test as base, type Page } from '@playwright/test';
import { requireEnv } from './utils/env';

export { expect } from './utils/matchers';

type Fixtures = {
  /** A page logged in as the shared test customer. The account is shared, so do not change its data. */
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page, context, baseURL }, use) => {
    // Plain Node fetch, not Playwright's request: the test runner traces every Playwright API call,
    // including the form body with the password. fetch is not traced.
    const response = await fetch(new URL('/login', baseURL), {
      method: 'POST',
      body: new URLSearchParams({
        Email: requireEnv('TEST_USER_EMAIL'),
        Password: requireEnv('TEST_USER_PASSWORD'),
        RememberMe: 'false',
      }),
      redirect: 'manual',
    });
    // A rejected login re-renders the form with status 200; a successful one redirects.
    if (response.status !== 302) {
      throw new Error(`Fixture login was rejected (HTTP ${response.status}); check TEST_USER_EMAIL and TEST_USER_PASSWORD`);
    }
    await context.addCookies(
      response.headers.getSetCookie().map((header) => {
        const [pair] = header.split(';');
        const separator = pair.indexOf('=');
        if (separator < 0) throw new Error('Fixture login returned a malformed Set-Cookie header');
        return {
          name: pair.slice(0, separator).trim(),
          value: pair.slice(separator + 1).trim(),
          url: baseURL!,
        };
      }),
    );

    await use(page);
  },
});
