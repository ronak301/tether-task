# Architecture

## SDK vs App Boundary

| WDK owns | App owns |
|---|---|
| Seed phrase & private key storage (Keychain / Keystore) | All screens and navigation (Expo Router) |
| Wallet state — active wallet ID, list, unlock status | Wallet creation / import UX |
| Core hooks: `useWalletManager`, `useAddresses`, `useRefreshBalance` | Balance aggregation across assets |
| Transaction execution | Send / Receive flows with gas estimation |
| UI kit components (`TransactionItem`, `Balance`, `CryptoAddressInput`) | Transaction history via indexer |

`requireBiometrics: false` — the private key is not hardware-bound to biometrics. The biometric prompt is a UX gate owned by the app, not enforced inside WDK.

---

## Folder Structure

```
src/
├── app/              # Expo Router routes — 1-line re-exports, zero logic
├── modules/          # One folder per feature domain
│   ├── wallet/       screens/  components/  hooks/  utils/
│   ├── send/         screens/  utils/
│   ├── receive/      screens/  constants/
│   ├── activity/     screens/  hooks/
│   ├── auth/         screens/  components/  utils/
│   ├── settings/     screens/
│   ├── onboarding/   screens/  components/
│   └── wallet-setup/ screens/
├── components/       # Shared UI used across 2+ modules
├── hooks/            # Shared hooks used across 2+ modules
├── services/         # Pricing service (Bitfinex)
├── config/           # Asset config, network config, WDK asset definitions
├── constants/        # Colors
└── utils/            # Pure stateless helpers
```

Each module is self-contained. `app/` is pure routing only. Shared code lives at the top level (`components/`, `hooks/`, `utils/`).

---

## State Patterns

- **Wallet state** — read directly from WDK Zustand hooks. No parallel state in the app.
- **Balances** — two independent sources merged by `use-wallet-balances`: RPC for native ETH, indexer API for ERC20 (USDT, XAUt).
- **UI state** — local `useState` per screen. No global UI store.
- **Navigation** — `router.replace` on all auth transitions so the wallet screen is never reachable via back navigation from the lock screen.

---

## Auth Flow

```
AppLockController (global, mounts once)
  └── AppState 'background' → WDK lock() + navigate to /authorize
  └── suppressLock flag wraps native dialogs (share sheet, camera)

AuthorizeScreen
  └── waits for AppState === 'active' before triggering biometric prompt
  └── on success → router.replace('/wallet')
```

`suppressLock` prevents the re-lock loop where Face ID briefly backgrounds the app, which would otherwise trigger another lock immediately.

---

## Security Notes

- Private keys and seed phrases stored in Keychain / Keystore by WDK — never in AsyncStorage or JS memory beyond the setup flow
- BIP39 validation handled by WDK's `restoreWallet` — no redundant wordlist in the app layer
- Mnemonic passes through navigation params during setup only; WDK commits to Keychain on creation
- `EXPO_PUBLIC_*` API keys are Sepolia testnet keys bundled in the binary — production would proxy through a backend
