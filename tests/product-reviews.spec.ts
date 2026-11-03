import { test, expect } from '@playwright/test';

// A real review stacks at most two or three combining marks on one character.
const MAX_COMBINING_MARKS_IN_A_ROW = 4;

test.describe('Product reviews', () => {
  test(
    'review text cannot spill outside its box with stacked combining marks',
    {
      tag: '@known-bug',
      annotation: {
        type: 'known-bug',
        description:
          'Reviews with thousands of stacked combining marks (62,976, 768 and 42 on the product 21 page) ' +
          'paint over the header, menu and form. The shop has no character limit and does not clip ' +
          'overflow on .review-text.',
      },
    },
    async ({ page }) => {
      await page.goto('/productreviews/21');
      await expect(page.getByRole('heading', { name: 'Product reviews for Desktop PC with CDRW' })).toBeVisible();

      // Review texts have no role or accessible name, so a class is the only option. It is scoped to
      // the review list because the write-review textarea has the same class.
      const reviewTexts = page.locator('.product-review-item .review-text');
      await expect(reviewTexts).not.toHaveCount(0);

      // Either fix is valid: limit the stacked marks, or clip the overflow.
      const offenders = await reviewTexts.evaluateAll((elements, maxRun) => {
        return elements.flatMap((element, index) => {
          const runs = element.textContent?.match(/\p{M}+/gu) ?? [];
          const longestRun = runs.reduce((longest, run) => Math.max(longest, run.length), 0);
          const overflow = getComputedStyle(element).overflow;
          return longestRun > maxRun && overflow === 'visible' ? [{ index, longestRun, overflow }] : [];
        });
      }, MAX_COMBINING_MARKS_IN_A_ROW);

      expect(offenders).toEqual([]);
    },
  );
});
