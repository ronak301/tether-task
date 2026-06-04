import { useBalancesForWallet } from '@tetherto/wdk-react-native-core';
import { useEffect, useState } from 'react';
import { assetConfig } from '@/config/assets';
import { ethAsset, fromSmallestUnit } from '@/config/wdk-assets';
import { pricingService, FiatCurrency } from '@/services/pricing-service';
import { AssetTicker } from '@/types/wdk-types';
import formatTokenAmount from '@/utils/format-token-amount';
import getDisplaySymbol from '@/utils/get-display-symbol';
import { useIndexerBalances } from './use-indexer-balances';

export interface WalletAsset {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  balance: number;
  fiatValue: number;
  fiatCurrency: FiatCurrency;
  icon: any;
  color: string;
}

interface UseWalletBalancesResult {
  assets: WalletAsset[];
  totalUSD: number;
  isLoading: boolean;
}

export function useWalletBalances(): UseWalletBalancesResult {
  const { data: ethResults, isLoading: isEthLoading } = useBalancesForWallet(0, [ethAsset]);
  const { balances: indexerBalances, isLoading: isIndexerLoading } = useIndexerBalances();
  const [assets, setAssets] = useState<WalletAsset[]>([]);

  const isLoading = isEthLoading || isIndexerLoading;

  useEffect(() => {
    async function build() {
      const map = new Map<string, number>();

      // ETH native from RPC
      for (const result of ethResults ?? []) {
        if (!result.success || !result.balance) continue;
        const display = fromSmallestUnit(result.balance, ethAsset);
        if (display > 0) map.set('eth', (map.get('eth') ?? 0) + display);
      }

      // Tokens (USDT, XAUt) from indexer
      for (const b of indexerBalances) {
        const parsed = parseFloat(b.amount);
        if (!isNaN(parsed) && parsed > 0) {
          map.set(b.token, (map.get(b.token) ?? 0) + parsed);
        }
      }

      const promises = Array.from(map.entries()).map(async ([tokenId, balance]) => {
        const config = assetConfig[tokenId];
        if (!config) return null;
        let fiatValue = 0;
        try {
          fiatValue = await pricingService.getFiatValue(balance, tokenId as AssetTicker, FiatCurrency.USD);
        } catch {
          // Pricing unavailable — show balance without USD value.
        }
        return {
          id: tokenId,
          name: config.name,
          symbol: getDisplaySymbol(tokenId),
          amount: formatTokenAmount(balance, tokenId as AssetTicker, false),
          balance,
          fiatValue,
          fiatCurrency: FiatCurrency.USD,
          icon: config.icon,
          color: config.color,
        } as WalletAsset;
      });

      const built = (await Promise.all(promises))
        .filter((a): a is WalletAsset => a !== null)
        .sort((a, b) => b.fiatValue - a.fiatValue);

      setAssets(built);
    }

    build();
  }, [ethResults, indexerBalances]);

  const totalUSD = assets.reduce((sum, a) => sum + a.fiatValue, 0);

  return { assets, totalUSD, isLoading };
}
