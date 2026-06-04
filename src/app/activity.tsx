import { useAddresses } from '@tetherto/wdk-react-native-core';
import { Transaction, TransactionItem } from '@tetherto/wdk-uikit-react-native';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { assetConfig } from '../config/assets';
import { FiatCurrency, pricingService } from '../services/pricing-service';
import formatTokenAmount from '@/utils/format-token-amount';
import formatUSDValue from '@/utils/format-usd-value';
import Header from '@/components/header';
import { colors } from '@/constants/colors';
import { useTransactions } from '@/hooks/use-transactions';

const IS_SEPOLIA = process.env.EXPO_PUBLIC_CHAIN_ENV === 'sepolia';

function formatTxDate(timestampMs: number): string {
  const d = new Date(timestampMs);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { data: addressData } = useAddresses();
  const { list: rawTxList, isLoading, refetch } = useTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hashMap, setHashMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    const transform = async () => {
      const walletAddresses = (addressData ?? []).map(a => a.address.toLowerCase());
      const newHashMap: Record<string, string> = {};

      const result = await Promise.all(
        rawTxList.map(async (tx, index) => {
          const isSent = walletAddresses.includes(tx.from?.toLowerCase());
          const amount = parseFloat(tx.amount);
          const config = assetConfig[tx.token as keyof typeof assetConfig];
          let fiatAmount = 0;
          try {
            fiatAmount = await pricingService.getFiatValue(amount, tx.token as any, FiatCurrency.USD);
          } catch {}

          const id = `${tx.transactionHash}-${index}`;
          newHashMap[id] = tx.transactionHash;

          return {
            id,
            type: isSent ? ('sent' as const) : ('received' as const),
            token: config?.name ?? tx.token.toUpperCase(),
            amount: formatTokenAmount(amount, tx.token as any),
            fiatAmount: formatUSDValue(fiatAmount, false),
            fiatCurrency: FiatCurrency.USD,
            network: `${tx.blockchain.charAt(0).toUpperCase() + tx.blockchain.slice(1)} • ${formatTxDate(tx.timestamp)}`,
          } as Transaction;
        })
      );

      setTransactions(result);
      setHashMap(newHashMap);
    };

    transform();
  }, [rawTxList, addressData]);

  const handleTxPress = useCallback((tx: Transaction) => {
    const hash = hashMap[tx.id];
    if (!hash) return;
    const base = IS_SEPOLIA ? 'https://sepolia.etherscan.io/tx/' : 'https://etherscan.io/tx/';
    Linking.openURL(base + hash);
  }, [hashMap]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header isLoading={isLoading} title="Activity" />
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <TransactionItem transaction={item} onPress={() => handleTxPress(item)} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 20, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: colors.textTertiary, textAlign: 'center' },
});
