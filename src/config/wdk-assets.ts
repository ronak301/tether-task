import { BaseAsset } from '@tetherto/wdk-react-native-core';

const IS_SEPOLIA = process.env.EXPO_PUBLIC_CHAIN_ENV === 'sepolia';

// ETH — native on Ethereum / Sepolia
export const ethAsset = new BaseAsset({
  id: 'eth',
  network: 'ethereum',
  symbol: 'ETH',
  name: IS_SEPOLIA ? 'Ethereum (Sepolia)' : 'Ethereum',
  decimals: 18,
  isNative: true,
  address: null,
});

// USDT — mainnet or Sepolia test contract
export const usdtAsset = new BaseAsset({
  id: 'usdt',
  network: 'ethereum',
  symbol: 'USDT',
  name: 'Tether USD',
  decimals: 6,
  isNative: false,
  address: IS_SEPOLIA
    ? '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0'
    : '0xdAC17F958D2ee523a2206206994597C13D831ec7',
});

// XAU₮ — Ethereum mainnet only (no Sepolia deployment)
export const xautAsset = new BaseAsset({
  id: 'xaut',
  network: 'ethereum',
  symbol: 'XAUt',
  name: 'Tether Gold',
  decimals: 6,
  isNative: false,
  address: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
});

// XAUt is mainnet-only — no Sepolia deployment.
export const allAssets = IS_SEPOLIA
  ? [ethAsset, usdtAsset]
  : [ethAsset, usdtAsset, xautAsset];

export function getAsset(tokenId: string, network: string): BaseAsset | undefined {
  return allAssets.find(
    a => a.getId() === tokenId.toLowerCase() && a.getNetwork() === network.toLowerCase()
  );
}

export function getDenomination(asset: BaseAsset): number {
  return Math.pow(10, asset.getDecimals());
}

export function toSmallestUnit(displayAmount: number, asset: BaseAsset): string {
  return Math.round(displayAmount * getDenomination(asset)).toString();
}

export function fromSmallestUnit(raw: string | null, asset: BaseAsset): number {
  if (!raw) return 0;
  return Number(raw) / getDenomination(asset);
}
