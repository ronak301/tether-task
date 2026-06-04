import { useAddresses } from '@tetherto/wdk-react-native-core';
import { Transaction, TransactionList } from '@tetherto/wdk-uikit-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { assetConfig } from '../config/assets';
import { FiatCurrency, pricingService } from '../services/pricing-service';
import formatTokenAmount from '@/utils/format-token-amount';
import formatUSDValue from '@/utils/format-usd-value';
import Header from '@/components/header';
import { colors } from '@/constants/colors';
import { useTransactions } from '@/hooks/use-transactions';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { data: addressData } = useAddresses();
  const { list: rawTxList, isLoading } = useTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const transform = async () => {
      const walletAddresses = (addressData ?? []).map(a => a.address.toLowerCase());

      const result = await Promise.all(
        rawTxList.map(async (tx, index) => {
          const isSent = walletAddresses.includes(tx.from?.toLowerCase());
          const amount = parseFloat(tx.amount);
          const config = assetConfig[tx.token as keyof typeof assetConfig];
          const fiatAmount = await pricingService.getFiatValue(
            amount,
            tx.token as any,
            FiatCurrency.USD
          );

          return {
            id: `${tx.transactionHash}-${index}`,
            type: isSent ? ('sent' as const) : ('received' as const),
            token: config?.name || tx.token.toUpperCase(),
            amount: formatTokenAmount(amount, tx.token as any),
            fiatAmount: formatUSDValue(fiatAmount, false),
            fiatCurrency: FiatCurrency.USD,
            network: tx.blockchain,
          };
        })
      );

      setTransactions(result);
    };

    transform();
  }, [rawTxList, addressData]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header isLoading={isLoading} title="Activity" />
      <TransactionList transactions={transactions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
