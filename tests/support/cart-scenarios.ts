import { test } from '@playwright/test';
import { CartPage } from '../pages/cart-page';
import { Header } from '../pages/header';
import { addToCart } from './cart';
import { expect } from './matchers';
import { cellPhonesCategory, configurableComputer, laptop, smartphone } from './products';

/** Cart tests shared by the guest and logged-in specs. The calling spec decides who the user is. */
export function defineCartTests(userType: 'guest' | 'logged-in') {
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

  const invalidQuantities = [
    { quantity: '0', message: 'Quantity should be positive' },
    { quantity: '-1', message: 'Quantity should be positive' },
    { quantity: 'abc', message: 'Quantity should be positive' },
    { quantity: '10001', message: 'The maximum quantity allowed for purchase is 10000.' },
  ];
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
}
