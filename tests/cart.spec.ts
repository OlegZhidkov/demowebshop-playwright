import { test } from '@playwright/test';
import { CartPage } from './pages/cart-page';
import { Header } from './pages/header';
import { LoginPage } from './pages/login-page';
import { addToCart, emptyCart } from './support/cart';
import { requireEnv } from './support/env';
import { expect } from './support/matchers';
import { cellPhonesCategory, configurableComputer, laptop, smartphone } from './support/products';

// Read inside the tests, so a missing variable fails these tests only, not the loading of the whole suite.
const credentials = () => ({ email: requireEnv('TEST_USER_EMAIL'), password: requireEnv('TEST_USER_PASSWORD') });

const invalidQuantities = [
  { quantity: '0', message: 'Quantity should be positive' },
  { quantity: '-1', message: 'Quantity should be positive' },
  { quantity: 'abc', message: 'Quantity should be positive' },
  { quantity: '10001', message: 'The maximum quantity allowed for purchase is 10000.' },
];

// The same cart behavior is checked for a guest and for the logged-in test user.
for (const userType of ['guest', 'logged-in'] as const) {
  test.describe(`Cart as ${userType}`, () => {
    if (userType === 'logged-in') {
      // All logged-in tests share the one test account's cart, so they must not overlap.
      // 'default' mode runs this group one test after another in a single worker, even with fullyParallel,
      // without making later tests depend on earlier ones. No other spec may touch this account's cart.
      test.describe.configure({ mode: 'default' });

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
    }
    // A guest needs no setup: each browser context has its own cart (Nop.customer cookie), so guest tests run in parallel.

    test(`${userType}: adds a product from its page with the chosen quantity`, async ({ page }) => {
      const header = new Header(page);
      await page.goto(`/${smartphone.slug}`);

      await page.getByLabel('Qty:').fill('3');
      // Attribute fallback: the page also lists other products with their own "Add to cart" buttons
      // (and one form wraps them all), so pick the main product's button by its id.
      await page.locator(`#add-to-cart-button-${smartphone.id}`).click();

      await expect(page.getByText('The product has been added to your shopping cart')).toBeVisible();
      await expect(header.cartLink).toHaveText(/\(3\)/);
    });

    test(`${userType}: adds a product from a category list`, async ({ page }) => {
      const header = new Header(page);
      await page.goto(cellPhonesCategory);
      // Attribute fallback: list boxes have no role or label, so scope by the box class and the product heading.
      const box = page
        .locator('.product-item')
        .filter({ has: page.getByRole('heading', { name: smartphone.name }) });

      await box.getByRole('button', { name: 'Add to cart' }).click();

      await expect(header.cartLink).toHaveText(/\(1\)/);
    });

    test(`${userType}: shows name, unit price, quantity and line total in the cart`, async ({ page }) => {
      const cartPage = new CartPage(page);
      await addToCart(page, laptop.id, 2);

      await cartPage.open();

      await expect(cartPage.heading).toBeVisible();
      await expect(cartPage).toHaveCartLine({
        name: laptop.name,
        unitPrice: laptop.unitPrice,
        quantity: 2,
        lineTotal: '3180.00',
      });
    });

    test(`${userType}: updates line total and counter when the quantity changes`, async ({ page }) => {
      const cartPage = new CartPage(page);
      const header = new Header(page);
      await addToCart(page, smartphone.id, 1);
      await cartPage.open();

      await cartPage.quantityInput(smartphone.name).fill('4');
      await cartPage.updateButton.click();

      await expect(cartPage).toHaveCartLine({
        name: smartphone.name,
        unitPrice: smartphone.unitPrice,
        quantity: 4,
        lineTotal: '400.00',
      });
      await expect(header.cartLink).toHaveText(/\(4\)/);
    });

    test(`${userType}: shows an empty cart after removing the only item`, async ({ page }) => {
      const cartPage = new CartPage(page);
      const header = new Header(page);
      await addToCart(page, smartphone.id, 1);
      await cartPage.open();

      await cartPage.removeCheckbox(smartphone.name).check();
      await cartPage.updateButton.click();

      await expect(cartPage.emptyMessage).toBeVisible();
      await expect(header.cartLink).toHaveText(/\(0\)/);
    });

    test(`${userType}: sums the quantity when the same product is added twice`, async ({ page }) => {
      const cartPage = new CartPage(page);
      const header = new Header(page);
      await addToCart(page, smartphone.id, 1);
      await addToCart(page, smartphone.id, 2);

      await cartPage.open();

      await expect(cartPage.line(smartphone.name)).toHaveCount(1);
      await expect(cartPage).toHaveCartLine({
        name: smartphone.name,
        unitPrice: smartphone.unitPrice,
        quantity: 3,
        lineTotal: '300.00',
      });
      await expect(header.cartLink).toHaveText(/\(3\)/);
    });

    for (const { quantity, message } of invalidQuantities) {
      test(`${userType}: rejects quantity "${quantity}" through the add-to-cart endpoint`, async ({ page }) => {
        const response = await page.request.post(`/addproducttocart/details/${smartphone.id}/1`, {
          form: { [`addtocart_${smartphone.id}.EnteredQuantity`]: quantity },
        });

        expect(response.ok()).toBe(true);
        expect(await response.json()).toEqual({ success: false, message: [message] });
      });
    }

    test(`${userType}: asks for the required options of a configurable product`, async ({ page }) => {
      const { id } = configurableComputer;

      const response = await page.request.post(`/addproducttocart/details/${id}/1`, {
        form: { [`addtocart_${id}.EnteredQuantity`]: 1 },
      });

      expect(response.ok()).toBe(true);
      expect(await response.json()).toEqual({
        success: false,
        message: ['Please select Processor', 'Please select RAM', 'Please select HDD'],
      });
    });

    if (userType === 'guest') {
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
    } else {
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
    }
  });
}
