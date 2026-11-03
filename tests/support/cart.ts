import { expect, type Page } from '@playwright/test';

// Both helpers use page.request, which shares the browser context's cookies,
// so they act on the same cart (guest or logged-in) as the page itself.

export async function addToCart(page: Page, productId: number, quantity: number) {
  const response = await page.request.post(`/addproducttocart/details/${productId}/1`, {
    form: { [`addtocart_${productId}.EnteredQuantity`]: quantity },
  });
  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({ success: true });
}

/** Removes every line from the cart. Line ids are read from the cart page, never hardcoded. */
export async function emptyCart(page: Page) {
  const html = await (await page.request.get('/cart')).text();
  const lineIds = [...html.matchAll(/<input[^>]*name="removefromcart"[^>]*>/g)].flatMap((tag) => {
    const id = /value="(\d+)"/.exec(tag[0])?.[1];
    return id ? [id] : [];
  });
  if (lineIds.length === 0) return;

  const body = new URLSearchParams();
  for (const id of lineIds) body.append('removefromcart', id);
  body.append('updatecart', 'Update shopping cart');
  const response = await page.request.post('/cart', {
    data: body.toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
  expect(response.ok()).toBe(true);
}
