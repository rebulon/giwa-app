import React, { useState, useEffect } from 'react'
import { TrendingUp, CheckCircle, ExternalLink, Copy, ArrowLeftRight, Shield, Zap, ArrowDownUp, Layers } from 'lucide-react'
import { publicClient, getWalletClient, shortAddress, fetchTokenBalance } from '../lib/tempo'
import { CONTRACTS, EXPLORER_URL, DEX_ABI, ERC20_ABI } from '../config/contracts'
import { parseUnits, formatUnits } from 'viem'

export default function Dex({ account }) {
  const [tokenIn,  setTokenIn]  = useState(CONTRACTS.tokens.gUSD.address)
  const [tokenOut, setTokenOut] = useState(CONTRACTS.tokens.gKRW.address)
  const [amountIn, setAmountIn] = useState('')
  const [quote,    setQuote]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [txHash,   setTxHash]   = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [activeTab, setActiveTab] = useState('swap')
  const [pairInfo, setPairInfo]   = useState(null)
  const [copied,   setCopied]     = useState('')

  // Liquidity tab
  const [liqTokenA,  setLiqTokenA]  = useState(CONTRACTS.tokens.gUSD.address)
  const [liqTokenB,  setLiqTokenB]  = useState(CONTRACTS.tokens.gKRW.address)
  const [liqAmountA, setLiqAmountA] = useState('')
  const [liqAmountB, setLiqAmountB] = useState('')

  const tokens = Object.values(CONTRACTS.tokens)

  const getSymbol = (addr) => tokens.find(t => t.address === addr)?.symbol || '?'
  const getDec    = (addr) => tokens.find(t => t.address === addr)?.decimals || 6

  useEffect(() => {
    if (tokenIn && tokenOut && tokenIn !== tokenOut) loadPairInfo()
  }, [tokenIn, tokenOut])

  useEffect(() => {
    if (amountIn && parseFloat(amountIn) > 0 && tokenIn !== tokenOut) getQuote()
    else setQuote(null)
  }, [amountIn, tokenIn, tokenOut])

  const loadPairInfo = async () => {
    try {
      const info = await publicClient.readContract({
        address: CONTRACTS.swapRouter.address,
        abi: DEX_ABI,
        functionName: 'getPairInfo',
        args: [tokenIn, tokenOut],
      })
      setPairInfo({ reserve0: info[0], reserve1: info[1], totalLiquidity: info[2], token0: info[3], token1: info[4] })
    } catch { setPairInfo(null) }
  }

  const getQuote = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0 || tokenIn === tokenOut) { setQuote(null); return }
    try {
      const dec = getDec(tokenIn)
      const amt = parseUnits(amountIn, dec)
      const out = await publicClient.readContract({
        address: CONTRACTS.swapRouter.address,
        abi: DEX_ABI,
        functionName: 'quoteExactIn',
        args: [tokenIn, tokenOut, amt],
      })
      const decOut = getDec(tokenOut)
      setQuote({ amountOut: formatUnits(out, decOut), rate: (Number(formatUnits(out, decOut)) / parseFloat(amountIn)).toFixed(4) })
    } catch { setQuote(null) }
  }

  const handleSwap = async () => {
    setError(''); setSuccess('')
    if (!amountIn || parseFloat(amountIn) <= 0) { setError('Enter amount'); return }
    if (tokenIn === tokenOut) { setError('Select different tokens'); return }
    setLoading(true)
    try {
      const wallet  = await getWalletClient()
      const dec     = getDec(tokenIn)
      const decOut  = getDec(tokenOut)
      const inAmt   = parseUnits(amountIn, dec)
      const slippageMul = 1 - parseFloat(slippage) / 100

      // approve
      await wallet.approveToken({ tokenAddress: tokenIn, spender: CONTRACTS.swapRouter.address, amount: amountIn })
      await new Promise(r => setTimeout(r, 1500))

      // swap
      const minOut = quote ? (parseFloat(quote.amountOut) * slippageMul).toFixed(6) : '0'
      const hash = await wallet.swapExactIn({ tokenIn, tokenOut, amountIn, minOut })
      setTxHash(hash)
      setSuccess(`Swapped ${amountIn} ${getSymbol(tokenIn)} → ~${parseFloat(quote?.amountOut || 0).toFixed(2)} ${getSymbol(tokenOut)}`)
      setAmountIn(''); setQuote(null)
      await loadPairInfo()
    } catch (e) {
      if (e.message?.includes('user rejected')) setError('Rejected')
      else if (e.message?.includes('InsufficientLiquidity')) setError('Insufficient liquidity — add liquidity first')
      else setError('Swap failed: ' + e.message)
    } finally { setLoading(false) }
  }

  const handleCreatePair = async () => {
    setError(''); setLoading(true)
    try {
      const wallet = await getWalletClient()
      const hash = await wallet.createPair({ tokenA: liqTokenA, tokenB: liqTokenB })
      setTxHash(hash)
      setSuccess('Pair created!')
      setTimeout(() => loadPairInfo(), 3000)
    } catch (e) {
      if (e.message?.includes('PairExists')) setError('Pair already exists')
      else setError('Create pair failed: ' + e.message)
    } finally { setLoading(false) }
  }

  const handleAddLiquidity = async () => {
    setError(''); setSuccess('')
    if (!liqAmountA || !liqAmountB) { setError('Enter both amounts'); return }
    setLoading(true)
    try {
      const wallet = await getWalletClient()
      await wallet.approveToken({ tokenAddress: liqTokenA, spender: CONTRACTS.swapRouter.address, amount: liqAmountA })
      await new Promise(r => setTimeout(r, 1500))
      await wallet.approveToken({ tokenAddress: liqTokenB, spender: CONTRACTS.swapRouter.address, amount: liqAmountB })
      await new Promise(r => setTimeout(r, 1500))
      const hash = await wallet.addLiquidity({ tokenA: liqTokenA, tokenB: liqTokenB, amountA: liqAmountA, amountB: liqAmountB })
      setTxHash(hash)
      setSuccess(`Liquidity added: ${liqAmountA} ${getSymbol(liqTokenA)} + ${liqAmountB} ${getSymbol(liqTokenB)}`)
      setLiqAmountA(''); setLiqAmountB('')
      setTimeout(() => loadPairInfo(), 3000)
    } catch (e) {
      if (e.message?.includes('PairNotFound')) setError('Pair not found — create pair first')
      else setError('Add liquidity failed: ' + e.message)
    } finally { setLoading(false) }
  }

  const hasPair = pairInfo && pairInfo.token0 !== '0x0000000000000000000000000000000000000000'
  const hasLiquidity = hasPair && pairInfo.reserve0 > 0n

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="panel">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <TrendingUp size={24} /> GIWA DEX
      </h2>
      <div className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="address-short">{shortAddress(account?.address)}</span>
        <span style={{ color: hasLiquidity ? 'var(--success)' : 'var(--gray-500)', fontSize: '0.75rem' }}>
          • {hasLiquidity ? `Pair active · R0: ${formatUnits(pairInfo.reserve0, 6)}` : hasPair ? 'Pair exists (no liquidity)' : 'No pair'}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)', background: 'var(--gray-50)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <Zap size={12} style={{ display: 'inline', marginRight: 4 }} />0.3% fee
        </span>
      </div>

      {error   && <div style={{ marginBottom:'1rem', padding:'0.75rem 1rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderLeft:'3px solid var(--error)', borderRadius:'var(--radius)', fontSize:'0.875rem', color:'var(--error)' }}>❌ {error}</div>}
      {success && (
        <div style={{ marginBottom:'1rem', padding:'0.75rem 1rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderLeft:'3px solid var(--success)', borderRadius:'var(--radius)', fontSize:'0.875rem', display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
          <CheckCircle size={16} color="var(--success)" /><span>{success}</span>
          {txHash && <button onClick={() => window.open(`${EXPLORER_URL}/tx/${txHash}`, '_blank')} style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:4, padding:'0.25rem 0.5rem', background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'0.75rem', cursor:'pointer' }}>{shortAddress(txHash)} <ExternalLink size={12} /></button>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem' }}>
        {[['swap','Swap',<ArrowDownUp size={16}/>],['liquidity','Liquidity',<Layers size={16}/>]].map(([id,label,icon]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding:'0.5rem 1rem', background: activeTab===id ? 'var(--black)' : 'transparent', color: activeTab===id ? 'var(--white)' : 'var(--gray-600)', border:'none', borderRadius:'var(--radius-sm)', fontSize:'0.875rem', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── SWAP TAB ── */}
      {activeTab === 'swap' && (
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:600 }}>Instant Swap</h3>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--gray-600)' }}>Slippage:</span>
              <input type="number" value={slippage} onChange={e => setSlippage(e.target.value)} style={{ width:60, padding:'0.25rem 0.5rem', background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'0.75rem', textAlign:'right' }} step="0.1" min="0.1" max="50" />
              <span style={{ fontSize:'0.75rem', color:'var(--gray-600)' }}>%</span>
            </div>
          </div>

          <div style={{ marginBottom:'1rem' }}>
            <label style={{ fontSize:'0.6875rem', color:'var(--gray-600)', display:'block', marginBottom:4 }}>You Pay</label>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <select value={tokenIn} onChange={e => setTokenIn(e.target.value)} style={{ width:130, height:40 }}>
                {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
              </select>
              <input type="number" placeholder="0.00" value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{ flex:1, height:40, fontSize:'1rem' }} />
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1rem' }}>
            <button onClick={() => { const tmp=tokenIn; setTokenIn(tokenOut); setTokenOut(tmp); setQuote(null) }} className="btn-icon" style={{ width:36, height:36 }}>
              <ArrowLeftRight size={16} />
            </button>
          </div>

          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ fontSize:'0.6875rem', color:'var(--gray-600)', display:'block', marginBottom:4 }}>You Receive</label>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <select value={tokenOut} onChange={e => setTokenOut(e.target.value)} style={{ width:130, height:40 }}>
                {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
              </select>
              <div style={{ flex:1, height:40, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--gray-50)', display:'flex', alignItems:'center', paddingLeft:12, fontSize:'1rem', fontWeight:600, color: quote ? 'var(--black)' : 'var(--gray-400)' }}>
                {quote ? parseFloat(quote.amountOut).toFixed(2) : '—'}
              </div>
            </div>
          </div>

          {quote && (
            <div style={{ padding:'0.75rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderRadius:'var(--radius)', marginBottom:'1.5rem', fontSize:'0.75rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:'var(--gray-600)' }}>Rate</span>
                <span style={{ fontWeight:600 }}>1 {getSymbol(tokenIn)} = {quote.rate} {getSymbol(tokenOut)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'var(--gray-600)' }}>Min received ({slippage}% slippage)</span>
                <span style={{ fontWeight:600, color:'var(--success)' }}>{(parseFloat(quote.amountOut) * (1 - parseFloat(slippage)/100)).toFixed(2)} {getSymbol(tokenOut)}</span>
              </div>
            </div>
          )}

          {!hasLiquidity && (
            <div style={{ padding:'0.75rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderLeft:'3px solid var(--warning)', borderRadius:'var(--radius)', marginBottom:'1rem', fontSize:'0.875rem' }}>
              ⚠️ No liquidity for this pair. Switch to the Liquidity tab to add it.
            </div>
          )}

          <button className="btn-primary" onClick={handleSwap} disabled={loading || !amountIn || tokenIn===tokenOut || !hasLiquidity} style={{ width:'100%', height:48, fontSize:'0.875rem' }}>
            {loading ? 'Processing...' : `Swap ${getSymbol(tokenIn)} → ${getSymbol(tokenOut)}`}
          </button>
        </div>
      )}

      {/* ── LIQUIDITY TAB ── */}
      {activeTab === 'liquidity' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {/* Create Pair */}
          <div className="card">
            <h3 style={{ fontSize:'1rem', fontWeight:600, marginBottom:'1rem' }}>1. Create Pair</h3>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
              <select value={liqTokenA} onChange={e => setLiqTokenA(e.target.value)} style={{ flex:1, height:40 }}>
                {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
              </select>
              <ArrowLeftRight size={16} style={{ color:'var(--gray-400)' }} />
              <select value={liqTokenB} onChange={e => setLiqTokenB(e.target.value)} style={{ flex:1, height:40 }}>
                {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
              </select>
            </div>
            <button className="btn-secondary" onClick={handleCreatePair} disabled={loading || liqTokenA===liqTokenB} style={{ width:'100%' }}>
              {loading ? 'Processing...' : 'Create Pair'}
            </button>
          </div>

          {/* Add Liquidity */}
          <div className="card">
            <h3 style={{ fontSize:'1rem', fontWeight:600, marginBottom:'1rem' }}>2. Add Liquidity</h3>
            <p style={{ fontSize:'0.875rem', color:'var(--gray-600)', marginBottom:'1rem' }}>
              Add equal-value amounts of both tokens. First time sets the price.
            </p>
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'0.6875rem', color:'var(--gray-600)', display:'block', marginBottom:4 }}>{getSymbol(liqTokenA)}</label>
                <input type="number" placeholder="Amount A" value={liqAmountA} onChange={e => setLiqAmountA(e.target.value)} style={{ width:'100%', height:40 }} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'0.6875rem', color:'var(--gray-600)', display:'block', marginBottom:4 }}>{getSymbol(liqTokenB)}</label>
                <input type="number" placeholder="Amount B" value={liqAmountB} onChange={e => setLiqAmountB(e.target.value)} style={{ width:'100%', height:40 }} />
              </div>
            </div>
            <button className="btn-primary" onClick={handleAddLiquidity} disabled={loading || !liqAmountA || !liqAmountB} style={{ width:'100%' }}>
              {loading ? 'Processing...' : 'Add Liquidity'}
            </button>
          </div>

          {/* Pair info */}
          {hasPair && (
            <div className="card" style={{ background:'var(--gray-50)' }}>
              <h3 style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <Shield size={16} /> Current Pair Info
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.75rem' }}>
                <div><span style={{ color:'var(--gray-600)' }}>Token 0:</span> <strong>{shortAddress(pairInfo.token0)}</strong></div>
                <div><span style={{ color:'var(--gray-600)' }}>Token 1:</span> <strong>{shortAddress(pairInfo.token1)}</strong></div>
                <div><span style={{ color:'var(--gray-600)' }}>Reserve 0:</span> <strong>{formatUnits(pairInfo.reserve0, 6)}</strong></div>
                <div><span style={{ color:'var(--gray-600)' }}>Reserve 1:</span> <strong>{formatUnits(pairInfo.reserve1, 6)}</strong></div>
                <div><span style={{ color:'var(--gray-600)' }}>Liquidity:</span> <strong>{pairInfo.totalLiquidity?.toString()}</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DEX contract info */}
      <div style={{ marginTop:'1rem', padding:'0.75rem 1rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Shield size={14} /><span style={{ fontWeight:500 }}>DEX Contract:</span>
          <code style={{ fontFamily:'JetBrains Mono,monospace', background:'var(--white)', padding:'0.25rem 0.5rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
            {shortAddress(CONTRACTS.swapRouter.address)}
          </code>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={() => handleCopy(CONTRACTS.swapRouter.address,'dex')} className="btn-icon">{copied==='dex' ? <CheckCircle size={14} color="var(--success)"/> : <Copy size={14}/>}</button>
          <button onClick={() => window.open(`${EXPLORER_URL}/address/${CONTRACTS.swapRouter.address}`,'_blank')} className="btn-icon"><ExternalLink size={14}/></button>
        </div>
      </div>
    </div>
  )
}
