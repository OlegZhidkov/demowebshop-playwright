import { expect, type Locator, type Page } from '@playwright/test';

export class Header {
  readonly registerLink: Locator;
  readonly loginLink: Locator;
  readonly logoutLink: Locator;

  constructor(private readonly page: Page) {
    this.registerLink = page.getByRole('link', { name: 'Register', exact: true });
    this.loginLink = page.getByRole('link', { name: 'Log in', exact: true });
    this.logoutLink = page.getByRole('link', { name: 'Log out', exact: true });
  }

  accountLink(email: string) {
    return this.page.getByRole('link', { name: email, exact: true });
  }

  async expectLoggedOut() {
    await expect(this.loginLink).toBeVisible();
    await expect(this.registerLink).toBeVisible();
    await expect(this.logoutLink).toHaveCount(0);
  }

  async expectLoggedInAs(email: string) {
    await expect(this.accountLink(email)).toBeVisible();
    await expect(this.logoutLink).toBeVisible();
    await expect(this.loginLink).toHaveCount(0);
    await expect(this.registerLink).toHaveCount(0);
  }

  async logout() {
    await this.logoutLink.click();
  }
}
