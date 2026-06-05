import { Network, NetworkSelector } from '@/components/NetworkSelector';
import { assetConfig } from '@/config/assets';
import { networkConfigs } from '@/config/networks';
import { NetworkType } from '@/types/wdk';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FiatCurrency } from '@/services/pricing-service';
import Header from '@/components/Header';
import { colors } from '@/constants/colors';

export default function SelectNetworkScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const params = useLocalSearchParams();
  const { tokenId, tokenSymbol, tokenName, tokenBalance, tokenBalanceUSD, scannedAddress } =
    params as {
      tokenId: string;
      tokenSymbol: string;
      tokenName: string;
      // Balance already resolved by select-token — pass through to avoid
      // a second async fetch that races with the auto-skip.
      tokenBalance?: string;
      tokenBalanceUSD?: string;
      scannedAddress?: string;
    };

  const [autoSkipped, setAutoSkipped] = useState(false);

  const networks: Network[] = useMemo(() => {
    const tokenConfig = assetConfig[tokenId];
    if (!tokenConfig) return [];

    return tokenConfig.supportedNetworks.map((networkType: NetworkType) => {
      const network = networkConfigs[networkType];
      return {
        ...network,
        balance: tokenBalance ?? '0',
        balanceFiat: tokenBalanceUSD ?? '0',
        fiatCurrency: FiatCurrency.USD,
        token: tokenSymbol,
      };
    });
  }, [tokenId, tokenSymbol, tokenBalance, tokenBalanceUSD]);

  const navigateToDetails = useCallback(
    (network: Network) => {
      router.replace({
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
    },
    [router, tokenId, tokenSymbol, tokenName, scannedAddress]
  );

  // Auto-skip when only one network — go straight to send details.
  useEffect(() => {
    if (autoSkipped || networks.length !== 1) return;
    setAutoSkipped(true);
    navigateToDetails(networks[0]);
  }, [networks, autoSkipped, navigateToDetails]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Select network" style={styles.header} />
      <Text style={styles.description}>
        Select the network you will be using to send {tokenSymbol || tokenName}
      </Text>
      <NetworkSelector networks={networks} onSelectNetwork={navigateToDetails} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 16 },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
});
