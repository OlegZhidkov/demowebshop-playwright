import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  private readonly emailField: Locator;
  private readonly passwordField: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.emailField = page.getByLabel('Email:');
    this.passwordField = page.getByLabel('Password:', { exact: true });
    this.rememberMeCheckbox = page.getByLabel('Remember me?');
    this.submitButton = page.getByRole('button', { name: 'Log in' });
  }

  async open() {
    await this.page.goto('/login');
  }

  /** Fills and submits the form on the current page, so it also works after a ReturnUrl redirect. */
  async logIn(email: string, password: string, options: { rememberMe?: boolean } = {}) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    if (options.rememberMe) await this.rememberMeCheckbox.check();
    await this.submitButton.click();
  }
}
