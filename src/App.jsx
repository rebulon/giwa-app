import React, { useState, useEffect } from 'react'
import Header    from './components/Header'
import Footer    from './components/Footer'
import Dashboard from './pages/Dashboard'
import Tokens    from './pages/Tokens'
import Dex       from './pages/Dex'
import Pay       from './pages/Pay'
import Faucet    from './pages/Faucet'
import AI        from './pages/AI'
import { connectWallet } from './lib/tempo'

export default function App() {
  const [account,     setAccount]     = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [connecting,  setConnecting]  = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) setAccount({ address: accounts[0] })
      })
      window.ethereum.on('accountsChanged', accounts => {
        if (accounts.length > 0) setAccount({ address: accounts[0] })
        else setAccount(null)
      })
      window.ethereum.on('chainChanged', () => window.location.reload())
    }
  }, [])

  const handleConnect = async () => {
    setConnecting(true); setError('')
    try {
      const acc = await connectWallet()
      setAccount(acc)
    } catch (e) { setError(e.message) }
    finally { setConnecting(false) }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard account={account} setCurrentPage={setCurrentPage} />
      case 'tokens':    return <Tokens    account={account} />
      case 'dex':       return <Dex       account={account} />
      case 'pay':       return <Pay       account={account} />
      case 'faucet':    return <Faucet    account={account} />
      case 'ai':        return <AI        account={account} />
      default:          return <Dashboard account={account} setCurrentPage={setCurrentPage} />
    }
  }

  const features = [
    { icon: '⚡', label: 'DEX',        desc: 'Swap tokens' },
    { icon: '🪙', label: 'Stablecoins', desc: 'gUSD · gKRW · gEUR' },
    { icon: '🤖', label: 'AI Assistant', desc: 'Dev helper' },
  ]

  return (
    <div className="app">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} account={account} onDisconnect={() => setAccount(null)} />
      <main className="main">
        {!account ? (
          <div className="connect-screen">
            <div className="connect-card">
              <div style={{ width:56, height:56, background:'linear-gradient(135deg,#1e40af,#3B82F6)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', fontSize:'1.5rem', boxShadow:'0 4px 16px rgba(59,130,246,0.35)' }}>기</div>
              <h2>GIWA App</h2>
              <p>DeFi platform on GIWA Sepolia — swap stablecoins, send payments, create tokens</p>

              <div className="connect-features">
                {features.map((f,i) => (
                  <div key={i} className="connect-feature">
                    <div className="feat-icon">{f.icon}</div>
                    <div className="feat-label">{f.label}</div>
                    <div className="feat-desc">{f.desc}</div>
                  </div>
                ))}
              </div>

              {error && <div className="notification error" style={{ marginBottom:'1rem' }}>{error}</div>}

              <button className="btn-primary" onClick={handleConnect} disabled={connecting} style={{ width:'100%', height:46, fontSize:'0.9375rem' }}>
                {connecting ? 'Connecting...' : '🦊 Connect MetaMask'}
              </button>

              <div className="connect-network">
                <strong>GIWA Sepolia</strong> · Chain ID: 91342 · sepolia-rpc.giwa.io
              </div>
            </div>
          </div>
        ) : renderPage()}
      </main>
      <Footer />
    </div>
  )
}
