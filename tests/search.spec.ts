import { test, expect, type Page } from '@playwright/test';

test.describe('Product search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // The header search box has no label or accessible name, so a role locator cannot target it.
  const searchFor = async (page: Page, term: string) => {
    await page.locator('#small-searchterms').fill(term);
    await page.getByRole('button', { name: 'Search' }).click();
  };

  test('finds a product by name', async ({ page }) => {
    await searchFor(page, 'laptop');

    await expect(page.getByRole('heading', { name: '14.1-inch Laptop' })).toBeVisible();
  });

  test('shows a message when nothing matches', async ({ page }) => {
    await searchFor(page, 'zzzzqq');

    await expect(page.getByText('No products were found that matched your criteria.')).toBeVisible();
  });

  test('rejects a search term shorter than 3 characters', async ({ page }) => {
    await searchFor(page, 'a');

    await expect(page.getByText('Search term minimum length is 3 characters')).toBeVisible();
  });
});
