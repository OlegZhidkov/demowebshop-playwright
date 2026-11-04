import { test as base, type Page } from '@playwright/test';
import { logInWithoutForm } from './utils/auth';

export { expect } from './utils/matchers';

type Fixtures = {
  /** A page logged in as the shared test customer. The account is shared, so do not change its data. */
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page, context, baseURL }, use) => {
    await logInWithoutForm(context, baseURL!);
    await use(page);
  },
});
