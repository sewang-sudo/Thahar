import React, { useState, useEffect } from 'react';
import TicketCard from '../components/TicketCard';
import { getMyTickets, isLoggedIn } from '../utils/api';

export default function MyTickets({ walletAddress, onConnectWallet, onListForResale }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    getMyTickets()
      .then(data => {
        const normalized = data.map(b => ({
          id: b.id, eventName: b.activity_title || 'NFT Ticket',
          category: 'Activity',
          date: b.booked_at ? new Date(b.booked_at).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : '—',
          time: 'UTC+5:45',
          mintAddress: b.nft_mint_address ? `${b.nft_mint_address.slice(0, 6)}...${b.nft_mint_address.slice(-4)}` : '—',
          fullMint: b.nft_mint_address,
          pricePaid: b.price_paid_sol,
          status: b.resale_listed ? 'LISTED' : 'ACTIVE',
          bookingId: b.id, raw: b,
        }));
        setTickets(normalized);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t => filter === 'ALL' || t.status === filter);
  const counts = {
    ALL: tickets.length,
    ACTIVE: tickets.filter(t => t.status === 'ACTIVE').length,
    LISTED: tickets.filter(t => t.status === 'LISTED').length,
  };

  if (!isLoggedIn()) {
    return (
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px', padding: '0 24px' }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '48px', color: '#06B6D4', marginBottom: '24px' }}>◈</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 200, color: '#0c0a09', marginBottom: '10px', letterSpacing: '-0.02em' }}>
            Sign in to view tickets
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 300, color: '#44403c', lineHeight: 1.7, marginBottom: '28px' }}>
            Log in to see your NFT tickets and manage your collection.
          </p>
          <button className="btn-calibrate" onClick={onConnectWallet} style={{ letterSpacing: '0.5em' }}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-inner" style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div className="label-mono" style={{ marginBottom: '10px' }}>— My Collection</div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '40px', fontWeight: 200, color: '#0c0a09', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            <strong style={{ fontWeight: 700 }}>NFT</strong> Tickets
          </h1>
          {walletAddress && (
            <div className="label-mono" style={{ fontSize: '9px' }}>
              {walletAddress.slice(0, 8)}···{walletAddress.slice(-8)}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: counts.ALL, color: '#0c0a09' },
            { label: 'Active', value: counts.ACTIVE, color: '#16a34a' },
            { label: 'Listed', value: counts.LISTED, color: '#b45309' },
          ].map(s => (
            <div key={s.label} className="telemetry-box" style={{ minWidth: '100px' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: 600, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div className="label-mono" style={{ marginTop: '3px', fontSize: '8px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(6,173,202,0.15)' }}>
          {['ALL', 'ACTIVE', 'LISTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '8px', fontWeight: 600, letterSpacing: '0.7em', textTransform: 'uppercase',
              padding: '7px 16px', borderRadius: '20px', cursor: 'default',
              background: filter === f ? '#06ADCA' : 'transparent',
              color: filter === f ? 'white' : '#78716c',
              border: `1px solid ${filter === f ? '#06ADCA' : 'rgba(6,173,202,0.3)'}`,
              boxShadow: filter === f ? 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -4px 12px rgba(0,0,0,0.15)' : 'none',
            }}>{f} ({counts[f]})</button>
          ))}
        </div>

        {loading && <div className="label-mono" style={{ textAlign: 'center', padding: '60px 0' }}>Loading tickets...</div>}
        {error && <div className="label-mono" style={{ textAlign: 'center', padding: '60px 0', color: '#dc2626' }}>✕ {error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="label-mono" style={{ textAlign: 'center', padding: '60px 0' }}>No tickets yet — book an activity to mint your first NFT.</div>
        )}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', paddingBottom: '60px' }}>
            {filtered.map((ticket, i) => (
              <div key={ticket.id} className="animate-in" style={{ animationDelay: `${i * 0.07}s` }}>
                <TicketCard ticket={ticket} onListForResale={onListForResale} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}