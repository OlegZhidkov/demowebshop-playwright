import type { BrowserContext } from '@playwright/test';
import { requireEnv } from './env';

/**
 * Logs the context in as the shared test customer, without the login form.
 * Plain Node fetch, not Playwright's request: the test runner traces every Playwright API call,
 * including the form body with the password. fetch is not traced.
 */
export async function logInWithoutForm(context: BrowserContext, baseURL: string) {
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
    throw new Error(`Login was rejected (HTTP ${response.status}); check TEST_USER_EMAIL and TEST_USER_PASSWORD`);
  }
  await context.addCookies(
    response.headers.getSetCookie().map((header) => {
      const [pair] = header.split(';');
      const separator = pair.indexOf('=');
      if (separator < 0) throw new Error('Login returned a malformed Set-Cookie header');
      return {
        name: pair.slice(0, separator).trim(),
        value: pair.slice(separator + 1).trim(),
        url: baseURL,
      };
    }),
  );
}
