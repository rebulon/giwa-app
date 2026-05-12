import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Copy, CheckCircle, ExternalLink } from 'lucide-react'
import { shortAddress } from '../lib/tempo'

export default function AI({ account }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your GIWA dev assistant. Ask me anything about building on GIWA — smart contracts, ERC-20, DEX, deployment, or the GASOK program.' }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const history = [...messages, { role: 'user', content: text }]
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a helpful developer assistant for the GIWA blockchain ecosystem.
GIWA is an EVM-compatible Layer 2 (OP Stack) blockchain built by Dunamu (creators of Upbit exchange in South Korea).

Key facts:
- Chain ID: 91342
- Network: GIWA Sepolia (testnet)
- RPC: https://sepolia-rpc.giwa.io
- Explorer: https://sepolia-explorer.giwa.io
- Faucet: https://faucet.giwa.io
- Nativecurrency: ETH
- Stack: OP Stack (Optimism-based L2), fully EVM compatible
- GASOK: 5-month accelerator program by GIWA, up to $100k funding, deadline May 31 2026

Deployed contracts on GIWA Sepolia:
- gUSD (ERC-20): 0xaabfb20E8D2DB76f64DA757e2031E269c4Cd8b4F
- gKRW (ERC-20): 0x37fD05CeaC653c1775f1DDd682E371e7A1FBf410
- gEUR (ERC-20): 0x0eed1f26c0CDf4eF5d0fee3a2a576b9E2AE0caCB
- GiwaTokenFactory: 0x63AFE706549242C8839a16da3368FB26e44f3f21
- GiwaSwapRouter (AMM DEX): 0xFFa4E478219A32343081Bfcf65dE26B2c18e14A8

Answer concisely and practically. For code examples use Solidity or JavaScript/ethers.js/viem.`,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'No response'
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Error: ' + e.message }])
    } finally { setLoading(false) }
  }

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000)
  }

  const quickLinks = [
    { label: 'GIWA Docs',    url: 'https://docs.giwa.io' },
    { label: 'GASOK Program', url: 'https://giwa.io/gasok' },
    { label: 'Explorer',     url: 'https://sepolia-explorer.giwa.io' },
  ]

  const quickPrompts = [
    'How do I deploy a contract on GIWA?',
    'What is the GASOK program?',
    'How to add liquidity to the DEX?',
    'How to create a new token?',
  ]

  return (
    <div className="panel">
      <h2 style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <Bot size={24} /> GIWA AI Assistant
      </h2>
      <div className="subtitle" style={{ marginBottom:'1.5rem' }}>
        <span className="address-short">{shortAddress(account?.address)}</span>
      </div>

      {/* Quick links */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        {quickLinks.map((l,i) => (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:4, padding:'0.375rem 0.75rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'0.75rem', color:'var(--black)', textDecoration:'none' }}>
            {l.label} <ExternalLink size={11} />
          </a>
        ))}
      </div>

      {/* Quick prompts */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {quickPrompts.map((p,i) => (
          <button key={i} onClick={() => { setInput(p) }} style={{ padding:'0.375rem 0.75rem', background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'0.75rem', cursor:'pointer', color:'var(--gray-700)' }}>
            {p}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="card" style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column', height:420 }}>
        <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth:'80%', padding:'0.75rem 1rem',
                background: m.role==='user' ? 'var(--black)' : 'var(--gray-50)',
                color:      m.role==='user' ? 'var(--white)' : 'var(--black)',
                border: m.role==='user' ? 'none' : '1px solid var(--border)',
                borderRadius: m.role==='user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                fontSize:'0.875rem', lineHeight:'1.5',
                whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:'flex', justifyContent:'flex-start' }}>
              <div style={{ padding:'0.75rem 1rem', background:'var(--gray-50)', border:'1px solid var(--border)', borderRadius:'12px 12px 12px 2px', fontSize:'0.875rem', color:'var(--gray-500)' }}>
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop:'1px solid var(--border)', padding:'0.75rem', display:'flex', gap:'0.5rem' }}>
          <input
            type="text" placeholder="Ask about GIWA..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && handleSend()}
            style={{ flex:1, height:40 }}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary" style={{ width:44, height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
