import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { isBiometricAuthInProgress, isLockSuppressed } from '@/modules/auth/utils/biometric-auth';

// Screens that don't hold an unlocked session and must never be re-locked:
// the lock screen itself, onboarding, and the wallet-setup flow.
const UNAUTHED_ROUTE_PREFIXES = ['/authorize', '/onboarding', '/wallet-setup'];

function isAuthenticatedRoute(pathname: string | null): boolean {
  if (!pathname || pathname === '/') return false;
  return !UNAUTHED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Re-locks the wallet when the app leaves the foreground.
 *
 * When an unlocked session goes to background/inactive, we redirect to the
 * `/authorize` screen so that returning to the app requires biometric (or
 * passcode) authentication again. Redirecting on the way out also hides
 * wallet contents from the OS app-switcher snapshot.
 *
 * The decision is route-based (rather than status-based) to avoid racing with
 * the SDK's `clearSensitiveDataOnBackground`, which flips the wallet status on
 * the same background event.
 *
 * Renders nothing — it only wires an AppState listener.
 */
export function AppLockController() {
  const router = useRouter();
  const pathname = usePathname();

  // Listener runs outside React's render, so mirror the latest route into a ref.
  const appStateRef = useRef(AppState.currentState);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      const previous = appStateRef.current;
      appStateRef.current = next;

      const leavingForeground = previous === 'active' && next === 'background';
      if (!leavingForeground) return;

      // Ignore transient background caused by biometric prompt or native dialogs
      // (share sheet, camera picker, etc.) that briefly put the app in background.
      if (isBiometricAuthInProgress()) return;
      if (isLockSuppressed()) return;

      // Only re-lock when the user is inside an authenticated screen.
      if (!isAuthenticatedRoute(pathnameRef.current)) return;

      router.replace('/authorize');
    });

    return () => subscription.remove();
  }, [router]);

  return null;
}
