import { useAddresses } from '@tetherto/wdk-react-native-core';
import { useEffect, useState, useCallback } from 'react';

export type IndexerTransfer = {
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  blockchain: string;
  timestamp: number; // milliseconds
  blockNumber: number;
};

type TransactionsResponse = {
  list: IndexerTransfer[];
  isLoading: boolean;
  refetch: () => void;
};

const INDEXER_BASE_URL = process.env.EXPO_PUBLIC_WDK_INDEXER_BASE_URL;
const INDEXER_API_KEY = process.env.EXPO_PUBLIC_WDK_INDEXER_API_KEY;
const INDEXER_CHAIN = process.env.EXPO_PUBLIC_CHAIN_ENV === 'sepolia' ? 'sepolia' : 'ethereum';

// Tokens the indexer supports for the current chain.
const SUPPORTED_TOKENS = INDEXER_CHAIN === 'sepolia' ? ['usdt'] : ['usdt', 'xaut'];

export function useTransactions(): TransactionsResponse {
  const { data: addresses } = useAddresses();
  const [list, setList] = useState<IndexerTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!addresses?.length || !INDEXER_BASE_URL || !INDEXER_API_KEY) return;

    setIsLoading(true);
    try {
      // Build one entry per (address × token) combination.
      const payload = addresses.flatMap(a =>
        SUPPORTED_TOKENS.map(token => ({
          address: a.address,
          blockchain: INDEXER_CHAIN,
          token,
        }))
      );

      const res = await fetch(`${INDEXER_BASE_URL}/api/v1/batch/token-transfers`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': INDEXER_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn('[useTransactions] HTTP error:', res.status);
        return;
      }

      // Response: Array<{ transfers: IndexerTransfer[] }>
      const data: Array<{ transfers: IndexerTransfer[] }> = await res.json();

      const allTransfers = data
        .flatMap(item => item.transfers ?? [])
        .sort((a, b) => b.timestamp - a.timestamp);

      setList(allTransfers);
    } catch (err) {
      console.warn('[useTransactions] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [addresses]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { list, isLoading, refetch: fetchTransactions };
}
