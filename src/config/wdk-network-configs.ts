import type { WdkConfigs } from '@tetherto/wdk-react-native-core';

const wdkNetworkConfigs: WdkConfigs = {
  networks: {
    ethereum: {
      blockchain: 'ethereum',
      config: {
        chainId: 1,
        provider: 'https://eth.merkle.io',
        bundlerUrl: 'https://api.candide.dev/public/v3/ethereum',
        paymasterUrl: 'https://api.candide.dev/public/v3/ethereum',
        paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
        entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        transferMaxFee: 5000000,
        paymasterToken: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      },
    },
    polygon: {
      blockchain: 'polygon',
      config: {
        chainId: 137,
        provider: 'https://1rpc.io/matic',
        bundlerUrl: 'https://api.candide.dev/public/v3/polygon',
        paymasterUrl: 'https://api.candide.dev/public/v3/polygon',
        paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
        entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        transferMaxFee: 5000000,
        paymasterToken: { address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' },
        safeModulesVersion: '0.3.0',
      },
    },
    arbitrum: {
      blockchain: 'arbitrum',
      config: {
        chainId: 42161,
        provider: 'https://arb1.arbitrum.io/rpc',
        bundlerUrl: 'https://api.candide.dev/public/v3/arbitrum',
        paymasterUrl: 'https://api.candide.dev/public/v3/arbitrum',
        paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
        entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
        transferMaxFee: 5000000,
        paymasterToken: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
      },
    },
    ton: {
      blockchain: 'ton',
      config: {
        tonApiClient: { url: 'https://tonapi.io' },
        tonClient: { url: 'https://toncenter.com/api/v2/jsonRPC' },
        paymasterToken: { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs' },
        transferMaxFee: 1000000000,
      },
    },
    tron: {
      blockchain: 'tron',
      config: {
        chainId: 3448148188,
        provider: 'https://trongrid.io',
        gasFreeProvider: 'https://gasfree.io',
        apiKey: process.env.EXPO_PUBLIC_TRON_API_KEY!,
        apiSecret: process.env.EXPO_PUBLIC_TRON_API_SECRET!,
        serviceProvider: 'TKtWbdzEq5ss9vTS9kwRhBp5mXmBfBns3E',
        verifyingContract: 'THQGuFzL87ZqhxkgqYEryRAd7gqFqL5rdc',
        transferMaxFee: 10000000,
        paymasterToken: { address: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf' },
      },
    },
    solana: {
      blockchain: 'solana',
      config: {
        provider: 'https://api.mainnet-beta.solana.com',
      },
    },
    bitcoin: {
      blockchain: 'bitcoin',
      config: {
        host: 'api.ordimint.com',
        port: 50001,
      },
    },
  },
};

export default wdkNetworkConfigs;
