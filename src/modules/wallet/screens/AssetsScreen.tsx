import { useWalletManager } from '@tetherto/wdk-react-native-core';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import { useWalletBalances, WalletAsset } from '@/modules/wallet/hooks/use-wallet-balances';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import formatAmount from '@/utils/format-amount';
import Header from '@/components/Header';
import { colors } from '@/constants/colors';

export default function AssetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const { activeWalletId } = useWalletManager();
  const { assets, isLoading } = useWalletBalances();

  const handleAssetPress = (asset: WalletAsset) => {
    if (!activeWalletId) return;
    router.push({
      pathname: '/token-details',
      params: { walletId: activeWalletId, token: asset.id },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header isLoading={isLoading} title="Your Assets" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {assets.length > 0 ? (
          assets.map((asset) => (
            <TouchableOpacity
              key={asset.id}
              style={styles.assetRow}
              onPress={() => handleAssetPress(asset)}
            >
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
                <Text style={styles.assetValue}>
                  {formatAmount(asset.fiatValue)} {asset.fiatCurrency}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noAssetsContainer}>
            <Text style={styles.noAssetsText}>No assets found</Text>
            <Text style={styles.noAssetsSubtext}>
              Your wallet assets will appear here once you have a balance
            </Text>
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
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  assetInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  assetIconText: { fontSize: 24, color: colors.text },
  assetIconImage: { width: 32, height: 32 },
  assetDetails: { flex: 1 },
  assetName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  assetBalance: { alignItems: 'flex-end' },
  assetAmount: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  assetValue: { fontSize: 14, color: colors.textSecondary },
  noAssetsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noAssetsText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  noAssetsSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
