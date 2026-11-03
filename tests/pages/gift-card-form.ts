import type { Locator, Page } from '@playwright/test';

export interface GiftCardDetails {
  recipientName: string;
  recipientEmail?: string;
  senderName: string;
  senderEmail?: string;
}

/** The gift card form on a gift card's product page. Physical cards have no email fields. */
export class GiftCardForm {
  readonly recipientName: Locator;
  readonly recipientEmail: Locator;
  readonly senderName: Locator;
  readonly senderEmail: Locator;

  constructor(page: Page) {
    this.recipientName = page.getByLabel("Recipient's Name:");
    this.recipientEmail = page.getByLabel("Recipient's Email:");
    this.senderName = page.getByLabel('Your Name:');
    this.senderEmail = page.getByLabel('Your Email:');
  }

  async fill(details: GiftCardDetails) {
    await this.recipientName.fill(details.recipientName);
    if (details.recipientEmail) await this.recipientEmail.fill(details.recipientEmail);
    await this.senderName.fill(details.senderName);
    if (details.senderEmail) await this.senderEmail.fill(details.senderEmail);
  }
}
