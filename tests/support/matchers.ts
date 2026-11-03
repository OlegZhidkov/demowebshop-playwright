import { expect as baseExpect } from '@playwright/test';
import type { CartPage } from '../pages/cart-page';
import type { Header } from '../pages/header';

// Runs web-first assertions (they auto-wait) and turns their outcome into a matcher result.
async function check(subject: string, description: string, assertions: () => Promise<void>) {
  try {
    await assertions();
    return { pass: true, message: () => `Expected ${subject} not to be ${description}` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { pass: false, message: () => `Expected ${subject} to be ${description}\n${reason}` };
  }
}

/**
 * `expect` with the shop's own matchers. Import it in specs instead of the one from Playwright.
 * The matchers are positive-only: they wait for the state, but `.not` does not retry.
 */
export const expect = baseExpect.extend({
  toBeLoggedInAs(header: Header, email: string) {
    return check('the header', `logged in as ${email}`, async () => {
      await baseExpect(header.accountLink(email)).toBeVisible();
      await baseExpect(header.logoutLink).toBeVisible();
      await baseExpect(header.loginLink).toHaveCount(0);
      await baseExpect(header.registerLink).toHaveCount(0);
    });
  },

  toBeLoggedOut(header: Header) {
    return check('the header', 'logged out', async () => {
      await baseExpect(header.loginLink).toBeVisible();
      await baseExpect(header.registerLink).toBeVisible();
      await baseExpect(header.logoutLink).toHaveCount(0);
    });
  },

  toHaveCartLine(
    cartPage: CartPage,
    line: { name: string; unitPrice: string; quantity: number; lineTotal: string },
  ) {
    return check('the cart', `showing ${line.name} x${line.quantity}`, async () => {
      await baseExpect(cartPage.line(line.name)).toBeVisible();
      await baseExpect(cartPage.unitPrice(line.name)).toHaveText(line.unitPrice);
      await baseExpect(cartPage.quantityInput(line.name)).toHaveValue(String(line.quantity));
      await baseExpect(cartPage.lineTotal(line.name)).toHaveText(line.lineTotal);
    });
  },
});
