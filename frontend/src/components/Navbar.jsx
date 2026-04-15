import React from 'react';

export default function Navbar({ activePage, onNavigate, walletAddress, onConnectWallet }) {
  const links = [
    { id: 'home', label: 'Events' },
    { id: 'my-tickets', label: 'My Tickets' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'esim', label: 'eSIM' },
  ];

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 4)}···${walletAddress.slice(-4)}`
    : null;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '60px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 36px',
      background: 'rgba(240, 249, 255, 0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(6, 173, 202, 0.2)',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: '14px', fontWeight: 700,
        letterSpacing: '0.7em', textTransform: 'uppercase',
        color: '#0c0a09',
      }}>
        NORDIC·CRYO
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {links.map(l => (
          <span
            key={l.id}
            onClick={() => onNavigate(l.id)}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '10px', fontWeight: 500,
              letterSpacing: '0.7em', textTransform: 'uppercase',
              cursor: 'default',
              color: activePage === l.id ? '#06ADCA' : '#78716c',
              borderBottom: activePage === l.id ? '1.5px solid #06ADCA' : '1.5px solid transparent',
              paddingBottom: '2px',
            }}
          >{l.label}</span>
        ))}
      </div>

      {/* Wallet button */}
      <button
        onClick={onConnectWallet}
        className="btn-calibrate"
        style={{ fontSize: '9px', padding: '9px 20px', letterSpacing: '0.5em' }}
      >
        {walletAddress ? `● ${shortAddr}` : 'Connect Wallet'}
      </button>
    </nav>
  );
}