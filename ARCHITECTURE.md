# Architecture

## SDK vs App Boundary

The WDK owns everything below the UX layer:

| WDK Owns | App Owns |
|---|---|
| Seed phrase & private key storage (Keychain / Keystore) | All screens and navigation (Expo Router) |
| Wallet state in Zustand — active wallet ID, wallet list, unlock status | Wallet creation / import UX |
| Core hooks: `useWalletManager`, `useAccount`, `useAddresses`, `useRefreshBalance` | Balance aggregation across assets and networks |
| Transaction execution | Send / Receive flows with gas estimation |
| UI kit components (`TransactionItem`, `Balance`, `CryptoAddressInput`) | Transaction history via indexer |
| Biometric key binding config (`requireBiometrics: false`) | Biometric lock / unlock gate at the app layer |

Key callout: `requireBiometrics: false` means the private key is **not** hardware-bound to biometrics. The biometric prompt is a UX gate owned entirely by the app — not cryptographic enforcement inside the SDK. The app must consciously protect this gate.

---

## Folder Structure

```
src/
├── app/              # Expo Router routes — 1-line re-exports only, zero logic
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
├── services/         # External integrations (pricing, indexer)
├── config/           # Static app-wide config (assets, networks, wdk-assets)
├── constants/        # colors
├── utils/            # Pure stateless functions
└── types/
```

**Rationale:**
- `app/` is pure routing. Every file is a single re-export: `export { default } from '@/modules/wallet/screens/WalletScreen'`. No UI logic, no imports, no hooks live here.
- Each module is self-contained — screens, sub-components, hooks, and utils co-located. A feature can be read, changed, or deleted without touching other modules.
- Shared code lives parallel to modules (not inside any one module), keeping the boundary explicit: if two modules need it, it goes in `components/`, `hooks/`, or `utils/`.
- `services/` and `config/` are singletons — one pricing service, one asset config, one network config. No duplication across modules.
- This scales cleanly: adding a new feature = add a new folder under `modules/`. Nothing else changes.

---

## State Architecture

- **Wallet state** — read directly from WDK's Zustand hooks (`useWalletManager`, `useAccount`). No parallel state maintained in the app.
- **Balance state** — two independent sources aggregated by `use-wallet-balances`:
  - `useRefreshBalance` (on-chain RPC) for native ETH
  - Indexer API (`use-indexer-balances`) for ERC20 tokens (USDT, XAUt)
- **Navigation state** — Expo Router file-based. Auth transitions use `router.replace` so the wallet screen is never reachable via back navigation from the lock screen.
- **UI state** — local `useState` per screen. No global UI state store.

---

## Auth Architecture

```
AppLockController (global, mounts once)
  └── listens to AppState
  └── on 'background' → WDK lock() + router.replace('/authorize')
  └── suppressLock flag wraps native dialogs (share sheet, camera, biometric prompt itself)

AuthorizeScreen
  └── on mount, waits for AppState === 'active' before triggering biometric prompt
  └── hasTriggeredRef prevents double-trigger
  └── on success → router.replace('/wallet')
```

The `suppressLock` flag prevents re-lock loops: Face ID briefly backgrounds the app, which would trigger another lock without this guard.

The AppState wait on mount fixes the bug where `authenticateAsync` was called while the screen was still transitioning to background — the native dialog cannot render on a dark/locked screen, causing the promise to hang indefinitely.

---

## Implementation Order

1. **Project setup** — mapped starter kit scaffolding, understood WDK hook surface
2. **Wallet creation & import** — seed phrase generation, import flow, biometric lock on creation
3. **Multi-wallet** — wallet switcher, switch without re-authenticating, per-wallet avatars
4. **Balance** — `use-wallet-balances` aggregating USD values across ETH (RPC) and tokens (indexer)
5. **Receive** — token/network selection, QR display, clipboard copy, QR scanner
6. **Send** — full flow: token → network → recipient → amount with fiat toggle → gas estimate → confirmation with Etherscan link
7. **Activity** — transaction history via indexer, sent/received classification, USD values
8. **Folder refactor** — moved from flat starter kit to module-based architecture
9. **Bug fixes** — balance sync after send, auth loader stuck on phone lock
10. **TypeScript** — removed all `any` types across the codebase
11. **Tests** — E2E wallet creation flow

---

## Security

**Handled correctly:**
- Seed phrase and private keys stored in Keychain (iOS) / Keystore (Android) by WDK — app never holds raw key material
- App locks on every background event — wallet content is never visible in the OS app switcher
- BIP39 mnemonic validated before passing to WDK's `restoreWallet`
- `suppressLock` wraps native share dialogs and camera to avoid false re-locks
- `router.replace` on all auth transitions — wallet screen never reachable via back navigation

**Known tradeoffs (documented, not bugs):**
- Mnemonic passes through navigation params during setup (`SecureWallet → ConfirmPhrase → Complete`). WDK commits it to Keychain immediately on creation, limiting exposure window. Production hardening: transient secure store reference instead of raw param.
- Mnemonic held in `useState` during setup — in JS heap until unmount, not persisted to disk.
- Clipboard clear timeout is 60s after copying seed phrase. Conservative would be 10–15s.
- No OS-level screenshot prevention on seed phrase screen. Android supports `FLAG_SECURE`; iOS has no enforcement equivalent.
- `EXPO_PUBLIC_*` API keys (Pimlico, indexer) are bundled in the binary — current keys are Sepolia testnet only. Production: proxy through backend.
- Devices with no biometrics and no passcode return `success: true` from `authenticateBiometric` to avoid lockout. Production should require at least a passcode.

The mnemonic is never written to AsyncStorage, MMKV, or any unencrypted store at any point in the app layer.

---

## Known Callouts

- **Indexer does not return native ETH transactions** — only ERC20 token transfers (USDT, XAUt). Transaction history reflects token activity only. Architecture is open to adding an ETH-specific RPC source without restructuring.
- **Dual balance sources require manual double-refresh** — `useRefreshBalance` and the indexer don't sync automatically after a transaction. Fixed by triggering both on `useFocusEffect` and immediately after a successful send.
- **`requireBiometrics: false`** — the app owns the entire auth gate. This is intentional by WDK design but requires the app to be careful about every path that could bypass the biometric check.
