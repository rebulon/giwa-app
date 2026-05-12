import React, { useState, useEffect } from 'react'
import { Send, Copy, ExternalLink, CheckCircle, Plus, Coins, RefreshCw } from 'lucide-react'
import { publicClient, getWalletClient, shortAddress, fetchTokenBalance, formatTokenBalance } from '../lib/tempo'
import { CONTRACTS, EXPLORER_URL, ERC20_ABI, FACTORY_ABI } from '../config/contracts'
import { encodeFunctionData, parseUnits } from 'viem'

export default function Tokens({ account }) {
  const [selectedToken, setSelectedToken] = useState(CONTRACTS.tokens.gUSD.address)
  const [recipient, setRecipient]         = useState('')
  const [amount, setAmount]               = useState('')
  const [balance, setBalance]             = useState('0.00')
  const [txHash, setTxHash]               = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [copied, setCopied]               = useState('')

  // Create token form
  const [showCreate, setShowCreate]   = useState(false)
  const [newName, setNewName]         = useState('')
  const [newSymbol, setNewSymbol]     = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createResult, setCreateResult]   = useState(null)

  // All tokens (preset + created)
  const [allTokens, setAllTokens] = useState(Object.values(CONTRACTS.tokens))
  const [loadingTokens, setLoadingTokens] = useState(false)

  const currentToken = allTokens.find(t => t.address === selectedToken)

  useEffect(() => { if (account?.address) { loadBalance(); loadFactoryTokens() } }, [selectedToken, account])

  const loadBalance = async () => {
    if (!currentToken || !account?.address) return
    const bal = await fetchTokenBalance(currentToken.address, account.address)
    setBalance(formatTokenBalance(bal, currentToken.decimals || 6))
  }

  const loadFactoryTokens = async () => {
    setLoadingTokens(true)
    try {
      const tokens = await publicClient.readContract({
        address: CONTRACTS.tokenFactory.address,
        abi: FACTORY_ABI,
        functionName: 'getAllTokens',
      })
      const mapped = tokens.map(t => ({
        address: t.tokenAddress,
        name: t.name,
        symbol: t.symbol,
        decimals: 6,
        abi: ERC20_ABI,
        icon: t.symbol.charAt(0),
        creator: t.creator,
      }))
      const preset = Object.values(CONTRACTS.tokens)
      const presetAddrs = new Set(preset.map(t => t.address.toLowerCase()))
      const unique = mapped.filter(t => !presetAddrs.has(t.address.toLowerCase()))
      setAllTokens([...preset, ...unique])
    } catch (e) {
      console.error('Factory tokens error:', e)
    } finally {
      setLoadingTokens(false)
    }
  }

  const handleTransfer = async () => {
    setError(''); setSuccess('')
    if (!recipient || !recipient.startsWith('0x') || recipient.length !== 42) { setError('Invalid address'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter amount'); return }
    setLoading(true)
    try {
      const wallet = await getWalletClient()
      const hash = await wallet.transferToken({ tokenAddress: currentToken.address, to: recipient, amount })
      setTxHash(hash)
      setSuccess(`Sent ${amount} ${currentToken.symbol}`)
      setRecipient(''); setAmount('')
      setTimeout(() => loadBalance(), 3000)
    } catch (e) {
      setError('Transfer failed: ' + e.message)
    } finally { setLoading(false) }
  }

  const handleCreateToken = async () => {
    if (!newName || !newSymbol) { setError('Enter name and symbol'); return }
    setCreateLoading(true); setError(''); setCreateResult(null)
    try {
      const wallet = await getWalletClient()
      const hash = await wallet.createToken({ name: newName, symbol: newSymbol })
      setCreateResult({ hash, name: newName, symbol: newSymbol })
      setSuccess(`Token ${newSymbol} created!`)
      setNewName(''); setNewSymbol('')
      setTimeout(() => loadFactoryTokens(), 4000)
    } catch (e) {
      setError('Create failed: ' + e.message)
    } finally { setCreateLoading(false) }
  }

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="panel">
      <h2>Tokens</h2>
      <div className="subtitle"><span className="address-short">{shortAddress(account?.address)}</span></div>

      {error   && <div className="notification error">❌ {error}</div>}
      {success && (
        <div className="notification success">
          ✅ {success}
          {txHash && (
            <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ fontSize: '0.75rem' }}>{shortAddress(txHash)}</code>
              <button onClick={() => window.open(`${EXPLORER_URL}/tx/${txHash}`, '_blank')} className="btn-icon" style={{ width: 24, height: 24 }}><ExternalLink size={12} /></button>
            </div>
          )}
        </div>
      )}

      <div className="card-grid">
        {/* Transfer */}
        <div className="card">
          <h3>Transfer</h3>
          <div className="form-group">
            <select value={selectedToken} onChange={e => setSelectedToken(e.target.value)}>
              {allTokens.map(t => (
                <option key={t.address} value={t.address}>{t.symbol} — {t.name}</option>
              ))}
            </select>
            <input type="text" placeholder="Recipient (0x...)" value={recipient} onChange={e => setRecipient(e.target.value)} />
            <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" min="0" />
            <div className="balance-info">Balance: {balance} {currentToken?.symbol}</div>
            <button className="btn-primary" onClick={handleTransfer} disabled={loading || !recipient || !amount}>
              <Send size={14} />
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Token list */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Token List</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={loadFactoryTokens} className="btn-icon" title="Refresh" disabled={loadingTokens}>
                <RefreshCw size={14} className={loadingTokens ? 'spin' : ''} />
              </button>
              <button onClick={() => setShowCreate(!showCreate)} className="btn-small" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus size={12} /> Create
              </button>
            </div>
          </div>

          {showCreate && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--gray-50)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>Create ERC-20 Token</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" placeholder="Token name" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 2 }} />
                <input type="text" placeholder="SYMBOL" value={newSymbol} onChange={e => setNewSymbol(e.target.value.toUpperCase())} style={{ flex: 1 }} />
              </div>
              <button onClick={handleCreateToken} disabled={createLoading || !newName || !newSymbol} className="btn-primary" style={{ width: '100%' }}>
                {createLoading ? 'Deploying...' : 'Deploy Token'}
              </button>
              {createResult && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                  ✓ {createResult.symbol} deployed!
                  <a href={`${EXPLORER_URL}/tx/${createResult.hash}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 6 }}>View tx ↗</a>
                </div>
              )}
            </div>
          )}

          <div className="tokens-list">
            {allTokens.map(token => (
              <div key={token.address} className="token-item">
                <div className="token-info">
                  <div className="token-symbol">{token.symbol}</div>
                  <div className="token-details">
                    <strong>{token.name}</strong>
                    <small>{shortAddress(token.address)}</small>
                    {token.creator && <small style={{ color: 'var(--gray-400)' }}>by {shortAddress(token.creator)}</small>}
                  </div>
                </div>
                <div className="token-actions">
                  <button className="btn-icon" onClick={() => handleCopy(token.address, token.symbol)} title="Copy">
                    {copied === token.symbol ? <CheckCircle size={12} /> : <Copy size={12} />}
                  </button>
                  <button className="btn-icon" onClick={() => window.open(`${EXPLORER_URL}/address/${token.address}`, '_blank')} title="Explorer">
                    <ExternalLink size={12} />
                  </button>
                  <button className="btn-small" onClick={() => setSelectedToken(token.address)}>Select</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            Factory: {shortAddress(CONTRACTS.tokenFactory.address)}
          </div>
        </div>
      </div>

      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
