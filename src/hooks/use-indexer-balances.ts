import { useAddresses } from '@tetherto/wdk-react-native-core';
import { useCallback, useEffect, useState } from 'react';

const INDEXER_BASE_URL = process.env.EXPO_PUBLIC_WDK_INDEXER_BASE_URL;
const INDEXER_API_KEY = process.env.EXPO_PUBLIC_WDK_INDEXER_API_KEY;
// WDK internally labels the chain as 'ethereum' for both mainnet and Sepolia.
// The indexer uses the chain name the API expects.
const INDEXER_CHAIN = process.env.EXPO_PUBLIC_CHAIN_ENV === 'sepolia' ? 'sepolia' : 'ethereum';

// XAUt is mainnet-only — exclude it on Sepolia.
const INDEXER_TOKENS = (
  process.env.EXPO_PUBLIC_CHAIN_ENV === 'sepolia' ? ['usdt'] : ['usdt', 'xaut']
) as readonly string[];
type IndexerToken = string;

export interface IndexerBalance {
  token: IndexerToken;
  network: string;
  address: string;
  amount: string; // human-readable decimal string, e.g. "12.5"
}

interface IndexerBalanceResponse {
  balances: IndexerBalance[];
  isLoading: boolean;
  refetch: () => void;
}

export function useIndexerBalances(): IndexerBalanceResponse {
  const { data: addresses } = useAddresses();
  const [balances, setBalances] = useState<IndexerBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    // Clear stale data from the previous wallet before fetching.
    setBalances([]);

    if (!addresses?.length || !INDEXER_BASE_URL || !INDEXER_API_KEY) return;

    setIsLoading(true);
    try {
      // Build one batch request entry per (address × token) combination.
      const payload = addresses.flatMap(a =>
        INDEXER_TOKENS.map(token => ({
          address: a.address,
          blockchain: INDEXER_CHAIN,
          token,
        }))
      );

      const res = await fetch(`${INDEXER_BASE_URL}/api/v1/batch/token-balances`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': INDEXER_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn('[useIndexerBalances] HTTP error:', res.status);
        return;
      }

      const data: Array<{ tokenBalance: { blockchain: string; token: string; amount: string } }> =
        await res.json();

      const results: IndexerBalance[] = data
        .filter(item => item?.tokenBalance)
        .map((item, i) => ({
          token: payload[i].token,
          network: item.tokenBalance.blockchain,
          address: payload[i].address,
          amount: item.tokenBalance.amount,
        }));

      setBalances(results);
    } catch (err) {
      console.warn('[useIndexerBalances] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [addresses]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, isLoading, refetch: fetchBalances };
}
