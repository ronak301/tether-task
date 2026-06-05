import { AssetTicker, NetworkType } from '@/types/wdk';

export interface GasFeeEstimate {
  fee?: number;
  error?: string;
}

// Kept for use in select-network screens to display network labels
export const getNetworkType = (networkId: string): NetworkType => {
  return NetworkType.ETHEREUM;
};

export const getAssetTicker = (tokenId: string): AssetTicker => {
  const map: Record<string, AssetTicker> = {
    usdt: AssetTicker.USDT,
    xaut: AssetTicker.XAUT,
  };
  return map[tokenId?.toLowerCase()] || AssetTicker.USDT;
};
