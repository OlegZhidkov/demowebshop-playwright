import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly heading: Locator;
  readonly updateButton: Locator;
  readonly emptyMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Shopping cart' });
    this.updateButton = page.getByRole('button', { name: 'Update shopping cart' });
    this.emptyMessage = page.getByText('Your Shopping Cart is empty!');
  }

  async open() {
    await this.page.goto('/cart');
  }

  line(productName: string) {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('link', { name: productName, exact: true }) });
  }

  // The quantity input and remove checkbox have no accessible name, so they are found inside the product's row.
  // Attribute fallback: name^="itemquantity" / name="removefromcart" are the only stable hooks.
  quantityInput(productName: string) {
    return this.line(productName).locator('input[name^="itemquantity"]');
  }

  removeCheckbox(productName: string) {
    return this.line(productName).locator('input[name="removefromcart"]');
  }

  // Attribute fallback: price cells have no role or label; these classes are the only way to tell unit price from line total.
  unitPrice(productName: string) {
    return this.line(productName).locator('.product-unit-price');
  }

  lineTotal(productName: string) {
    return this.line(productName).locator('.product-subtotal');
  }
}
