import * as LocalAuthentication from 'expo-local-authentication';

/**
 * App-level biometric gate built on `expo-local-authentication`.
 *
 * The WDK secure storage stores the wallet encryption key without biometric
 * access control (`requireBiometrics: false`), so this module provides the
 * user-facing authentication gate before the wallet is unlocked or re-shown.
 * It is a UX gate rather than hardware key-binding — see README/AI notes.
 */

export interface BiometricResult {
  success: boolean;
  /** User-presentable error, only set when `success` is false. */
  error?: string;
}

// Module-level flag so the app-state lock controller can tell when an
// auth prompt is on screen. On iOS, presenting Face ID briefly flips the
// app to "inactive", which must not be mistaken for the user backgrounding
// the app (otherwise we'd re-trigger the lock and loop).
let authInProgress = false;

export function isBiometricAuthInProgress(): boolean {
  return authInProgress;
}

/** True when the device has biometric hardware with at least one enrolled credential. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

/** Friendly name for the strongest supported method, used in prompt copy. */
export async function getBiometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
  } catch {
    // fall through
  }
  return 'Biometrics';
}

/**
 * Prompt for biometric authentication, falling back to the device passcode
 * (`disableDeviceFallback: false`) when biometrics aren't enrolled.
 *
 * If the device has no secure lock configured at all (no biometrics and no
 * passcode), there is nothing to authenticate against, so we let the user
 * through rather than locking them out of their own wallet.
 */
export async function authenticateBiometric(
  promptMessage = 'Unlock your wallet'
): Promise<BiometricResult> {
  authInProgress = true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      // Allow PIN / pattern / passcode when biometrics aren't enrolled.
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    // Device has no biometrics AND no passcode — cannot gate, so allow through.
    if (
      result.error === 'not_available' ||
      result.error === 'not_enrolled' ||
      result.error === 'passcode_not_set'
    ) {
      return { success: true };
    }

    return { success: false, error: mapAuthError(result.error) };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Authentication failed',
    };
  } finally {
    authInProgress = false;
  }
}

function mapAuthError(error?: string): string {
  switch (error) {
    case 'user_cancel':
    case 'app_cancel':
    case 'system_cancel':
      return 'Authentication cancelled';
    case 'lockout':
    case 'too_fast':
      return 'Too many attempts. Please try again later';
    case 'authentication_failed':
      return 'Authentication failed. Please try again';
    default:
      return 'Could not verify your identity';
  }
}
