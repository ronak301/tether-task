import { assetConfig } from '@/config/assets';
import { AssetTicker, NetworkType } from '@/types/wdk';
import { useWalletManager, useBalancesForWallet, useAddresses } from '@tetherto/wdk-react-native-core';
import { allAssets, fromSmallestUnit } from '@/config/wdk-assets';
import formatAmount from '@/utils/format-amount';
import { useLocalSearchParams } from 'expo-router';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TokenDetails } from '@/components/TokenDetails';
import { FiatCurrency, pricingService } from '@/services/pricing-service';
import { networkConfigs } from '@/config/networks';
import getDisplaySymbol from '@/utils/get-display-symbol';
import Header from '@/components/Header';
import { colors } from '@/constants/colors';

export default function TokenDetailsScreen() {
  const router = useDebouncedNavigation();
  const insets = useSafeAreaInsets();
  const { activeWalletId } = useWalletManager();
  const { data: balanceResults, isLoading } = useBalancesForWallet(0, allAssets);
  const { getAddressesForNetwork } = useAddresses();
  const params = useLocalSearchParams<{ walletId?: string; token?: string }>();

  const tokenSymbol = params.token?.toLowerCase() as keyof typeof assetConfig;
  const tokenConfig = tokenSymbol ? assetConfig[tokenSymbol] : null;

  const [tokenData, setTokenData] = useState<{
    symbol: string;
    name: string;
    icon: any;
    color: string;
    totalBalance: number;
    totalUSDValue: number;
    networkBalances: { network: string; balance: number; usdValue: number; address: string }[];
    priceUSD: number;
  } | null>(null);

  useEffect(() => {
    const build = async () => {
      if (!tokenSymbol || !tokenConfig || !balanceResults?.length) { setTokenData(null); return; }

      const relevant = balanceResults.filter(r => r.assetId === tokenSymbol && r.success && r.balance);
      let totalBalance = 0;

      const networkBalancesPromises = relevant.map(async r => {
        const asset = allAssets.find(a => a.getId() === r.assetId && a.getNetwork() === r.network);
        const amount = asset ? fromSmallestUnit(r.balance!, asset) : 0;
        totalBalance += amount;
        const usdValue = await pricingService.getFiatValue(amount, tokenSymbol as AssetTicker, FiatCurrency.USD);
        const addrs = getAddressesForNetwork(r.network);
        return { network: r.network, balance: amount, usdValue, address: addrs[0]?.address ?? '' };
      });

      const networkBalances = (await Promise.all(networkBalancesPromises)).filter(nb => nb.balance > 0);
      const tokenPrice = await pricingService.getFiatValue(1, tokenSymbol as AssetTicker, FiatCurrency.USD);
      const totalUSDValue = await pricingService.getFiatValue(totalBalance, tokenSymbol as AssetTicker, FiatCurrency.USD);

      setTokenData({
        symbol: getDisplaySymbol(tokenSymbol),
        name: tokenConfig.name,
        icon: tokenConfig.icon,
        color: tokenConfig.color,
        totalBalance,
        totalUSDValue,
        networkBalances,
        priceUSD: tokenPrice,
      });
    };

    build();
  }, [balanceResults, tokenSymbol, tokenConfig, getAddressesForNetwork]);

  const handleSendToken = (network?: NetworkType) => {
    if (!tokenData || !network) return;
    const networkBalance = tokenData.networkBalances.find(nb => nb.network === network);
    if (!networkBalance) return;
    router.push({
      pathname: '/send/details',
      params: {
        networkName: networkConfigs[network].name,
        networkId: network,
        tokenBalance: networkBalance.balance.toString(),
        tokenBalanceUSD: `${formatAmount(networkBalance.usdValue)} USD`,
        tokenId: tokenSymbol,
        tokenName: tokenData.symbol,
        tokenSymbol: tokenData.symbol,
      },
    });
  };

  if (!activeWalletId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header isLoading={isLoading} title="Token Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Wallet not found</Text>
        </View>
      </View>
    );
  }

  if (!tokenData || !tokenConfig) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header isLoading={isLoading} title="Token Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Token not found or not supported</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header isLoading={isLoading} title={`${tokenData.name} Details`} />
      <TokenDetails tokenData={tokenData} onSendPress={handleSendToken} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: 16 },
});
