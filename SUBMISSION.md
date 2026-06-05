# Tether Wallet — Submission Notes

## AI Tools Used

- **Claude Code (Anthropic)** — used throughout for code generation, debugging, architecture decisions, and iterative development directly from the terminal.

---

## Approach

### WDK vs App Layer Boundary

First step was understanding what the WDK owns vs what the app must build.

**WDK handles:**
- Seed phrase & private key storage (Keychain on iOS, Keystore on Android)
- Wallet state in Zustand — active wallet ID, wallet list, unlock status
- Core hooks: `useWalletManager`, `useAccount`, `useAddresses`, `useRefreshBalance`
- Transaction execution and UI kit components

**App layer built:**
- All screens, navigation flows (Expo Router)
- Wallet creation/import UX, multi-wallet switching
- Balance aggregation across assets and networks
- Send/Receive flows with gas fee estimation
- Transaction history via the indexer
- Biometric lock/unlock — WDK sets `requireBiometrics: false`, meaning the key is not hardware-bound to biometrics. The biometric check is a **UX gate at the app layer**, not cryptographic enforcement inside the SDK. This is deliberate by design and the app must consciously implement and protect this gate.
- App lock on background, auth prompt on foreground return

### Architecture Decisions

- **Seed storage** — fully delegated to WDK. App never touches raw key material.
- **Wallet metadata** — read directly from WDK's Zustand hooks, no parallel state maintained.
- **Biometric gate** — enforced via `AppLockController` (locks on background) + `AuthorizeScreen` (prompts on foreground). Guard logic prevents false triggers from native dialogs and biometric prompt itself briefly backgrounding the app.
- **Navigation** — `router.replace` for all auth transitions so the wallet screen is never in the back stack behind the lock screen.

### Folder Structure

Extended the starter kit's flat structure with a module-based architecture:

```
src/
├── app/              # Expo Router routes only — 1-line re-exports, no logic
├── modules/          # One folder per feature domain
│   ├── wallet/       screens/ components/ hooks/ utils/
│   ├── send/         screens/ utils/
│   ├── receive/      screens/ constants/
│   ├── activity/     screens/ hooks/
│   ├── auth/         screens/ components/ utils/
│   ├── settings/     screens/
│   ├── onboarding/   screens/ components/
│   └── wallet-setup/ screens/
├── components/       # Shared UI across 2+ modules
├── hooks/            # Shared hooks across 2+ modules
├── services/         # External integrations
├── config/           # Static app-wide config
├── constants/        # colors
├── utils/            # Pure stateless functions
└── types/
```

- `app/` is pure routing — every file is a single re-export pointing to `modules/`
- Each module is self-contained — screens, sub-components, hooks, and utils co-located
- Shared code lives parallel to modules, kept flat with no sub-nesting

### Implementation Order

1. **Project setup** — booted starter kit, mapped existing scaffolding
2. **Wallet creation & import** — seed phrase generation, import flow, biometric lock on creation
3. **Multi-wallet** — wallet switcher in header, switch without re-authenticating
4. **Balance** — `use-wallet-balances` hook aggregating USD values across assets
5. **Receive** — token/network selection, QR display, clipboard copy, QR scanner
6. **Send** — full flow: token → network → recipient → amount with fiat toggle → gas estimate → confirmation modal with Etherscan link
7. **Activity** — transaction history via indexer, sent/received classification, USD values
8. **Bug fixes** — balance sync after send, auth loader stuck on phone lock (see Key Challenges)

---

## WDK Feedback

- **`requireBiometrics: false`** — key is not hardware-bound to biometrics. The app must own and protect the auth gate entirely. Important distinction for any production app on WDK.
- **Dual data sources** — `useRefreshBalance` (on-chain) and indexer hooks are independent. They don't sync automatically after a transaction, requiring manual double-refresh on screen focus.
- **`clearSensitiveDataOnBackground` timing** — WDK clears data on background, but biometric prompts (Face ID) also briefly background the app. The `isBiometricAuthInProgress` flag handles this, but requires careful wiring to avoid re-lock loops.
- **Indexer does not surface native ETH transactions** — only token transfers (USDT, XAUt) are returned. Implemented all flows with this known callout. Architecture is open to adding an ETH-specific source without restructuring.
- **Network-scoped accounts** — `useAccount` is scoped per `accountIndex + network`. Correct model for multi-chain, but took time to understand for gas estimation wiring.

---

## Security Considerations

**Handled correctly:**
- Seed phrase and private keys stored in Keychain/Keystore by WDK — app never holds raw key material
- App locks on every background event — wallet content never visible in OS app switcher
- BIP39 validation on import before passing to WDK
- `suppressLock` correctly wraps native share dialogs to avoid false re-locks
- `router.replace` on all auth transitions — wallet screen never reachable via back navigation

**Known tradeoffs:**
- Mnemonic passes through navigation params during setup flow (`SecureWallet → ConfirmPhrase → Complete`). WDK commits it to Keychain immediately on wallet creation, limiting exposure window. Production hardening: transient secure store reference instead of raw param.
- Mnemonic held in `useState` during setup — in JS heap until unmount. Not persisted to disk. Production hardening: explicit cleanup on unmount.
- Clipboard clear timeout is 60s after copying seed phrase. Conservative would be 10–15s.
- No OS-level screenshot prevention on seed phrase screen. Android supports `FLAG_SECURE`; iOS has no enforcement equivalent.
- `EXPO_PUBLIC_*` API keys (Pimlico, indexer) are bundled in the binary — current keys are sepolia testnet. Production would proxy through backend.
- Devices with no biometrics and no passcode bypass the auth gate (`authenticateBiometric` returns `success: true` to avoid lockout). Production should require at least a passcode.

The mnemonic is never written to AsyncStorage, MMKV, or any unencrypted store at any point.

---

## Key Challenges

**1. Balance not updating after send**
`useRefreshBalance` and the indexer are independent data sources — refreshing one doesn't update the other. Fixed by triggering both simultaneously on `useFocusEffect` and immediately after a successful transaction.

**2. Auth screen stuck on loader after phone lock**
When the phone screen turned off, `AppLockController` navigated to the auth screen and `LocalAuthentication.authenticateAsync` was called while the app was still transitioning to background. The native dialog can't render on a dark/locked screen, so the promise hung indefinitely — leaving `isLoading: true` forever.

Fixed by checking `AppState.currentState` on mount. If not yet active, wait for the `'active'` event before triggering the prompt. This ensures the biometric dialog only fires once the user has returned to the app.
