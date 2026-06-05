import { NetworkType } from '@/types/wdk';

export const NETWORK_DESCRIPTIONS: Partial<Record<NetworkType, string>> = {
  [NetworkType.ETHEREUM]: 'ERC20',
};
