import { $ } from '@wdio/globals';

export class WalletSetupScreen {
  get nameInput() {
    return $('android=new UiSelector().className("android.widget.EditText")');
  }

  get nextButton() {
    return $('android=new UiSelector().text("Next")');
  }

  get titleText() {
    return $('android=new UiSelector().text("Name Your Wallet")');
  }

  get secureWalletTitle() {
    return $('android=new UiSelector().text("Secure Your Wallet")');
  }

  async enterWalletName(name: string) {
    await this.nameInput.waitForDisplayed({ timeout: 10000 });
    await this.nameInput.click();
    await this.nameInput.setValue(name);
  }

  async tapNext() {
    await this.nextButton.waitForEnabled({ timeout: 5000 });
    await this.nextButton.click();
  }

  async isOnNameScreen(): Promise<boolean> {
    return this.titleText.isDisplayed();
  }

  async isOnSecureWalletScreen(): Promise<boolean> {
    return this.secureWalletTitle.isDisplayed();
  }
}
