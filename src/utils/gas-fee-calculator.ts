import { AssetTicker, NetworkType } from '@/types/wdk-types';

export interface GasFeeEstimate {
  fee?: number;
  error?: string;
}

// Kept for use in select-network screens to display network labels
export const getNetworkType = (networkId: string): NetworkType => {
  const map: Record<string, NetworkType> = {
    ethereum: NetworkType.ETHEREUM,
    polygon: NetworkType.POLYGON,
    arbitrum: NetworkType.ARBITRUM,
    bitcoin: NetworkType.SEGWIT,
    lightning: NetworkType.LIGHTNING,
    ton: NetworkType.TON,
    tron: NetworkType.TRON,
    solana: NetworkType.SOLANA,
  };
  return map[networkId] || NetworkType.ETHEREUM;
};

export const getAssetTicker = (tokenId: string): AssetTicker => {
  const map: Record<string, AssetTicker> = {
    btc: AssetTicker.BTC,
    usdt: AssetTicker.USDT,
    xaut: AssetTicker.XAUT,
  };
  return map[tokenId?.toLowerCase()] || AssetTicker.USDT;
};
