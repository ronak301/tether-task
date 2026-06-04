import { useWalletManager, useBalancesForWallet } from '@tetherto/wdk-react-native-core';
import { FiatCurrency, pricingService } from '@/services/pricing-service';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Asset, assetConfig } from '../config/assets';
import { AssetTicker } from '@/types/wdk-types';
import { allAssets, fromSmallestUnit } from '@/config/wdk-assets';
import formatAmount from '@/utils/format-amount';
import getDisplaySymbol from '@/utils/get-display-symbol';
import formatTokenAmount from '@/utils/format-token-amount';
import Header from '@/components/header';
import { colors } from '@/constants/colors';

export default function AssetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const { activeWalletId } = useWalletManager();
  const { data: balanceResults, isLoading } = useBalancesForWallet(0, allAssets);
  const [assets, setAssets] = useState<Asset[]>([]);

  const getAssetsWithFiatValue = async () => {
    if (!balanceResults?.length) return [];

    const map = new Map<string, number>();
    for (const result of balanceResults) {
      if (!result.success || !result.balance) continue;
      const asset = allAssets.find(a => a.getId() === result.assetId && a.getNetwork() === result.network);
      if (!asset) continue;
      map.set(result.assetId, (map.get(result.assetId) ?? 0) + fromSmallestUnit(result.balance, asset));
    }

    const promises = Array.from(map.entries()).map(async ([denomination, totalBalance]) => {
      const config = assetConfig[denomination];
      if (!config) return null;
      const fiatValue = await pricingService.getFiatValue(totalBalance, denomination as AssetTicker, FiatCurrency.USD);
      return {
        id: denomination,
        name: config.name,
        symbol: getDisplaySymbol(denomination),
        amount: formatTokenAmount(totalBalance, denomination as AssetTicker, false),
        fiatValue,
        fiatCurrency: FiatCurrency.USD,
        icon: config.icon,
        color: config.color,
      };
    });

    return ((await Promise.all(promises)).filter(Boolean) as Asset[])
      .sort((a, b) => b.fiatValue - a.fiatValue);
  };

  const handleAssetPress = (asset: Asset) => {
    if (!activeWalletId) return;
    router.push({ pathname: '/token-details', params: { walletId: activeWalletId, token: asset.id } });
  };

  useEffect(() => {
    getAssetsWithFiatValue().then(setAssets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceResults]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header isLoading={isLoading} title="Your Assets" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {assets.length > 0 ? (
          assets.map(asset => (
            <TouchableOpacity key={asset.id} style={styles.assetRow} onPress={() => handleAssetPress(asset)}>
              <View style={styles.assetInfo}>
                <View style={[styles.assetIcon, { backgroundColor: asset.color }]}>
                  {typeof asset.icon === 'string' ? (
                    <Text style={styles.assetIconText}>{asset.icon}</Text>
                  ) : (
                    <Image source={asset.icon} style={styles.assetIconImage} />
                  )}
                </View>
                <View style={styles.assetDetails}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                </View>
              </View>
              <View style={styles.assetBalance}>
                <Text style={styles.assetAmount}>{asset.amount}</Text>
                <Text style={styles.assetValue}>{formatAmount(asset.fiatValue)} {asset.fiatCurrency}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noAssetsContainer}>
            <Text style={styles.noAssetsText}>No assets found</Text>
            <Text style={styles.noAssetsSubtext}>Your wallet assets will appear here once you have a balance</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20 },
  assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  assetInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  assetIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  assetIconText: { fontSize: 24, color: colors.text },
  assetIconImage: { width: 32, height: 32 },
  assetDetails: { flex: 1 },
  assetName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  assetBalance: { alignItems: 'flex-end' },
  assetAmount: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  assetValue: { fontSize: 14, color: colors.textSecondary },
  noAssetsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  noAssetsText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  noAssetsSubtext: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 },
});
