import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnBoardingWelcome } from '@/modules/onboarding/components/OnboardingWelcome';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@/constants/colors';
import { Download, Wallet } from 'lucide-react-native';

export default function OnBoardingScreen() {
  const router = useDebouncedNavigation();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isAddMode = mode === 'add';

  const handleCreateWallet = () => {
    router.push('/wallet-setup/name-wallet');
  };

  const handleImportWallet = () => {
    router.push('/wallet-setup/import-wallet');
  };

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (isAddMode) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.addHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.addTitle}>Add Wallet</Text>
          <View style={styles.cancelButton} />
        </View>
        <View style={styles.addContent}>
          <Text style={styles.addSubtitle}>Create a new wallet or import an existing one.</Text>
          <TouchableOpacity style={styles.filledButton} onPress={handleCreateWallet}>
            <Wallet size={20} color={colors.black} />
            <Text style={styles.filledButtonText}>Create Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={handleImportWallet}>
            <Download size={20} color={colors.primary} />
            <Text style={styles.outlineButtonText}>Import Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OnBoardingWelcome
        title="Welcome!"
        subtitle="Set up your wallet and start exploring the crypto world."
        actionButtons={[
          {
            id: 1,
            title: 'Create Wallet',
            iconName: 'wallet',
            variant: 'filled',
            onPress: handleCreateWallet,
          },
          {
            id: 2,
            title: 'Import Wallet',
            iconName: 'download',
            variant: 'tinted',
            onPress: handleImportWallet,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cancelButton: { width: 60 },
  cancelText: { fontSize: 16, color: colors.textSecondary },
  addTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  addContent: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 12 },
  addSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 16 },
  filledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  filledButtonText: { fontSize: 16, fontWeight: '600', color: colors.black },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  outlineButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary },
});
