# Tether Wallet — WDK Task Submission

A non-custodial Ethereum wallet built on the WDK (Wallet Development Kit) starter kit. Supports wallet creation, import, multi-wallet switching, USDT / XAUt / ETH balances, send, receive, and transaction history — all on Sepolia testnet.

---

## Run

```bash
npm install
npx expo run:android          # development build
```

Install pre-built APK:
```bash
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

E2E tests (Appium + connected device):
```bash
npm run test:e2e
```

---

## What's Inside

| Feature | Location |
|---|---|
| Wallet creation / import | `src/modules/wallet-setup/screens/` |
| Home screen, assets, token details | `src/modules/wallet/screens/` |
| Send flow | `src/modules/send/screens/` |
| Receive / QR | `src/modules/receive/screens/` |
| Transaction history | `src/modules/activity/screens/` |
| Biometric lock | `src/modules/auth/` |
| Settings | `src/modules/settings/screens/` |
| Balance aggregation hook | `src/modules/wallet/hooks/use-wallet-balances.ts` |
| Indexer (USDT/XAUt) hook | `src/hooks/use-indexer-balances.ts` |
| Pricing service | `src/services/pricing-service.ts` |
| Asset / network config | `src/config/` |
| E2E tests | `test/e2e/` |

---

## Environment

Keys are already set in `.env` for Sepolia testnet. No additional setup needed to run.

---

## Reference Docs

- **[SUBMISSION.md](SUBMISSION.md)** — what's implemented, known callouts, platform notes
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — SDK boundary, folder structure, state and auth patterns
- **[AI_USAGE.md](AI_USAGE.md)** — how AI was used during development
