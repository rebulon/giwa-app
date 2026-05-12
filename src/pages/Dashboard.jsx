import React, { useState, useEffect, useCallback } from 'react'
import { Activity, RefreshCw, Zap, ExternalLink, Copy, Shield, Globe, Clock, CheckCircle, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react'
import { fetchAllBalances, fetchBlockNumber, shortAddress, publicClient } from '../lib/tempo'
import { CONTRACTS, EXPLORER_URL } from '../config/contracts'

export default function Dashboard({ account, setCurrentPage }) {
  const [balances,     setBalances]     = useState(null)
  const [blockNumber,  setBlockNumber]  = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copied,       setCopied]       = useState('')
  const [gasPrice,     setGasPrice]     = useState('—')
  const [txHistory,    setTxHistory]    = useState([])
  const [loadingTx,    setLoadingTx]    = useState(false)

  const systemContracts = [
    { ...CONTRACTS.tokenFactory, description: 'Create ERC-20 tokens' },
    { ...CONTRACTS.swapRouter,   description: 'AMM DEX' },
    { name: 'gUSD', address: CONTRACTS.tokens.gUSD.address, description: 'Giwa USD' },
    { name: 'gKRW', address: CONTRACTS.tokens.gKRW.address, description: 'Giwa KRW' },
    { name: 'gEUR', address: CONTRACTS.tokens.gEUR.address, description: 'Giwa EUR' },
  ]

  const loadData = useCallback(async () => {
    if (!account?.address) return
    const [data, block] = await Promise.all([
      fetchAllBalances(account.address),
      fetchBlockNumber(),
    ])
    setBalances(data)
    setBlockNumber(block)
    try {
      const price = await publicClient.getGasPrice()
      setGasPrice((Number(price) / 1e9).toFixed(3) + ' Gwei')
    } catch {}
  }, [account])

  const loadTxHistory = useCallback(async () => {
    if (!account?.address) return
    setLoadingTx(true)
    try {
      const resp = await fetch(`${EXPLORER_URL}/api/v2/addresses/${account.address}/transactions?limit=10`)
      if (resp.ok) {
        const data = await resp.json()
        setTxHistory(data.items || [])
      }
    } catch { setTxHistory([]) }
    finally { setLoadingTx(false) }
  }, [account])

  useEffect(() => {
    loadData()
    loadTxHistory()
    const interval = setInterval(loadData, 12000)
    return () => clearInterval(interval)
  }, [loadData, loadTxHistory])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([loadData(), loadTxHistory()])
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000)
  }

  const fmt = (val) => {
    if (!val || val === '0' || val === '0.00') return '0.00'
    const n = parseFloat(val.toString().replace(/,/g, ''))
    if (isNaN(n) || n === 0) return '0.00'
    if (n >= 1_000_000) return (n/1_000_000).toFixed(2)+'M'
    if (n >= 1_000)     return (n/1_000).toFixed(2)+'K'
    return n.toFixed(2)
  }

  const getTxType = (tx) => {
    if (!account) return 'out'
    const from = tx.from?.hash?.toLowerCase()
    const to   = tx.to?.hash?.toLowerCase()
    const me   = account.address.toLowerCase()
    if (from === me && to === me) return 'self'
    if (from === me) return 'out'
    return 'in'
  }

  const getTxIcon = (type) => {
    if (type === 'out')  return <ArrowUpRight size={14} />
    if (type === 'in')   return <ArrowDownLeft size={14} />
    return <ArrowLeftRight size={14} />
  }

  const formatTxValue = (tx) => {
    const val = Number(tx.value || 0) / 1e18
    if (val === 0) return tx.method || 'Contract call'
    return val.toFixed(4) + ' ETH'
  }

  const tokenCards = [
    { label: 'ETH',  value: balances?.native || '0.0000',          color: 'eth',  icon: 'Ξ',  nav: null },
    { label: 'gUSD', value: fmt(balances?.gUSDFormatted) || '0.00', color: 'gusd', icon: '$',  nav: 'dex' },
    { label: 'gKRW', value: fmt(balances?.gKRWFormatted) || '0.00', color: 'gkrw', icon: '₩', nav: 'dex' },
    { label: 'gEUR', value: fmt(balances?.gEURFormatted) || '0.00', color: 'geur', icon: '€',  nav: 'dex' },
  ]

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ marginBottom:2 }}>Dashboard</h2>
          <span className="address-short">{shortAddress(account?.address)}</span>
        </div>
        <div className="header-actions">
          <button onClick={() => window.open(EXPLORER_URL,'_blank')} className="btn-secondary">
            <ExternalLink size={14} /> Explorer
          </button>
          <button onClick={handleRefresh} className="btn-primary" disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Token cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {tokenCards.map((t,i) => (
          <div key={i} className={`token-card token-card-${t.color}`}
            onClick={() => t.nav && setCurrentPage(t.nav)}
            style={{ cursor: t.nav ? 'pointer' : 'default' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.3)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1rem', border:'1px solid rgba(255,255,255,0.4)' }}>
                {t.icon}
              </div>
              {t.nav && <ExternalLink size={12} style={{ opacity:0.5 }} />}
            </div>
            <div>
              <div style={{ fontSize:'1.375rem', fontWeight:800, lineHeight:1.2 }}>{t.value}</div>
              <div style={{ fontSize:'0.6875rem', fontWeight:600, opacity:0.7, marginTop:2 }}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Network + History grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>

        {/* Network activity */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Activity size={16} color="var(--accent)" />
              <span style={{ fontWeight:600, fontSize:'0.875rem' }}>Network</span>
            </div>
            <span className="status-badge online"><span className="status-dot" />Live</span>
          </div>
          <div style={{ height:60, display:'flex', alignItems:'flex-end', gap:2, marginBottom:'1rem' }}>
            {[...Array(40)].map((_,i) => (
              <div key={i} style={{ flex:1, height:`${15+Math.random()*85}%`, background:'var(--accent)', opacity:0.15+Math.random()*0.5, borderRadius:2 }} />
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem' }}>
            {[
              { label:'Chain ID', value:'91342',         icon:<Globe size={12}/> },
              { label:'Block',    value:blockNumber?.toString() || '—', icon:<Clock size={12}/> },
              { label:'Gas',      value:gasPrice,        icon:<Zap size={12}/> },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:'center', padding:'0.5rem', background:'var(--gray-50)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'0.5625rem', color:'var(--gray-500)', display:'flex', alignItems:'center', justifyContent:'center', gap:3, marginBottom:3 }}>{s.icon}{s.label}</div>
                <div style={{ fontSize:'0.75rem', fontWeight:700 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontWeight:600, fontSize:'0.875rem' }}>Recent Transactions</span>
            <button onClick={() => window.open(`${EXPLORER_URL}/address/${account?.address}`,'_blank')} className="btn-icon">
              <ExternalLink size={12} />
            </button>
          </div>
          <div style={{ maxHeight:180, overflowY:'auto' }}>
            {loadingTx ? (
              <div style={{ padding:'2rem', textAlign:'center', color:'var(--gray-400)', fontSize:'0.75rem' }}>Loading...</div>
            ) : txHistory.length === 0 ? (
              <div style={{ padding:'2rem', textAlign:'center', color:'var(--gray-400)', fontSize:'0.75rem' }}>No transactions yet</div>
            ) : txHistory.map((tx,i) => {
              const type = getTxType(tx)
              return (
                <div key={i} className="history-item" style={{ padding:'0.625rem 1.25rem', cursor:'pointer' }}
                  onClick={() => window.open(`${EXPLORER_URL}/tx/${tx.hash}`,'_blank')}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                    <div className={`history-icon ${type}`}>{getTxIcon(type)}</div>
                    <div>
                      <div style={{ fontSize:'0.75rem', fontWeight:600 }}>{formatTxValue(tx)}</div>
                      <div style={{ fontSize:'0.625rem', color:'var(--gray-500)', fontFamily:'JetBrains Mono,monospace' }}>{shortAddress(type==='out' ? tx.to?.hash : tx.from?.hash)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'0.625rem' }}>
                      <span className={`badge badge-${tx.status==='ok' ? 'success' : 'error'}`}>{tx.status==='ok' ? 'OK' : 'Fail'}</span>
                    </div>
                    <div style={{ fontSize:'0.5625rem', color:'var(--gray-400)', marginTop:2 }}>
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contracts */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Shield size={16} color="var(--accent)" /><h3>GIWA Contracts</h3></div>
          <span className="badge badge-accent">GIWA Sepolia</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {systemContracts.map((c,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0.75rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' }}>
              <div>
                <div style={{ fontSize:'0.75rem', fontWeight:600 }}>{c.name}</div>
                <div style={{ fontSize:'0.625rem', color:'var(--gray-500)' }}>{c.description}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <code style={{ fontSize:'0.6875rem' }}>{shortAddress(c.address)}</code>
                <button onClick={() => handleCopy(c.address, c.name)} className="btn-icon" style={{ width:26, height:26 }}>
                  {copied===c.name ? <CheckCircle size={11} color="var(--success)"/> : <Copy size={11}/>}
                </button>
                <button onClick={() => window.open(`${EXPLORER_URL}/address/${c.address}`,'_blank')} className="btn-icon" style={{ width:26, height:26 }}>
                  <ExternalLink size={11}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
