import React, { useState } from 'react'
import { Coins, TrendingUp, Droplets, Menu, X, Wallet, CreditCard, Bot } from 'lucide-react'
import { shortAddress } from '../lib/tempo'

const Header = ({ currentPage, setCurrentPage, account, onDisconnect }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Wallet size={18} /> },
    { id: 'tokens',    label: 'Tokens',    icon: <Coins size={18} /> },
    { id: 'dex',       label: 'DEX',       icon: <TrendingUp size={18} /> },
    { id: 'pay',       label: 'Pay',       icon: <CreditCard size={18} /> },
    { id: 'faucet',    label: 'Faucet',    icon: <Droplets size={18} /> },
    { id: 'ai',        label: 'Ask AI',    icon: <Bot size={18} /> },
  ]

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon" style={{ background: 'var(--black)', borderRadius: '6px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--white)', fontWeight: 800, fontSize: '1rem' }}>기</span>
          </div>
          <div className="logo-text">
            <h1>GIWA</h1>
            <span className="logo-badge">Sepolia</span>
          </div>
        </div>

        {account && (
          <nav className="nav-tabs desktop">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setCurrentPage(tab.id); setIsMobileMenuOpen(false) }}
                className={`nav-tab ${currentPage === tab.id ? 'active' : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        <div className="wallet-section">
          {account && (
            <div className="wallet-info">
              <span className="address-short">{shortAddress(account.address)}</span>
              <button onClick={onDisconnect} className="btn-small">Disconnect</button>
            </div>
          )}
          {account && (
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {isMobileMenuOpen && account && (
        <nav className="nav-tabs mobile">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setCurrentPage(tab.id); setIsMobileMenuOpen(false) }}
              className={`nav-tab ${currentPage === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}

export default Header
