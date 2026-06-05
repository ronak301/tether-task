import { expect } from '@wdio/globals';
import { HomeOnboardingScreen } from '../pageObjects/home-onboarding-screen';
import { WalletSetupScreen } from '../pageObjects/wallet-setup-screen';

const onboarding = new HomeOnboardingScreen();
const walletSetup = new WalletSetupScreen();

describe('Wallet Creation Flow', () => {
  it('onboarding shows welcome and both CTAs', async () => {
    const { titleText, subtitleText } = await onboarding.getTitleAndSubtitleWelcomeMessage();
    expect(titleText).toContain('Welcome!');
    expect(subtitleText).toContain('Set up your wallet');

    await onboarding.getCreateWalletButton().waitForDisplayed({ timeout: 10000 });
    await onboarding.getImportWalletButton().waitForDisplayed({ timeout: 10000 });
  });

  it('tapping Create Wallet navigates to name wallet screen', async () => {
    const createButton = onboarding.getCreateWalletButton();
    await createButton.waitForDisplayed({ timeout: 10000 });
    await createButton.click();

    const onNameScreen = await walletSetup.isOnNameScreen();
    expect(onNameScreen).toBe(true);
  });

  it('Next button is disabled until a name is entered', async () => {
    const nextButton = walletSetup.nextButton;
    await nextButton.waitForDisplayed({ timeout: 5000 });
    const enabled = await nextButton.isEnabled();
    expect(enabled).toBe(false);
  });

  it('entering a name enables the Next button and advances to seed phrase screen', async () => {
    await walletSetup.enterWalletName('Test Wallet');

    const nextButton = walletSetup.nextButton;
    const enabled = await nextButton.isEnabled();
    expect(enabled).toBe(true);

    await walletSetup.tapNext();

    // Seed phrase screen must appear — wallet creation completed inside WDK
    await walletSetup.secureWalletTitle.waitForDisplayed({ timeout: 15000 });
    const onSecure = await walletSetup.isOnSecureWalletScreen();
    expect(onSecure).toBe(true);
  });
});
