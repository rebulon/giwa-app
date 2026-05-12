import { createPublicClient, http, encodeFunctionData, parseUnits } from 'viem'
import { giwaSepolia } from '../config/chain'
import { CONTRACTS, ERC20_ABI, DEX_ABI, RPC_URL } from '../config/contracts'

// ── Public client ─────────────────────────────────────────────────────────────
export const publicClient = createPublicClient({
  chain: giwaSepolia,
  transport: http(RPC_URL),
})

// ── Helpers ───────────────────────────────────────────────────────────────────
export const shortAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatTokenBalance = (value, decimals = 6) => {
  if (!value) return '0.00'
  try {
    const num = Number(value.toString()) / 10 ** decimals
    if (num === 0) return '0.00'
    if (num < 0.0001) return '< 0.0001'
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } catch { return '0.00' }
}

export const formatNativeBalance = (value) => {
  if (!value) return '0.00'
  try {
    const num = Number(value.toString()) / 1e18
    if (num === 0) return '0.00'
    if (num < 0.00001) return '< 0.00001'
    return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
  } catch { return '0.00' }
}

// ── Wallet connection (MetaMask) ──────────────────────────────────────────────
export const connectWallet = async () => {
  if (!window.ethereum) throw new Error('MetaMask not installed')

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${giwaSepolia.id.toString(16)}` }],
    })
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId:         `0x${giwaSepolia.id.toString(16)}`,
          chainName:       giwaSepolia.name,
          nativeCurrency:  giwaSepolia.nativeCurrency,
          rpcUrls:         [giwaSepolia.rpcUrls.default.http[0]],
          blockExplorerUrls: [giwaSepolia.blockExplorers.default.url],
        }],
      })
    }
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  return { address: accounts[0] }
}

// ── Passkey stubs (GIWA uses MetaMask / standard EVM) ────────────────────────
export const createPasskeyAccount = async () => { throw new Error('Passkey not supported on GIWA — use MetaMask') }
export const loadPasskeyAccount   = async () => null
export const sendPasskeyTransaction = async () => { throw new Error('Passkey not supported on GIWA') }

// ── Wallet client (MetaMask) ─────────────────────────────────────────────────
export const getWalletClient = async () => {
  if (!window.ethereum) throw new Error('MetaMask not installed')
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  if (!accounts.length) throw new Error('No connected account')

  const getTokenDec = async (tokenAddress) => {
    try {
      return Number(await publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' }))
    } catch { return 6 }
  }

  const buildTx = async ({ to, data }) => {
    const nonce    = await publicClient.getTransactionCount({ address: accounts[0] })
    const gasPrice = await publicClient.getGasPrice()
    return {
      from:     accounts[0],
      to,
      data,
      value:    '0x0',
      gas:      '0x7A120',
      gasPrice: `0x${gasPrice.toString(16)}`,
      nonce:    `0x${nonce.toString(16)}`,
      chainId:  `0x${giwaSepolia.id.toString(16)}`,
      type:     '0x2',
    }
  }

  const sendTx = (params) =>
    window.ethereum.request({ method: 'eth_sendTransaction', params: [params] })

  return {
    account: { address: accounts[0] },

    sendTransaction: async ({ to, data }) => sendTx(await buildTx({ to, data })),

    transferToken: async ({ tokenAddress, to, amount }) => {
      const dec  = await getTokenDec(tokenAddress)
      const data = encodeFunctionData({ abi: ERC20_ABI, functionName: 'transfer', args: [to, parseUnits(amount, dec)] })
      return sendTx(await buildTx({ to: tokenAddress, data }))
    },

    approveToken: async ({ tokenAddress, spender, amount }) => {
      const dec  = await getTokenDec(tokenAddress)
      const data = encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [spender, parseUnits(amount, dec)] })
      return sendTx(await buildTx({ to: tokenAddress, data }))
    },

    createPair: async ({ tokenA, tokenB }) => {
      const data = encodeFunctionData({ abi: DEX_ABI, functionName: 'createPair', args: [tokenA, tokenB] })
      return sendTx(await buildTx({ to: CONTRACTS.swapRouter.address, data }))
    },

    addLiquidity: async ({ tokenA, tokenB, amountA, amountB }) => {
      const decA = await getTokenDec(tokenA)
      const decB = await getTokenDec(tokenB)
      const data = encodeFunctionData({
        abi: DEX_ABI, functionName: 'addLiquidity',
        args: [tokenA, tokenB, parseUnits(amountA, decA), parseUnits(amountB, decB), 0n, 0n],
      })
      return sendTx(await buildTx({ to: CONTRACTS.swapRouter.address, data }))
    },

    swapExactIn: async ({ tokenIn, tokenOut, amountIn, minOut }) => {
      const dec  = await getTokenDec(tokenIn)
      const decO = await getTokenDec(tokenOut)
      const data = encodeFunctionData({
        abi: DEX_ABI, functionName: 'swapExactIn',
        args: [tokenIn, tokenOut, parseUnits(amountIn, dec), parseUnits(minOut, decO)],
      })
      return sendTx(await buildTx({ to: CONTRACTS.swapRouter.address, data }))
    },

    swapExactOut: async ({ tokenIn, tokenOut, amountOut, maxIn }) => {
      const dec  = await getTokenDec(tokenIn)
      const decO = await getTokenDec(tokenOut)
      const data = encodeFunctionData({
        abi: DEX_ABI, functionName: 'swapExactOut',
        args: [tokenIn, tokenOut, parseUnits(amountOut, decO), parseUnits(maxIn, dec)],
      })
      return sendTx(await buildTx({ to: CONTRACTS.swapRouter.address, data }))
    },

    faucetToken: async (tokenAddress) => {
      const data = encodeFunctionData({ abi: ERC20_ABI, functionName: 'faucet', args: [] })
      return sendTx(await buildTx({ to: tokenAddress, data }))
    },

    createToken: async ({ name, symbol }) => {
      const { FACTORY_ABI } = await import('../config/contracts')
      const data = encodeFunctionData({ abi: FACTORY_ABI, functionName: 'createToken', args: [name, symbol] })
      return sendTx(await buildTx({ to: CONTRACTS.tokenFactory.address, data }))
    },
  }
}

// ── Balance helpers ───────────────────────────────────────────────────────────
export const fetchNativeBalance = async (address) => {
  if (!address) return { raw: 0n, formatted: '0.00' }
  try {
    const balance = await publicClient.getBalance({ address })
    return { raw: balance, formatted: formatNativeBalance(balance.toString()) }
  } catch { return { raw: 0n, formatted: '0.00' } }
}

export const fetchTokenBalance = async (tokenAddress, userAddress) => {
  if (!tokenAddress || !userAddress) return 0n
  try {
    return await publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [userAddress] })
  } catch { return 0n }
}

export const fetchAllBalances = async (address) => {
  if (!address) return null
  const nativeData = await fetchNativeBalance(address)
  const gUSD = await fetchTokenBalance(CONTRACTS.tokens.gUSD.address, address)
  const gKRW = await fetchTokenBalance(CONTRACTS.tokens.gKRW.address, address)
  const gEUR = await fetchTokenBalance(CONTRACTS.tokens.gEUR.address, address)
  return {
    rawNative: nativeData.raw,
    native:    nativeData.formatted,
    gUSD,
    gKRW,
    gEUR,
    gUSDFormatted: formatTokenBalance(gUSD),
    gKRWFormatted: formatTokenBalance(gKRW),
    gEURFormatted: formatTokenBalance(gEUR),
  }
}

export const getRealTempoBalance = async (address) => {
  if (!address) return 0
  try { return Number(await publicClient.getBalance({ address })) / 1e18 } catch { return 0 }
}

export const getProtocolNonce = async (address) => {
  if (!address) return 0
  try { return await publicClient.getTransactionCount({ address }) } catch { return 0 }
}

export const getUserNonceByKey = async () => 0

export const fetchBlockNumber = async () => {
  try { return await publicClient.getBlockNumber() } catch { return null }
}
