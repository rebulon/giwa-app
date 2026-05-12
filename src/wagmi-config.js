import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { giwaSepolia } from './config/chain'

export const config = createConfig({
  chains: [giwaSepolia],
  connectors: [injected()],
  multiInjectedProviderDiscovery: false,
  transports: {
    [giwaSepolia.id]: http('https://sepolia-rpc.giwa.io'),
  },
})
