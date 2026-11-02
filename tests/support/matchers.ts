import { expect as baseExpect } from '@playwright/test';
import type { Header } from '../pages/header';

// Runs web-first assertions (they auto-wait) and turns their outcome into a matcher result.
async function check(description: string, assertions: () => Promise<void>) {
  try {
    await assertions();
    return { pass: true, message: () => `Expected the header not to be ${description}` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { pass: false, message: () => `Expected the header to be ${description}\n${reason}` };
  }
}

/**
 * `expect` with the shop's own matchers. Import it in specs instead of the one from Playwright.
 * The matchers are positive-only: they wait for the state, but `.not` does not retry.
 */
export const expect = baseExpect.extend({
  toBeLoggedInAs(header: Header, email: string) {
    return check(`logged in as ${email}`, async () => {
      await baseExpect(header.accountLink(email)).toBeVisible();
      await baseExpect(header.logoutLink).toBeVisible();
      await baseExpect(header.loginLink).toHaveCount(0);
      await baseExpect(header.registerLink).toHaveCount(0);
    });
  },

  toBeLoggedOut(header: Header) {
    return check('logged out', async () => {
      await baseExpect(header.loginLink).toBeVisible();
      await baseExpect(header.registerLink).toBeVisible();
      await baseExpect(header.logoutLink).toHaveCount(0);
    });
  },
});
