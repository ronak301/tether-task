import { assetConfig } from '@/config/assets';
import { useWalletManager, useBalancesForWallet } from '@tetherto/wdk-react-native-core';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { AssetTicker } from '@/types/wdk-types';
import { allAssets, fromSmallestUnit } from '@/config/wdk-assets';
import { AssetSelector, type Token } from '@tetherto/wdk-uikit-react-native';
import { FiatCurrency, pricingService } from '@/services/pricing-service';
import formatAmount from '@/utils/format-amount';
import getDisplaySymbol from '@/utils/get-display-symbol';
import { getRecentTokens, addToRecentTokens } from '@/utils/recent-tokens';
import formatTokenAmount from '@/utils/format-token-amount';
import Header from '@/components/header';

export default function SelectTokenScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const params = useLocalSearchParams();
  const { activeWalletId } = useWalletManager();
  const { data: balanceResults } = useBalancesForWallet(0, allAssets);
  const { scannedAddress } = params as { scannedAddress?: string };
  const [recentTokens, setRecentTokens] = useState<string[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    getRecentTokens('send').then(setRecentTokens);
  }, []);

  useEffect(() => {
    if (!activeWalletId) return;

    const buildTokens = async () => {
      const map = new Map<string, number>();
      for (const result of balanceResults ?? []) {
        if (!result.success || !result.balance) continue;
        const asset = allAssets.find(a => a.getId() === result.assetId && a.getNetwork() === result.network);
        if (!asset) continue;
        map.set(result.assetId, (map.get(result.assetId) ?? 0) + fromSmallestUnit(result.balance, asset));
      }

      const tokenList: Token[] = [];
      for (const [denomination] of Object.entries(assetConfig)) {
        const config = assetConfig[denomination];
        const totalBalance = map.get(denomination) ?? 0;
        let usdValue = 0;
        try {
          usdValue = await pricingService.getFiatValue(totalBalance, denomination as AssetTicker, FiatCurrency.USD);
        } catch (_) {}

        tokenList.push({
          id: denomination,
          symbol: getDisplaySymbol(denomination),
          name: config.name,
          balance: formatTokenAmount(totalBalance, denomination as AssetTicker, false),
          balanceUSD: `${formatAmount(usdValue)} USD`,
          icon: config.icon,
          color: config.color,
          hasBalance: totalBalance > 0,
        });
      }

      setTokens(tokenList.sort((a, b) => {
        const aV = parseFloat(a.balanceUSD); const bV = parseFloat(b.balanceUSD);
        if (aV === 0 && bV === 0) return a.name.localeCompare(b.name);
        if (aV === 0) return 1; if (bV === 0) return -1;
        return bV - aV;
      }));
    };

    buildTokens();
  }, [balanceResults, activeWalletId]);

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
  }, [router, scannedAddress]);

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
