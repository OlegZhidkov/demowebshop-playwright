import type { Locator, Page } from '@playwright/test';

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

  async logout() {
    await this.logoutLink.click();
  }
}
