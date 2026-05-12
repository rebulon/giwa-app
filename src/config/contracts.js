import { http } from 'viem'
import { giwaSepolia } from './chain'

export const RPC_URL      = 'https://sepolia-rpc.giwa.io'
export const EXPLORER_URL = 'https://sepolia-explorer.giwa.io'
export const CHAIN_ID     = 91342

// ── ERC-20 ABI ────────────────────────────────────────────────────────────────
export const ERC20_ABI = [
  { name: 'name',        type: 'function', inputs: [], outputs: [{ name: '', type: 'string' }],   stateMutability: 'view' },
  { name: 'symbol',      type: 'function', inputs: [], outputs: [{ name: '', type: 'string' }],   stateMutability: 'view' },
  { name: 'decimals',    type: 'function', inputs: [], outputs: [{ name: '', type: 'uint8' }],    stateMutability: 'view' },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint256' }],  stateMutability: 'view' },
  { name: 'balanceOf',   type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'transfer',    type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'allowance',   type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'approve',     type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'transferFrom', type: 'function', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'faucet',      type: 'function', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { name: 'faucetCooldownLeft', type: 'function', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'mint',        type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'burn',        type: 'function', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'Transfer',    type: 'event', inputs: [{ name: 'from', type: 'address', indexed: true }, { name: 'to', type: 'address', indexed: true }, { name: 'value', type: 'uint256', indexed: false }] },
  { name: 'Approval',    type: 'event', inputs: [{ name: 'owner', type: 'address', indexed: true }, { name: 'spender', type: 'address', indexed: true }, { name: 'value', type: 'uint256', indexed: false }] },
]

// ── Factory ABI ───────────────────────────────────────────────────────────────
export const FACTORY_ABI = [
  {
    name: 'createToken',
    type: 'function',
    inputs: [
      { name: '_name',   type: 'string' },
      { name: '_symbol', type: 'string' },
    ],
    outputs: [{ name: 'token', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getAllTokens',
    type: 'function',
    inputs: [],
    outputs: [{
      name: '',
      type: 'tuple[]',
      components: [
        { name: 'tokenAddress', type: 'address' },
        { name: 'name',        type: 'string' },
        { name: 'symbol',      type: 'string' },
        { name: 'creator',     type: 'address' },
        { name: 'createdAt',   type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
  },
  {
    name: 'getTokenCount',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getTokensByCreator',
    type: 'function',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    name: 'isGiwaToken',
    type: 'function',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  { name: 'TokenCreated', type: 'event', inputs: [{ name: 'token', type: 'address', indexed: true }, { name: 'creator', type: 'address', indexed: true }, { name: 'name', type: 'string', indexed: false }, { name: 'symbol', type: 'string', indexed: false }] },
]

// ── DEX ABI ───────────────────────────────────────────────────────────────────
export const DEX_ABI = [
  { type: 'error', name: 'PairExists',                inputs: [] },
  { type: 'error', name: 'PairNotFound',              inputs: [] },
  { type: 'error', name: 'SameToken',                 inputs: [] },
  { type: 'error', name: 'ZeroAmount',                inputs: [] },
  { type: 'error', name: 'SlippageExceeded',          inputs: [] },
  { type: 'error', name: 'InsufficientLiquidity',     inputs: [] },
  { type: 'error', name: 'InsufficientLiquidityBalance', inputs: [] },
  { type: 'error', name: 'TransferFailed',            inputs: [] },
  {
    name: 'createPair',
    type: 'function',
    inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }],
    outputs: [{ name: 'pairId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getPair',
    type: 'function',
    inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }],
    outputs: [{ name: 'pairId', type: 'bytes32' }, { name: 'token0', type: 'address' }, { name: 'token1', type: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'addLiquidity',
    type: 'function',
    inputs: [
      { name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' },
      { name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' },
      { name: 'minAmountA', type: 'uint256' }, { name: 'minAmountB', type: 'uint256' },
    ],
    outputs: [{ name: 'liquidity', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'removeLiquidity',
    type: 'function',
    inputs: [
      { name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' },
      { name: 'liquidityAmount', type: 'uint256' },
      { name: 'minAmountA', type: 'uint256' }, { name: 'minAmountB', type: 'uint256' },
    ],
    outputs: [{ name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapExactIn',
    type: 'function',
    inputs: [
      { name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' }, { name: 'minOut', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'swapExactOut',
    type: 'function',
    inputs: [
      { name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' },
      { name: 'amountOut', type: 'uint256' }, { name: 'maxIn', type: 'uint256' },
    ],
    outputs: [{ name: 'amountIn', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'quoteExactIn',
    type: 'function',
    inputs: [{ name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' }, { name: 'amountIn', type: 'uint256' }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'quoteExactOut',
    type: 'function',
    inputs: [{ name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' }, { name: 'amountOut', type: 'uint256' }],
    outputs: [{ name: 'amountIn', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getPairInfo',
    type: 'function',
    inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }],
    outputs: [
      { name: 'reserve0', type: 'uint256' }, { name: 'reserve1', type: 'uint256' },
      { name: 'totalLiquidity', type: 'uint256' }, { name: 't0', type: 'address' }, { name: 't1', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getUserLiquidity',
    type: 'function',
    inputs: [{ name: 'tokenA', type: 'address' }, { name: 'tokenB', type: 'address' }, { name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getAllPairs',
    type: 'function',
    inputs: [],
    outputs: [{
      name: 'result',
      type: 'tuple[]',
      components: [
        { name: 'pairId', type: 'bytes32' }, { name: 'token0', type: 'address' },
        { name: 'token1', type: 'address' }, { name: 'reserve0', type: 'uint256' },
        { name: 'reserve1', type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
  },
  {
    name: 'getPairCount',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  { name: 'PairCreated',      type: 'event', inputs: [{ name: 'pairId', type: 'bytes32', indexed: true }, { name: 'token0', type: 'address', indexed: false }, { name: 'token1', type: 'address', indexed: false }] },
  { name: 'Swap',             type: 'event', inputs: [{ name: 'pairId', type: 'bytes32', indexed: true }, { name: 'sender', type: 'address', indexed: true }, { name: 'tokenIn', type: 'address', indexed: false }, { name: 'amountIn', type: 'uint256', indexed: false }, { name: 'tokenOut', type: 'address', indexed: false }, { name: 'amountOut', type: 'uint256', indexed: false }] },
  { name: 'LiquidityAdded',   type: 'event', inputs: [{ name: 'pairId', type: 'bytes32', indexed: true }, { name: 'provider', type: 'address', indexed: true }, { name: 'amount0', type: 'uint256', indexed: false }, { name: 'amount1', type: 'uint256', indexed: false }, { name: 'liquidity', type: 'uint256', indexed: false }] },
  { name: 'LiquidityRemoved', type: 'event', inputs: [{ name: 'pairId', type: 'bytes32', indexed: true }, { name: 'provider', type: 'address', indexed: true }, { name: 'amount0', type: 'uint256', indexed: false }, { name: 'amount1', type: 'uint256', indexed: false }] },
]

// ── Deployed contract addresses ───────────────────────────────────────────────
export const CONTRACTS = {
  tokenFactory: {
    address: '0x63AFE706549242C8839a16da3368FB26e44f3f21',
    abi: FACTORY_ABI,
    name: 'GIWA Token Factory',
    description: 'Create new ERC-20 tokens',
  },
  swapRouter: {
    address: '0xFFa4E478219A32343081Bfcf65dE26B2c18e14A8',
    abi: DEX_ABI,
    name: 'GIWA Swap Router',
    description: 'AMM DEX — swap ERC-20 tokens',
  },
  tokens: {
    gUSD: {
      address: '0xaabfb20E8D2DB76f64DA757e2031E269c4Cd8b4F',
      symbol: 'gUSD',
      name: 'Giwa USD',
      decimals: 6,
      abi: ERC20_ABI,
      icon: '$',
    },
    gKRW: {
      address: '0x37fD05CeaC653c1775f1DDd682E371e7A1FBf410',
      symbol: 'gKRW',
      name: 'Giwa KRW',
      decimals: 6,
      abi: ERC20_ABI,
      icon: '₩',
    },
    gEUR: {
      address: '0x0eed1f26c0CDf4eF5d0fee3a2a576b9E2AE0caCB',
      symbol: 'gEUR',
      name: 'Giwa EUR',
      decimals: 6,
      abi: ERC20_ABI,
      icon: '€',
    },
  },
}
export const FAUCET_URL = 'https://faucet.giwa.io'
