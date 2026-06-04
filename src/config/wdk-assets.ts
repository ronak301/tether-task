import { BaseAsset } from '@tetherto/wdk-react-native-core';

// USDT contract addresses per network
const USDT_CONTRACTS: Record<string, string> = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  polygon: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  ton: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  solana: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

// XAU₮ (Tether Gold) — Ethereum only
const XAUT_CONTRACT = '0x68749665FF8D2d112Fa859AA293F07A622782F38';

// BTC — native on bitcoin network
export const btcAsset = new BaseAsset({
  id: 'btc',
  network: 'bitcoin',
  symbol: 'BTC',
  name: 'Bitcoin',
  decimals: 8,
  isNative: true,
  address: null,
});

// USDT on each supported network
export const usdtAssets = Object.entries(USDT_CONTRACTS).map(
  ([network, address]) =>
    new BaseAsset({
      id: 'usdt',
      network,
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: network === 'ton' ? 6 : network === 'tron' ? 6 : 6,
      isNative: false,
      address,
    })
);

// XAU₮ on Ethereum
export const xautAsset = new BaseAsset({
  id: 'xaut',
  network: 'ethereum',
  symbol: 'XAUt',
  name: 'Tether Gold',
  decimals: 6,
  isNative: false,
  address: XAUT_CONTRACT,
});

// All assets flat list — used for portfolio balance fetch
export const allAssets = [btcAsset, ...usdtAssets, xautAsset];

// Helper: get asset for a specific token + network combo
export function getAsset(tokenId: string, network: string): BaseAsset | undefined {
  return allAssets.find(
    a => a.getId() === tokenId.toLowerCase() && a.getNetwork() === network.toLowerCase()
  );
}

// Token denomination multiplier (10^decimals)
export function getDenomination(asset: BaseAsset): number {
  return Math.pow(10, asset.getDecimals());
}

// Convert display amount → smallest unit (string for BigInt safety)
export function toSmallestUnit(displayAmount: number, asset: BaseAsset): string {
  return Math.round(displayAmount * getDenomination(asset)).toString();
}

// Convert smallest unit → display amount
export function fromSmallestUnit(raw: string | null, asset: BaseAsset): number {
  if (!raw) return 0;
  return Number(raw) / getDenomination(asset);
}
