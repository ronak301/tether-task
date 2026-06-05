import { useWalletManager } from '@tetherto/wdk-react-native-core';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { useWalletBalances } from '@/modules/wallet/hooks/use-wallet-balances';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { AssetSelector, type Token } from '@tetherto/wdk-uikit-react-native';
import { getRecentTokens, addToRecentTokens } from '@/utils/recent-tokens';
import Header from '@/components/Header';

export default function SelectTokenScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const params = useLocalSearchParams();
  const { activeWalletId } = useWalletManager();
  const { assets } = useWalletBalances();
  const { scannedAddress } = params as { scannedAddress?: string };
  const [recentTokens, setRecentTokens] = useState<string[]>([]);

  useEffect(() => {
    getRecentTokens('send').then(setRecentTokens);
  }, []);

  // Map shared WalletAsset to the UIKit Token shape.
  const tokens: Token[] = assets.map(a => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    // Use raw number string (no commas) so send/details can parseFloat safely.
    balance: a.balance.toString(),
    balanceUSD: a.fiatValue.toFixed(2),
    icon: a.icon,
    color: a.color,
    hasBalance: a.balance > 0,
  }));

  const handleSelectToken = useCallback(async (token: Token) => {
    if (!token.hasBalance) return;
    const updated = await addToRecentTokens(token.name, 'send');
    setRecentTokens(updated);
    router.push({
      pathname: '/send/select-network',
      params: {
        tokenId: token.id,
        tokenSymbol: token.symbol,
        tokenName: token.name,
        tokenBalance: token.balance,
        tokenBalanceUSD: token.balanceUSD,
        ...(scannedAddress && { scannedAddress }),
      },
    });
  }, [router, scannedAddress, activeWalletId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Send funds" style={styles.header} />
      <AssetSelector tokens={tokens} recentTokens={recentTokens} onSelectToken={handleSelectToken} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 16 },
});
