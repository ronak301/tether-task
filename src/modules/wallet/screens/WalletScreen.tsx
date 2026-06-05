import { BalanceLoader } from '@/modules/wallet/components/BalanceLoader';
import { useWalletManager, useAddresses, useWdkApp, useRefreshBalance } from '@tetherto/wdk-react-native-core';
import { Balance } from '@tetherto/wdk-uikit-react-native';
import { useIndexerBalances } from '@/hooks/use-indexer-balances';
import { useWalletBalances } from '@/modules/wallet/hooks/use-wallet-balances';
import { isLockSuppressed } from '@/modules/auth/utils/biometric-auth';
import { useDebouncedNavigation } from '@/hooks/use-debounced-navigation';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  QrCode,
  Settings,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetConfig, assetConfig } from '@/config/assets';
import { FiatCurrency, pricingService } from '@/services/pricing-service';
import { AssetTicker } from '@/types/wdk';
import formatTokenAmount from '@/utils/format-token-amount';
import formatAmount from '@/utils/format-amount';
import formatUSDValue from '@/utils/format-usd-value';
import useWalletAvatar from '@/modules/wallet/hooks/use-wallet-avatar';
import { useTransactions } from '@/modules/activity/hooks/use-transactions';
import { TransactionItem } from '@tetherto/wdk-uikit-react-native';
import type { Transaction as UITransaction } from '@tetherto/wdk-uikit-react-native';
import { WalletSwitcher } from '@/modules/wallet/components/WalletSwitcher';
import { colors } from '@/constants/colors';

type AggregatedBalance = ({
  denomination: string;
  balance: number;
  usdValue: number;
  config: AssetConfig;
} | null)[];

