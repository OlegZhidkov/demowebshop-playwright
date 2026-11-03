import { test } from '@playwright/test';
import { CartPage } from './pages/cart-page';
import { Header } from './pages/header';
import { addToCart } from './support/cart';
import { defineCartTests } from './support/cart-scenarios';
import { expect } from './support/matchers';
import { smartphone } from './support/products';

// Each guest context gets its own cart (Nop.customer cookie), so these tests are safe to run in parallel.
test.describe('Cart as a guest', () => {
  defineCartTests('guest');

  test('guest: starts a new browser context with an empty cart', async ({ page, browser, baseURL }) => {
    await addToCart(page, smartphone.id, 1);
    await page.goto('/cart');
    await expect(new Header(page).cartLink).toHaveText(/\(1\)/);
    const otherContext = await browser.newContext({ baseURL });

    try {
      const otherPage = await otherContext.newPage();
      const otherCart = new CartPage(otherPage);
      await otherCart.open();

      await expect(otherCart.emptyMessage).toBeVisible();
      await expect(new Header(otherPage).cartLink).toHaveText(/\(0\)/);
    } finally {
      await otherContext.close();
    }
  });
});
