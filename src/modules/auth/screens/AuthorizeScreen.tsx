import { useWalletManager } from '@tetherto/wdk-react-native-core';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { Fingerprint, Shield } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { authenticateBiometric, getBiometricLabel } from '@/modules/auth/utils/biometric-auth';

export default function AuthorizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const { unlock } = useWalletManager();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricLabel, setBiometricLabel] = useState('Biometrics');
  const hasTriggeredRef = useRef(false);

  const handleAuthorize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Gate the unlock behind biometric / device-passcode authentication.
      const auth = await authenticateBiometric('Unlock your wallet');
      if (!auth.success) {
        setError(auth.error ?? 'Authentication failed');
        return;
      }

      await unlock();
      router.replace('/wallet');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to unlock wallet';
      if (msg.toLowerCase().includes('no wallet')) {
        Alert.alert('Error', 'No wallet found');
        router.replace('/onboarding');
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [unlock, router]);

  useEffect(() => {
    getBiometricLabel().then(setBiometricLabel);

    const triggerOnce = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      handleAuthorize();
    };

    // If the app is already active (e.g. user tapped the app icon manually),
    // prompt right away. Otherwise wait until it comes to the foreground so
    // the native auth dialog isn't invoked while the screen is still off.
    if (AppState.currentState === 'active') {
      triggerOnce();
    } else {
      const sub = AppState.addEventListener('change', next => {
        if (next === 'active') {
          sub.remove();
          triggerOnce();
        }
      });
      return () => sub.remove();
    }
  }, [handleAuthorize]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Shield size={80} color={colors.primary} />
        </View>

        <Text style={styles.title}>Authorize Access</Text>
        <Text style={styles.subtitle}>Verify your identity to access your wallet</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Unlocking wallet...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAuthorize}
            disabled={isLoading}
          >
            <Fingerprint size={24} color={colors.white} />
            <Text style={styles.primaryButtonText}>
              {error ? 'Try Again' : `Unlock with ${biometricLabel}`}
            </Text>
          </TouchableOpacity>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>Your wallet is encrypted and secured with your device</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  iconContainer: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 50 },
  loadingContainer: { alignItems: 'center', marginTop: 50 },
  loadingText: { color: colors.textSecondary, marginTop: 16, fontSize: 14 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  primaryButtonText: { color: colors.text, fontSize: 16, fontWeight: '600', marginLeft: 12 },
  errorContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.dangerBackground,
    borderRadius: 8,
    width: '100%',
  },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  footer: { paddingHorizontal: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: colors.textTertiary, textAlign: 'center' },
});
