import type { WdkConfigs } from '@tetherto/wdk-react-native-core';

const PIMLICO_KEY = process.env.EXPO_PUBLIC_PIMLICO_API_KEY;
const IS_SEPOLIA = process.env.EXPO_PUBLIC_CHAIN_ENV === 'sepolia';

const wdkNetworkConfigs: WdkConfigs = {
  networks: {
    ethereum: {
      blockchain: 'ethereum',
      config: IS_SEPOLIA
        ? {
            chainId: 11155111,
            provider: 'https://ethereum-sepolia-rpc.publicnode.com',
            bundlerUrl: `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_KEY}`,
            paymasterUrl: `https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_KEY}`,
            paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
            entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
            transferMaxFee: 5000000,
            paymasterToken: { address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' },
            safeModulesVersion: '0.3.0',
          }
        : {
            chainId: 1,
            provider: 'https://eth.merkle.io',
            bundlerUrl: `https://api.pimlico.io/v2/ethereum/rpc?apikey=${PIMLICO_KEY}`,
            paymasterUrl: 'https://api.candide.dev/public/v3/ethereum',
            paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
            entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
            transferMaxFee: 5000000,
            paymasterToken: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
            safeModulesVersion: '0.3.0',
          },
    },
  },
};

export default wdkNetworkConfigs;
