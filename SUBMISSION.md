# Tether Wallet — Submission Notes

## AI Tools Used

- **Claude Code (Anthropic)** — primary agentic coding tool used throughout the build. Used for code generation, debugging, architecture decisions, and iterative feature development directly from the terminal.

---

## How I Approached the Challenge

### Understanding the Architecture First

Before writing any feature code, I spent time understanding the WDK's architecture — what it owns, what it exposes, and where the app layer is expected to take over.

**WDK responsibilities:**
- Wallet key management and encrypted storage (via `WdkReactNativeProvider`)
- Account abstraction — each wallet is identified by a string ID (e.g. `wallet_name_0`) and scoped per network via `accountIndex + network`
- Core hooks: `useWalletManager`, `useAccount`, `useAddresses`, `useRefreshBalance`
- Transaction execution (`useSendTransaction`, `useTransferToken`)
- UI kit components (`Balance`, `TransactionItem`, `CryptoAddressInput`) for consistent rendering

**App layer responsibilities (what I had to build):**
- All navigation and screen flows (Expo Router file-based routing)
- Wallet creation/import UX, multi-wallet switching
- Balance aggregation across assets and networks
- Send/Receive flows with gas estimation
- Transaction history via the indexer
- Biometric lock/unlock gate (the WDK stores the wallet key with `requireBiometrics: false` — meaning the key is not hardware-bound to biometrics. The biometric check is a UX gate implemented at the app layer using `expo-local-authentication`, not a cryptographic enforcement inside the SDK. This is a deliberate SDK design choice that the app must consciously handle.)
- App state management (lock on background, auth on foreground)

Understanding this boundary upfront was critical. The WDK is not a black box — it handles key custody and transaction signing, but the entire user-facing security model (when to lock, when to prompt, what to show) is the app's responsibility.

### Key Architecture Decisions

**Seed phrase storage** — the BIP-39 seed phrase and derived private keys are stored in the device's secure enclave (Keychain on iOS, Keystore on Android). This is handled entirely by the WDK — the app never touches raw key material. I consciously chose not to re-implement or wrap this, since rolling your own secure storage for private keys is high-risk and the WDK's implementation is the correct place for it.

**Wallet metadata in Zustand** — the WDK manages the rest of the wallet state (active wallet ID, wallet list, unlock status) in a Zustand store exposed via its hooks. The app layer reads from these hooks directly rather than maintaining a parallel state. This kept the app code lean and avoided state sync bugs.

**Biometric as a UX gate, not a key binding** — as noted above (`requireBiometrics: false`), the biometric check is enforced at the app layer. I implemented this via `AppLockController` (locks on background) and `authorize.tsx` (prompts on return to foreground), with guard logic to avoid false triggers from native dialogs or the biometric prompt itself briefly backgrounding the app.

**Navigation model** — used Expo Router's file-based routing with `router.replace` (not `push`) for auth transitions so the back stack never exposes the wallet screen behind the lock screen.

### Folder Structure — Thought Process

The starter kit ships with a flat structure (`components/`, `hooks/`, `utils/`) which works fine for a small codebase but doesn't scale — you end up with a `components/` folder that mixes wallet-specific UI with shared primitives, and there's no clear home for where screen logic lives.

I extended it using a **module-based architecture** while keeping the starter kit's conventions intact:

```
src/
├── app/              # Expo Router routes only — each file is a 1-line re-export
├── modules/          # One folder per feature domain
│   ├── wallet/       screens/ components/ hooks/ utils/
│   ├── send/         screens/ utils/
│   ├── receive/      screens/ constants/
│   ├── activity/     screens/ hooks/
│   ├── auth/         screens/ components/ utils/
│   ├── settings/     screens/
│   ├── onboarding/   screens/ components/
│   └── wallet-setup/ screens/
├── components/       # Shared UI used across 2+ modules
├── hooks/            # Shared hooks used across 2+ modules
├── services/         # External integrations (pricing)
├── config/           # Static app-wide config
├── constants/        # colors, etc.
├── utils/            # Pure stateless functions
└── types/            # Shared TypeScript types
```

**Key decisions:**

- `app/` is purely Expo Router infrastructure — no business logic, no JSX, just re-exports. This means you can read the entire routing structure at a glance without wading through screen code.
- Each module is self-contained — a new engineer working on `send/` only needs to look inside `modules/send/`. Screen logic, sub-components, and domain utils are co-located.
- `components/`, `hooks/`, `services/` live parallel to modules and are strictly for code shared across two or more modules. Anything used by only one module lives inside that module.
- The starter kit's flat structure is preserved for shared code — no deep nesting in shared folders, just flat files. The hierarchy only appears at the module level where it carries meaning.

