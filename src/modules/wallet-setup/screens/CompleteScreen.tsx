import { useWalletManager } from '@tetherto/wdk-react-native-core';
import { setAvatar } from '@/modules/wallet/utils/avatar-options';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

export default function CompleteScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ walletName: string; mnemonic: string; avatar?: string }>();
  const { restoreWallet } = useWalletManager();
  const [walletCreated, setWalletCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    createWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createWallet = async () => {
    setIsLoading(true);
    try {
      const walletName = params.walletName || 'My Wallet';
      const mnemonic = params.mnemonic.split(',').join(' ');
      // walletId is the name slug — unique per wallet
      const walletId = `wallet_${walletName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

      await restoreWallet(mnemonic, walletId);

      if (params.avatar) {
        await setAvatar(params.avatar, walletId);
      }

      setWalletCreated(true);
    } catch (err) {
      console.error('Failed to create wallet:', err);
      Alert.alert('Wallet Creation Failed', 'There was an issue creating your wallet. Please try again.', [
        { text: 'Retry', onPress: createWallet },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToWallet = () => {
    if (!walletCreated) {
      Alert.alert('Please Wait', 'Wallet is still being created...');
      return;
    }
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'wallet' }] })
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLoading ? 'Creating Your Wallet...' : "You're All Set!"}
        </Text>
        <Text style={styles.subtitle}>
          {isLoading
            ? 'Setting up your secure multi-chain wallet. This will only take a moment...'
            : 'Your wallet is ready to use. Start exploring and managing your crypto securely.'}
        </Text>
        {isLoading && <Text style={styles.loadingText}>Initializing wallet...</Text>}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.button, (isLoading || !walletCreated) && styles.buttonDisabled]}
          onPress={handleGoToWallet}
          disabled={isLoading || !walletCreated}
        >
          <Text style={[styles.buttonText, (isLoading || !walletCreated) && styles.buttonTextDisabled]}>
            {isLoading ? 'Creating Wallet...' : 'Go To Wallet'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 60, alignItems: 'flex-start' },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 16, alignSelf: 'stretch' },
  subtitle: { fontSize: 16, color: colors.textSecondary, alignSelf: 'stretch' },
  loadingText: { color: colors.textSecondary, fontSize: 14, marginTop: 24 },
  footer: { paddingHorizontal: 20, paddingTop: 20 },
  button: { backgroundColor: colors.primary, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: colors.card },
  buttonText: { fontSize: 18, fontWeight: '600', color: colors.black },
  buttonTextDisabled: { color: colors.textTertiary },
});