type Transaction = {
  id: number;
  type: string;
  asset: string;
  token: string;
  amount: string;
  icon: ImageSourcePropType;
  iconColor: string;
  blockchain: string;
  hash: string;
  fiatAmount: number;
  currency: FiatCurrency;
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useDebouncedNavigation();
  const { activeWalletId, status, lock } = useWalletManager();
  const { state: appState } = useWdkApp();
  const { data: addressData } = useAddresses();
  const { assets: walletAssets, totalUSD, isLoading } = useWalletBalances();
  const { refetch: refetchIndexer } = useIndexerBalances();
  const { mutateAsync: refreshBalance } = useRefreshBalance();
  const walletTransactions = useTransactions();
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<UITransaction[]>([]);
  const [mounted, setMounted] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const avatar = useWalletAvatar();
  const scrollY = useRef(new Animated.Value(0)).current;

  const hasWallet = !!activeWalletId;

  const parseWalletDisplayName = (walletId: string): string => {
    const match = walletId.match(/^wallet_(.+)_\d+$/);
    if (match) {
      return match[1]
        .split('_')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return walletId;
  };

  // Redirect to authorization if wallet is locked.
  // Skip when a native dialog (share sheet, camera) has temporarily backgrounded
  // the app — clearSensitiveDataOnBackground resets status to LOCKED in those
  // cases too, but we don't want to force re-auth for that.
  useEffect(() => {
    if (status === 'LOCKED' && !isLockSuppressed()) {
      router.replace('/authorize');
    }
  }, [status, router]);

  // Redirect to onboarding if no wallet exists (e.g. after deleting the last wallet)
  useEffect(() => {
    if (appState.status === 'NO_WALLET') {
      router.replace('/onboarding');
    }
  }, [appState.status, router]);

  const totalPortfolioValue = totalUSD;

  // Refresh prices + balances every time this screen comes into focus so
  // USD values reflect the current ETH/XAUt market rate after a transaction.
  useFocusEffect(
    useCallback(() => {
      pricingService.refreshExchangeRates().catch(() => {});
      refreshBalance({ accountIndex: 0, type: 'wallet' }).catch(() => {});
      refetchIndexer();
    }, [refreshBalance, refetchIndexer])
  );

  // Animated border opacity based on scroll position
  const borderOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });


  // Build latest 2 transactions from the indexer (USDT/XAUt transfers).
  const getTransactions = async (): Promise<UITransaction[]> => {
    const walletAddresses = (addressData ?? []).map(a => a.address.toLowerCase());

    const items = await Promise.all(
      walletTransactions.list.slice(0, 2).map(async (tx, i) => {
        const isSent = walletAddresses.includes(tx.from?.toLowerCase());
        const amount = parseFloat(tx.amount);
        const config = assetConfig[tx.token];
        let fiatAmount = 0;
        try { fiatAmount = await pricingService.getFiatValue(amount, tx.token as AssetTicker, FiatCurrency.USD); } catch {}

        return {
          id: `${tx.transactionHash}-${i}`,
          type: (isSent ? 'sent' : 'received') as 'sent' | 'received',
          token: config?.name ?? tx.token.toUpperCase(),
          amount: formatTokenAmount(amount, tx.token as AssetTicker),
          fiatAmount: formatUSDValue(fiatAmount, false),
          fiatCurrency: FiatCurrency.USD,
          network: tx.blockchain.charAt(0).toUpperCase() + tx.blockchain.slice(1),
        } as UITransaction;
      })
    );

    return items;
  };

  const handleSendPress = () => {
    router.push('/send/select-token');
  };

  const handleReceivePress = () => {
    router.push('/receive/select-token');
  };

  const handleQRPress = () => {
    router.push('/scan-qr');
  };

  const handleSeeAllTokens = () => {
    router.push('/assets');
  };

  const handleSeeAllActivity = () => {
    router.push('/activity');
  };

  const handleCreateWallet = () => {
    router.push('/wallet-setup/name-wallet');
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        pricingService.refreshExchangeRates(),
        refreshBalance({ accountIndex: 0, type: 'wallet' }),
        refetchIndexer(),
      ]);
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getTransactions().then(setTransactions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletTransactions.list, addressData]);

  // Force component to fully mount before enabling RefreshControl on iOS
  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            borderBottomColor: borderOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(30, 30, 30, 0)', 'rgba(30, 30, 30, 1)'],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.walletInfo}
          onPress={() => setSwitcherOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.walletIcon}>
            <Text style={styles.walletIconText}>{avatar}</Text>
          </View>
          <Text style={styles.walletName}>
            {activeWalletId ? parseWalletDisplayName(activeWalletId) : 'No Wallet'}
          </Text>
          <ChevronDown size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Settings size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        refreshControl={
          mounted ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              title="Pull to refresh"
              titleColor={colors.textSecondary}
              progressViewOffset={insets.top}
            />
          ) : (
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
              tintColor={colors.white}
              colors={[colors.white]}
              progressViewOffset={0}
            />
          )
        }
      >
        {/* Balance */}
        {!hasWallet && !isLoading ? (
          <TouchableOpacity onPress={handleCreateWallet}>
            <Text>Create Your First Wallet</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              margin: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Balance
              value={totalPortfolioValue}
              currency="USD"
              isLoading={isLoading}
              Loader={BalanceLoader}
            />
            {isLoading ? (
              <View style={{ top: 16, marginRight: 8 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}
          </View>
        )}

        {/* Portfolio */}
        <View style={styles.portfolioSection}>
          {walletAssets.length > 0 ? (
            walletAssets.map(asset => (
              <TouchableOpacity
                key={asset.id}
                style={styles.assetRow}
                onPress={() => {
                  if (activeWalletId) {
                    router.push({
                      pathname: '/token-details',
                      params: { walletId: activeWalletId, token: asset.id.toUpperCase() },
                    });
                  }
                }}
              >
                <View style={styles.assetInfo}>
                  <View style={[styles.assetIcon, { backgroundColor: asset.color }]}>
                    <Image source={asset.icon} style={styles.assetIconImage} />
                  </View>
                  <View>
                    <Text style={styles.assetName}>{asset.name}</Text>
                  </View>
                </View>
                <View style={styles.assetBalance}>
                  <Text style={styles.assetAmount}>{asset.amount}</Text>
                  <Text style={styles.assetValue}>{formatAmount(asset.fiatValue)} USD</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noAssetsContainer}>
              <Text style={styles.noAssetsText}>No assets found</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleSeeAllTokens}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Activity */}
        <View style={styles.activitySection}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
          >
            <Text style={styles.sectionTitle}>Activity</Text>
            {walletTransactions.isLoading ? (
              <View style={{ marginRight: 8 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}

          </View>

          {transactions.length > 0 ? (
            transactions.map(tx => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          ) : (
            <View style={styles.noAssetsContainer}>
              <Text style={styles.noAssetsText}>No transactions yet</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleSeeAllActivity}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { marginBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSendPress}>
          <ArrowUpRight size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.qrButton} onPress={handleQRPress}>
          <QrCode size={24} color={colors.black} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleReceivePress}>
          <ArrowDownLeft size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Receive</Text>
        </TouchableOpacity>
      </View>

      <WalletSwitcher isOpen={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  walletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  walletIconText: {
    fontSize: 12,
  },
  walletName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  portfolioSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: 16,
    marginBottom: 16,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assetIconImage: {
    width: 24,
    height: 24,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  assetBalance: {
    alignItems: 'flex-end',
  },
  noAssetsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAssetsText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  assetValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  seeAllText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
  },
  suggestionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  suggestionCard: {
    flex: 1,
    backgroundColor: colors.card,
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAssetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  transactionUsdAmount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 20,
    left: 72,
    right: 72,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 48,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    height: 80,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: colors.primary,
  },
});
