import { useAddresses } from '@tetherto/wdk-react-native-core';
import { useEffect, useState, useCallback } from 'react';

export type IndexerTransaction = {
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  blockchain: string;
  timestamp: number;
};

type IndexerResponse = {
  list: IndexerTransaction[];
  isLoading: boolean;
};

const INDEXER_BASE_URL = process.env.EXPO_PUBLIC_WDK_INDEXER_BASE_URL;
const INDEXER_API_KEY = process.env.EXPO_PUBLIC_WDK_INDEXER_API_KEY;

export function useTransactions(): IndexerResponse {
  const { data: addresses } = useAddresses();
  const [list, setList] = useState<IndexerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!addresses?.length || !INDEXER_BASE_URL || !INDEXER_API_KEY) return;

    setIsLoading(true);
    try {
      const headers = new Headers({
        accept: 'application/json',
        'x-api-key': INDEXER_API_KEY,
        'Content-Type': 'application/json',
      });

      // Build payload for each address
      const payload = addresses.map(a => ({
        address: a.address,
        blockchain: a.network,
      }));

      const res = await fetch(`${INDEXER_BASE_URL}/v1/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ addresses: payload }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const txList: IndexerTransaction[] = (data?.transactions ?? data ?? []).flat();
      setList(txList.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.warn('[useTransactions] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [addresses]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { list, isLoading };
}
