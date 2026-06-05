# Submission

## Deliverables

- **Source code** — this repository
- **Demo video** — attached (see `demo.mp4` / submission form)
- **APK** — Android release build (`android/app/build/outputs/apk/release/`)

---

## Platform

**Android only.**

iOS build was failing during development — a native module linking issue that could not be resolved within the task window. This was raised with the team. Development and testing proceeded on Android (physical device + emulator).

All features were built and verified on Android. The app is architecturally platform-agnostic (Expo Router, React Native, WDK hooks) and should work on iOS once the build issue is resolved.

---

## What's Implemented

- Wallet creation with BIP39 seed phrase generation and backup confirmation
- Wallet import from existing seed phrase
- Multi-wallet support — create and switch between wallets, each with a custom avatar
- Portfolio balance — aggregated USD value across ETH (on-chain RPC) and ERC20 tokens (USDT, XAUt via indexer)
- Receive — token/network selection, QR code display, clipboard copy, QR scanner
- Send — full flow: token → network → recipient (QR or manual) → amount with token/fiat toggle → gas estimate → confirmation modal with Etherscan link
- Transaction history — indexer-sourced, sent/received classification, USD values, tap to open on Etherscan
- Biometric lock/unlock — locks on background, prompts on foreground return
- Settings — delete wallet

---

## Known Callouts

**ETH transactions not visible in activity:**
The indexer API does not return native ETH transactions — only ERC20 token transfers (USDT, XAUt). This is a known limitation of the indexer endpoint, not a bug in the app. All other flows (send, receive, balance) work correctly for ETH. The architecture supports adding an ETH-specific RPC history source without restructuring.

**Biometric gate is app-layer only:**
WDK sets `requireBiometrics: false`, meaning the private key is not hardware-bound to biometrics. The biometric prompt is a UX gate implemented entirely at the app layer. This is intentional by WDK design and is called out in `ARCHITECTURE.md`.

---

## Running the App

```bash
npm install
npx expo run:android       # development build on connected device / emulator
```

To install the pre-built release APK directly:
```bash
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

---

## Running E2E Tests

Tests use WebDriverIO + Appium against a connected Android device.

```bash
# Ensure Appium is running and a device is connected
npm run test:e2e
```

Specs are in `test/e2e/specs/`. The wallet creation flow is covered in `wallet-creation.e2e.ts`.