### Breaking Down Requirements

With the architecture clear, I mapped each requirement to the correct layer:

1. Wallet creation and import (seed phrase) — app UX over `useWalletManager`
2. Multi-wallet support with switching — app state + `setActiveWalletId`
3. Balance display per wallet — custom aggregation hooks over WDK + indexer
4. Send and Receive flows — app screens + WDK transaction hooks
5. Transaction history — indexer integration
6. Biometric lock/unlock — app-layer gate using `expo-local-authentication`

I treated these as vertical slices — each one independently shippable — and worked through them in order of dependency.

### Order of Implementation

1. **Project setup** — ran the WDK starter kit, confirmed it booted, explored the existing scaffolding (WDK provider, routing structure, existing onboarding screens).

2. **Wallet creation & import** — implemented the wallet setup flow: create via seed phrase generation, import via existing phrase, wallet naming, and biometric lock on creation.

3. **Multi-wallet support** — added a wallet switcher component in the home screen header, allowing creating and switching between multiple wallets without re-authenticating.

4. **Balance per wallet** — integrated `useIndexerBalances` and `useWalletBalances` hooks to fetch and display per-asset balances. Built a custom `use-wallet-balances` hook to aggregate USD values across assets.

5. **Receive flow** — built token and network selection screens, QR code display with clipboard copy, and a scan-QR screen using the device camera.

6. **Send flow** — built the full send flow: token selection → network selection → recipient address input with validation, amount input with fiat/token toggle, gas fee estimation, and a confirmation modal with Etherscan link.

7. **Transaction history** — added an Activity screen and a summary on the wallet home screen using the indexer, with sent/received classification and USD value display.

8. **Bug fixes** — fixed a wallet sync issue where balance wasn't refreshing after transactions, and fixed an auth race condition where the biometric prompt was being called while the phone screen was still off (causing an infinite loader).

---

## Notable Feedback on WDK

- **`requireBiometrics: false` is intentional but needs to be called out** — the WDK stores the wallet encryption key without biometric access control. This means the biometric check in the app is purely a UX gate, not a hardware-enforced security layer. This is a reasonable design choice (it avoids lockout scenarios when biometrics fail), but it's important for any app built on the WDK to understand this distinction and ensure the app-layer gate is correctly implemented and not bypassable.

- **`useRefreshBalance` vs indexer data** — there's a subtle split between on-chain balance (via `useRefreshBalance`) and indexer-sourced token transfers (via the indexer hooks). These don't always stay in sync immediately after a transaction, which required manually triggering both refreshes on screen focus.

- **`clearSensitiveDataOnBackground` interaction** — the WDK clears sensitive data when the app backgrounds, which is the right security behaviour, but it creates a timing conflict with in-app biometric prompts (e.g. Face ID briefly backgrounds the app). The existing `isBiometricAuthInProgress` flag handles this, but it requires careful wiring.

- **Indexer does not return native ETH transactions** — the indexer API only surfaces token transfers (USDT, XAUt, etc.), not native ETH sends/receives. This is a known limitation. Rather than building a separate ETH transaction fetching layer, I implemented all transaction history flows with this callout in mind — the Activity screen correctly shows all token transfers and the architecture is open to plugging in an ETH-specific data source later without restructuring.

- **Network-scoped accounts** — `useAccount` is scoped per network via `accountIndex + network`, which is the right model for multi-chain but took some time to understand for the gas estimation flow.

---

## Key Challenges

### 1. Wallet balance sync after send

After sending a transaction, the wallet balance wasn't updating. The issue was that `useRefreshBalance` and the indexer have independent data sources — refreshing one doesn't update the other. Fixed by triggering both refreshes simultaneously on the wallet screen's `useFocusEffect`, and also immediately after a successful send.

### 2. Auth screen stuck on loader after phone lock

When the phone screen turned off due to inactivity, `AppLockController` correctly navigated to the auth screen. But the biometric prompt (`LocalAuthentication.authenticateAsync`) was being invoked while the phone was still transitioning to background — the native dialog couldn't render on a dark screen, causing the promise to hang indefinitely.

Fixed by checking `AppState.currentState` on mount: if the app isn't active yet, wait for the `'active'` AppState event before triggering the auth prompt. This ensures the biometric dialog only appears once the user has returned to the app.
