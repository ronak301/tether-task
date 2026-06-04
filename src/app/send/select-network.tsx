import { Network, NetworkSelector } from '@/components/NetworkSelector';
import { assetConfig } from '@/config/assets';
import { networkConfigs } from '@/config/networks';
import { useBalancesForWallet } from '@tetherto/wdk-react-native-core';
import { AssetTicker, NetworkType } from '@/types/wdk-types';
import { allAssets, fromSmallestUnit } from '@/config/wdk-assets';
import formatAmount from '@/utils/format-amount';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FiatCurrency, pricingService } from '@/services/pricing-service';
import getDisplaySymbol from '@/utils/get-display-symbol';
import formatTokenAmount from '@/utils/format-token-amount';
import Header from '@/components/header';
import { colors } from '@/constants/colors';

export default function SelectNetworkScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const params = useLocalSearchParams();
  const { data: balanceResults } = useBalancesForWallet(0, allAssets);
  const { tokenId, tokenSymbol, tokenName, scannedAddress } = params as {
    tokenId: string;
    tokenSymbol: string;
    tokenName: string;
    scannedAddress?: string;
  };

  const [networks, setNetworks] = useState<Network[]>([]);

  useEffect(() => {
    const buildNetworks = async () => {
      const tokenConfig = assetConfig[tokenId];
      if (!tokenConfig) { setNetworks([]); return; }

      const networksWithBalances = await Promise.all(
        tokenConfig.supportedNetworks.map(async (networkType: NetworkType) => {
          const network = networkConfigs[networkType];
          const result = balanceResults?.find(r => r.assetId === tokenId && r.network === networkType);
          const asset = allAssets.find(a => a.getId() === tokenId && a.getNetwork() === networkType);
          const balanceValue = result?.success && result.balance && asset
            ? fromSmallestUnit(result.balance, asset) : 0;
          const balanceUSD = await pricingService.getFiatValue(balanceValue, tokenId as AssetTicker, FiatCurrency.USD);

          return {
            ...network,
            balance: formatTokenAmount(balanceValue, tokenId as AssetTicker, false),
            balanceFiat: formatAmount(balanceUSD),
            fiatCurrency: FiatCurrency.USD,
            token: getDisplaySymbol(tokenId),
          };
        })
      );

      setNetworks(networksWithBalances);
    };

    buildNetworks();
  }, [tokenId, balanceResults]);

  const handleSelectNetwork = useCallback((network: Network) => {
    router.push({
      pathname: '/send/details',
      params: {
        tokenId,
        tokenSymbol,
        tokenName,
        tokenBalance: network.balance,
        tokenBalanceUSD: network.balanceFiat,
        networkName: network.name,
        networkId: network.id,
        ...(scannedAddress && { scannedAddress }),
      },
    });
  }, [router, tokenId, tokenSymbol, tokenName, scannedAddress]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Select network" style={styles.header} />
      <Text style={styles.description}>Select the network you will be using to send {tokenSymbol || tokenName}</Text>
      <NetworkSelector networks={networks} onSelectNetwork={handleSelectNetwork} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 16 },
  description: { fontSize: 14, color: colors.textSecondary, paddingHorizontal: 20, marginBottom: 24 },
});
