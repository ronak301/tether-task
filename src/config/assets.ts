import { FiatCurrency } from '@/services/pricing-service';
import { NetworkType } from '@/types/wdk';

export interface AssetConfig {
  name: string;
  symbol: string;
  icon: any;
  color: string;
  supportedNetworks: NetworkType[];
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  amount: string;
  fiatValue: number;
  fiatCurrency: FiatCurrency;
  icon: string | any;
  color: string;
}

export const assetConfig: Record<string, AssetConfig> = {
  eth: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: require('../../assets/images/chains/ethereum-eth-logo.png'),
    color: '#627EEA',
    supportedNetworks: [NetworkType.ETHEREUM],
  },
  usdt: {
    name: 'USD₮',
    symbol: 'USD₮',
    icon: require('../../assets/images/tokens/tether-usdt-logo.png'),
    color: '#ffffff',
    supportedNetworks: [NetworkType.ETHEREUM],
  },
  xaut: {
    name: 'XAU₮',
    symbol: 'XAU₮',
    icon: require('../../assets/images/tokens/tether-xaut-logo.png'),
    color: '#ffffff',
    supportedNetworks: [NetworkType.ETHEREUM],
  },
};
