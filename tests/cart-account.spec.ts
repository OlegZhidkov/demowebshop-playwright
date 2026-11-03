import { test } from '@playwright/test';
import { CartPage } from './pages/cart-page';
import { Header } from './pages/header';
import { LoginPage } from './pages/login-page';
import { addToCart, emptyCart } from './support/cart';
import { defineCartTests } from './support/cart-scenarios';
import { requireEnv } from './support/env';
import { expect } from './support/matchers';
import { laptop, smartphone } from './support/products';

// All tests share the one test account's cart, so they must not overlap.
// 'default' mode runs the tests of this file one after another in a single worker, even with fullyParallel,
// without making later tests depend on earlier ones. No other spec may touch this account's cart.
test.describe.configure({ mode: 'default' });

// Read inside the tests, so a missing variable fails these tests only, not the loading of the whole suite.
const credentials = () => ({ email: requireEnv('TEST_USER_EMAIL'), password: requireEnv('TEST_USER_PASSWORD') });

test.describe('Cart as a logged-in customer', () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = credentials();
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.logIn(email, password);
    await expect(new Header(page).accountLink(email)).toBeVisible();
    await emptyCart(page);
  });

  test.afterEach(async ({ page }) => {
    await emptyCart(page);
  });

  defineCartTests('logged-in');

  test('logged-in: keeps the cart after logout and a fresh login in a new context', async ({
    page,
    browser,
    baseURL,
  }) => {
    const { email, password } = credentials();
    await addToCart(page, smartphone.id, 1);
    await addToCart(page, laptop.id, 2);
    await new Header(page).logout();
    await expect(new Header(page).loginLink).toBeVisible();
    const newContext = await browser.newContext({ baseURL });

    try {
      const newPage = await newContext.newPage();
      const loginPage = new LoginPage(newPage);
      await loginPage.open();
      await loginPage.logIn(email, password);
      const cartPage = new CartPage(newPage);
      await cartPage.open();

      await expect(cartPage).toHaveCartLine({
        name: smartphone.name,
        unitPrice: smartphone.unitPrice,
        quantity: 1,
        lineTotal: '100.00',
      });
      await expect(cartPage).toHaveCartLine({
        name: laptop.name,
        unitPrice: laptop.unitPrice,
        quantity: 2,
        lineTotal: '3180.00',
      });
      await expect(new Header(newPage).cartLink).toHaveText(/\(3\)/);
    } finally {
      // The original page is logged out, so the afterEach hook cannot empty the account cart; do it here.
      await emptyCart(await newContext.newPage());
      await newContext.close();
    }
  });
});
