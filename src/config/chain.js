export const giwaSepolia = {
  id: 91342,
  name: 'GIWA Sepolia',
  network: 'giwa-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://sepolia-rpc.giwa.io'] },
    public:  { http: ['https://sepolia-rpc.giwa.io'] },
  },
  blockExplorers: {
    default: { name: 'GIWA Explorer', url: 'https://sepolia-explorer.giwa.io' },
  },
  contracts: {
    multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' },
  },
}

export const RPC_URL      = 'https://sepolia-rpc.giwa.io'
export const EXPLORER_URL = 'https://sepolia-explorer.giwa.io'
export const FAUCET_URL   = 'https://faucet.giwa.io'
export const CHAIN_ID     = 91342
