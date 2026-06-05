# Submission

## Starting Point

Built on top of the **WDK starter kit** (Expo + React Native shell with WDK packages pre-installed). All screens, navigation, business logic, and architecture were built on top of it.

---

## Platform

**Android only.** iOS had a native module linking issue that could not be resolved in the task window. All features were built and verified on Android.

---

## What's Implemented

- Wallet creation — BIP39 seed phrase, backup confirmation
- Wallet import — paste or manual entry of seed phrase
- Multi-wallet — create, switch, per-wallet avatar
- Portfolio balance — ETH (on-chain RPC) + USDT / XAUt (indexer), aggregated in USD
- Receive — token/network selection, QR display, clipboard copy, QR scanner
- Send — token → network → recipient → amount (token/fiat toggle) → gas estimate → confirmation → Etherscan link
- Transaction history — indexer-sourced, sent/received, USD values
- Biometric lock — locks on background, prompts on foreground

---

## Known Callouts

- **ETH transactions missing from activity** — the indexer returns ERC20 transfers only (USDT, XAUt), not native ETH transfers. Balance and send/receive work correctly for ETH.
- **Biometric gate is app-layer only** — WDK is configured with `requireBiometrics: false`. The biometric prompt is a UX gate, not cryptographic key binding.

---

## Running the App

```bash
npm install
npx expo run:android
```

Pre-built APK:
```bash
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

E2E tests (Appium, connected device required):
```bash
npm run test:e2e
```

---

## Reference Docs

| File | Contents |
|---|---|
| `ARCHITECTURE.md` | SDK boundary, folder structure, state and auth patterns |
| `AI_USAGE.md` | How AI was used during development |
