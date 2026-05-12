import React, { useState, useEffect } from 'react'
import { ExternalLink, Copy, CheckCircle, Zap, Coins, Clock } from 'lucide-react'
import { shortAddress, getWalletClient, publicClient } from '../lib/tempo'
import { CONTRACTS, EXPLORER_URL, FAUCET_URL, ERC20_ABI } from '../config/contracts'

export default function Faucet({ account }) {
  const [loading,   setLoading]   = useState({})
  const [copied,    setCopied]    = useState('')
  const [results,   setResults]   = useState({})
  const [cooldowns, setCooldowns] = useState({})

  const tokens = Object.values(CONTRACTS.tokens)

  // Check cooldowns on mount
  useEffect(() => {
    if (!account?.address) return
    checkCooldowns()
  }, [account])

  const checkCooldowns = async () => {
    const cd = {}
    for (const token of tokens) {
      try {
        const secs = await publicClient.readContract({
          address: token.address, abi: ERC20_ABI,
          functionName: 'faucetCooldownLeft', args: [account.address],
        })
        cd[token.symbol] = Number(secs)
      } catch { cd[token.symbol] = 0 }
    }
    setCooldowns(cd)
  }

  const formatCooldown = (secs) => {
    if (!secs) return null
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const handleFaucet = async (token) => {
    if (!account?.address) { alert('Connect wallet first'); return }
    setLoading(l => ({ ...l, [token.symbol]: true }))
    setResults(r => ({ ...r, [token.symbol]: null }))
    try {
      const wallet = await getWalletClient()
      const hash = await wallet.faucetToken(token.address)
      setResults(r => ({ ...r, [token.symbol]: { success: true, hash } }))
      setTimeout(() => checkCooldowns(), 3000)
    } catch (e) {
      const msg = e.message?.includes('FaucetCooldown') ? 'Cooldown active' : e.message
      setResults(r => ({ ...r, [token.symbol]: { success: false, error: msg } }))
    } finally {
      setLoading(l => ({ ...l, [token.symbol]: false }))
    }
  }

  const handleFaucetAll = async () => {
    for (const token of tokens) {
      if (!cooldowns[token.symbol]) await handleFaucet(token)
    }
  }

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000)
  }

  const allOnCooldown = tokens.every(t => cooldowns[t.symbol] > 0)

  return (
    <div className="panel">
      <h2><Zap size={22} color="var(--accent)" /> GIWA Faucet</h2>
      <div className="subtitle">
        <span className="address-short">{shortAddress(account?.address) || 'Not connected'}</span>
        <span>· 1,000,000 tokens · 24h cooldown</span>
      </div>

      {/* ETH banner */}
      <div className="card" style={{ marginBottom:'1rem', background:'linear-gradient(135deg,#eff6ff,#dbeafe)', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div style={{ fontWeight:700, marginBottom:2 }}>Need testnet ETH for gas?</div>
          <div style={{ fontSize:'0.875rem', color:'var(--gray-600)' }}>Get free ETH from the official GIWA faucet</div>
        </div>
        <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration:'none' }}>
          <ExternalLink size={14}/> faucet.giwa.io
        </a>
      </div>

      {/* Get all */}
      <div className="card" style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div style={{ fontWeight:700, marginBottom:2 }}>Get all GIWA stablecoins</div>
          <div style={{ fontSize:'0.875rem', color:'var(--gray-500)' }}>1,000,000 gUSD + gKRW + gEUR</div>
        </div>
        <button onClick={handleFaucetAll} disabled={!account || Object.values(loading).some(Boolean) || allOnCooldown} className="btn-primary">
          <Zap size={14}/>
          {allOnCooldown ? 'All on cooldown' : Object.values(loading).some(Boolean) ? 'Processing...' : 'Request All'}
        </button>
      </div>

      {/* Token table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Coins size={16} color="var(--accent)"/>
            <span style={{ fontWeight:700, fontSize:'0.9375rem' }}>Stablecoins</span>
          </div>
          <span className="badge badge-accent">1,000,000 each</span>
        </div>

        {tokens.map((token, i) => {
          const res = results[token.symbol]
          const cd  = cooldowns[token.symbol]
          const isLoading = loading[token.symbol]
          const tokenColors = { gUSD:'var(--gusd)', gKRW:'var(--gkrw)', gEUR:'var(--geur)' }

          return (
            <div key={token.address} style={{ padding:'1rem 1.25rem', borderBottom: i < tokens.length-1 ? '1px solid var(--border)' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <div style={{ width:40, height:40, borderRadius:10, background: tokenColors[token.symbol] || 'var(--black)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.125rem', flexShrink:0 }}>
                  {token.icon}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.9375rem' }}>{token.symbol}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--gray-500)' }}>{token.name}</div>
                </div>
              </div>

              <div style={{ flex:1, textAlign:'center' }}>
                <code style={{ fontSize:'0.6875rem' }}>{shortAddress(token.address)}</code>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                {/* Status */}
                {res?.success && (
                  <span className="badge badge-success">
                    <CheckCircle size={10}/> Sent
                  </span>
                )}
                {res?.success === false && (
                  <span className="badge badge-error" title={res.error}>Failed</span>
                )}
                {cd > 0 && (
                  <span className="badge badge-gray">
                    <Clock size={10}/> {formatCooldown(cd)}
                  </span>
                )}

                <button onClick={() => handleCopy(token.address, token.symbol)} className="btn-icon">
                  {copied===token.symbol ? <CheckCircle size={12} color="var(--success)"/> : <Copy size={12}/>}
                </button>
                <button onClick={() => window.open(`${EXPLORER_URL}/address/${token.address}`,'_blank')} className="btn-icon">
                  <ExternalLink size={12}/>
                </button>
                {res?.success && res?.hash && (
                  <button onClick={() => window.open(`${EXPLORER_URL}/tx/${res.hash}`,'_blank')} className="btn-icon">
                    <ExternalLink size={12} color="var(--success)"/>
                  </button>
                )}
                <button
                  onClick={() => handleFaucet(token)}
                  disabled={isLoading || !account || cd > 0}
                  className="btn-primary"
                  style={{ minWidth:70, height:34 }}
                >
                  {isLoading ? '...' : cd > 0 ? formatCooldown(cd) : 'Get'}
                </button>
              </div>
            </div>
          )
        })}

        <div style={{ padding:'0.75rem 1.25rem', background:'var(--gray-50)', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.75rem', color:'var(--gray-500)' }}>
          <span><Zap size={12} style={{ display:'inline', marginRight:4 }}/>Calls token's built-in faucet() function on-chain</span>
          <span>Chain ID: 91342</span>
        </div>
      </div>
    </div>
  )
}
