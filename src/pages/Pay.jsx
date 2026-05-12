import React, { useState, useEffect, useRef } from 'react'
import { Send, Download, Copy, CheckCircle, CreditCard, AlertCircle, ExternalLink, QrCode, Link } from 'lucide-react'
import { shortAddress, getWalletClient } from '../lib/tempo'
import { CONTRACTS, EXPLORER_URL } from '../config/contracts'

// Minimal QR via Google Charts API (no deps)
const QRCode = ({ value, size = 160 }) => (
  <img
    src={`https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(value)}&choe=UTF-8`}
    alt="QR Code" width={size} height={size}
    style={{ borderRadius: 8, display:'block', margin:'0 auto' }}
  />
)

export default function Pay({ account }) {
  const [activeTab,     setActiveTab]     = useState('send')
  const [copied,        setCopied]        = useState('')
  const [amount,        setAmount]        = useState('')
  const [recipient,     setRecipient]     = useState('')
  const [memo,          setMemo]          = useState('')
  const [selectedToken, setSelectedToken] = useState(CONTRACTS.tokens.gUSD.address)
  const [loading,       setLoading]       = useState(false)
  const [txHash,        setTxHash]        = useState('')
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')

  // Receive tab
  const [receiveToken,  setReceiveToken]  = useState(CONTRACTS.tokens.gUSD.address)
  const [receiveAmount, setReceiveAmount] = useState('')
  const [payLink,       setPayLink]       = useState('')

  const tokens    = Object.values(CONTRACTS.tokens)
  const getSymbol = (addr) => tokens.find(t => t.address === addr)?.symbol || '?'
  const isValid   = (a) => a && a.startsWith('0x') && a.length === 42

  // Parse pay link from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('to'))     setRecipient(params.get('to'))
    if (params.get('amount')) setAmount(params.get('amount'))
    if (params.get('token')) {
      const t = tokens.find(t => t.symbol === params.get('token'))
      if (t) setSelectedToken(t.address)
    }
    if (params.get('memo'))   setMemo(params.get('memo'))
    if (params.get('to'))     setActiveTab('send')
  }, [])

  const generatePayLink = () => {
    const base = window.location.origin + window.location.pathname
    const params = new URLSearchParams()
    params.set('to', account?.address || '')
    if (receiveAmount) params.set('amount', receiveAmount)
    params.set('token', getSymbol(receiveToken))
    const link = `${base}?${params.toString()}`
    setPayLink(link)
    return link
  }

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000)
  }

  const handleSend = async () => {
    setError(''); setSuccess('')
    if (!isValid(recipient)) { setError('Invalid recipient address'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter amount'); return }
    setLoading(true)
    try {
      const wallet = await getWalletClient()
      const hash = await wallet.transferToken({ tokenAddress: selectedToken, to: recipient, amount })
      setTxHash(hash)
      setSuccess(`Sent ${amount} ${getSymbol(selectedToken)} to ${shortAddress(recipient)}`)
      setRecipient(''); setAmount(''); setMemo('')
    } catch (e) {
      if (e.message?.includes('user rejected')) setError('Transaction rejected')
      else setError('Failed: ' + e.message)
    } finally { setLoading(false) }
  }

  const qrValue = account?.address
    ? `ethereum:${account.address}${receiveAmount ? `?value=${receiveAmount}` : ''}`
    : ''

  return (
    <div className="panel">
      <h2><CreditCard size={22} /> GIWA Pay</h2>
      <div className="subtitle">
        <span className="address-short">{shortAddress(account?.address) || 'Not connected'}</span>
      </div>

      {error   && <div className="notification error" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}><AlertCircle size={14}/>{error}</div>}
      {success && (
        <div className="notification success" style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
          <CheckCircle size={14} color="var(--success)"/>{success}
          {txHash && <button onClick={() => window.open(`${EXPLORER_URL}/tx/${txHash}`,'_blank')} className="btn-small" style={{ marginLeft:'auto' }}>View tx ↗</button>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem' }}>
        {[['send','Send',<Send size={15}/>],['receive','Receive',<Download size={15}/>]].map(([id,label,icon]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding:'0.5rem 1rem', background: activeTab===id ? 'var(--accent)' : 'transparent', color: activeTab===id ? 'white' : 'var(--gray-600)', border:'none', borderRadius:'var(--radius-sm)', fontSize:'0.875rem', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── SEND ── */}
      {activeTab === 'send' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="card">
            <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'1.25rem' }}>Send Payment</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div>
                <label style={{ fontSize:'0.6875rem', fontWeight:600, color:'var(--gray-600)', display:'block', marginBottom:4 }}>TOKEN</label>
                <select value={selectedToken} onChange={e => setSelectedToken(e.target.value)} style={{ width:'100%', height:40 }}>
                  {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol} — {t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'0.6875rem', fontWeight:600, color:'var(--gray-600)', display:'block', marginBottom:4 }}>RECIPIENT</label>
                <input type="text" placeholder="0x..." value={recipient} onChange={e => setRecipient(e.target.value)} style={{ width:'100%', height:40 }} />
                {recipient && !isValid(recipient) && <div style={{ fontSize:'0.6875rem', color:'var(--error)', marginTop:3 }}>Invalid address</div>}
              </div>
              <div>
                <label style={{ fontSize:'0.6875rem', fontWeight:600, color:'var(--gray-600)', display:'block', marginBottom:4 }}>AMOUNT</label>
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ width:'100%', height:40 }} step="0.01" min="0" />
              </div>
              <div>
                <label style={{ fontSize:'0.6875rem', fontWeight:600, color:'var(--gray-600)', display:'block', marginBottom:4 }}>MEMO <span style={{ fontWeight:400 }}>(optional)</span></label>
                <input type="text" placeholder="Payment for..." value={memo} onChange={e => setMemo(e.target.value.slice(0,32))} style={{ width:'100%', height:40 }} />
                <div style={{ fontSize:'0.625rem', color:'var(--gray-400)', marginTop:3 }}>{memo.length}/32</div>
              </div>
              <button className="btn-primary" onClick={handleSend} disabled={loading || !recipient || !amount || !isValid(recipient)} style={{ width:'100%', height:44, fontSize:'0.9rem', marginTop:4 }}>
                <Send size={15} />
                {loading ? 'Sending...' : `Send ${amount||'0'} ${getSymbol(selectedToken)}`}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="card" style={{ background:'var(--accent-light)', border:'1px solid #bfdbfe' }}>
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--accent-dark)', marginBottom:'0.75rem' }}>TRANSACTION PREVIEW</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', fontSize:'0.8125rem' }}>
                {[
                  ['From',   shortAddress(account?.address) || '—'],
                  ['To',     recipient ? shortAddress(recipient) : '—'],
                  ['Token',  getSymbol(selectedToken)],
                  ['Amount', amount ? `${amount} ${getSymbol(selectedToken)}` : '—'],
                  ['Memo',   memo || '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--gray-600)' }}>{k}</span>
                    <span style={{ fontWeight:600, fontFamily: k==='From'||k==='To' ? 'JetBrains Mono,monospace' : 'inherit', fontSize: k==='From'||k==='To' ? '0.75rem' : 'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--gray-600)', marginBottom:'0.75rem' }}>QUICK FILL</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {[100, 500, 1000, 10000].map(n => (
                  <button key={n} onClick={() => setAmount(String(n))} className="btn-secondary" style={{ justifyContent:'space-between' }}>
                    <span>{n.toLocaleString()} {getSymbol(selectedToken)}</span>
                    <span style={{ color:'var(--gray-400)', fontSize:'0.625rem' }}>≈ ${n}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIVE ── */}
      {activeTab === 'receive' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="card" style={{ textAlign:'center' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'1.25rem' }}>Your QR Code</h3>
            {account?.address ? (
              <>
                <QRCode value={qrValue} size={180} />
                <div style={{ margin:'1rem 0 0.5rem', padding:'0.625rem 0.75rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontFamily:'JetBrains Mono,monospace', fontSize:'0.6875rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span>{shortAddress(account.address)}</span>
                  <button onClick={() => handleCopy(account.address,'addr')} className="btn-icon" style={{ width:26, height:26 }}>
                    {copied==='addr' ? <CheckCircle size={11} color="var(--success)"/> : <Copy size={11}/>}
                  </button>
                </div>
                <div style={{ fontSize:'0.75rem', color:'var(--gray-500)' }}>Scan to send tokens on GIWA Sepolia</div>
              </>
            ) : <div style={{ color:'var(--gray-400)' }}>Connect wallet</div>}
          </div>

          <div className="card">
            <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'1.25rem' }}>Payment Link</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div>
                <label style={{ fontSize:'0.6875rem', fontWeight:600, color:'var(--gray-600)', display:'block', marginBottom:4 }}>TOKEN</label>
                <select value={receiveToken} onChange={e => setReceiveToken(e.target.value)} style={{ width:'100%', height:40 }}>
                  {tokens.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'0.6875rem', fontWeight:600, color:'var(--gray-600)', display:'block', marginBottom:4 }}>AMOUNT <span style={{ fontWeight:400 }}>(optional)</span></label>
                <input type="number" placeholder="0.00" value={receiveAmount} onChange={e => setReceiveAmount(e.target.value)} style={{ width:'100%', height:40 }} />
              </div>
              <button onClick={generatePayLink} className="btn-primary" style={{ width:'100%' }}>
                <Link size={14} /> Generate Link
              </button>
              {payLink && (
                <div>
                  <div style={{ padding:'0.625rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'0.6875rem', fontFamily:'JetBrains Mono,monospace', wordBreak:'break-all', marginBottom:'0.5rem' }}>
                    {payLink}
                  </div>
                  <button onClick={() => handleCopy(payLink,'link')} className="btn-secondary" style={{ width:'100%' }}>
                    {copied==='link' ? <><CheckCircle size={13} color="var(--success)"/> Copied!</> : <><Copy size={13}/> Copy Link</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
