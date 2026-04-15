import React, { useState, useEffect } from 'react';
import { getResaleListings } from '../utils/api';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Marketplace({ onBuy }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('listed');

  useEffect(() => {
    getResaleListings()
      .then(data => {
        const normalized = data.map(l => ({
          id: l.id,
          eventName: l.booking_title || 'NFT Ticket',
          seller: l.seller_wallet ? `${l.seller_wallet.slice(0,4)}···${l.seller_wallet.slice(-4)}` : '—',
          originalPrice: l.original_price_sol || 0,
          askingPrice: l.asking_price_sol,
          listedAgo: timeAgo(l.listed_at),
          seatInfo: `BOOKING #${l.booking_id?.slice(0,6).toUpperCase()}`,
          date: l.listed_at ? new Date(l.listed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : '—',
          raw: l,
        }));
        setListings(normalized);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...listings].sort((a, b) => {
    if (sortBy === 'price-asc') return a.askingPrice - b.askingPrice;
    if (sortBy === 'price-desc') return b.askingPrice - a.askingPrice;
    return 0;
  });

  const priceChange = (original, asking) => {
    if (!original) return { pct: '—', up: true };
    const pct = ((asking - original) / original * 100).toFixed(1);
    return { pct, up: asking >= original };
  };

  return (
    <div className="page-wrap">
      <div className="page-inner">

        {/* Hero */}
        <div style={{ marginBottom: '48px' }}>
          <div className="label-mono" style={{ marginBottom: '14px' }}>— P2P Resale Market</div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 200,
            color: '#0c0a09', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px',
          }}>
            Trade <strong style={{ fontWeight: 700 }}>tickets</strong><br />peer-to-peer.
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px', fontWeight: 300, color: '#44403c',
            lineHeight: 1.75, maxWidth: '440px',
          }}>
            All transactions execute on Solana. NFT transfers atomically with payment — no escrow risk, no middleman.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' }}>
          {[
            { label: 'Active Listings', value: listings.length },
            { label: 'Platform Fee', value: '0%' },
            { label: 'Settlement', value: '~0.5s' },
            { label: 'Escrow', value: 'On-chain' },
          ].map(s => (
            <div key={s.label} className="telemetry-box" style={{ minWidth: '110px' }}>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '22px', fontWeight: 600, color: '#0c0a09', letterSpacing: '-0.02em',
              }}>{s.value}</div>
              <div className="label-mono" style={{ marginTop: '3px', fontSize: '8px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Sort bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '16px', paddingBottom: '16px',
          borderBottom: '1px solid rgba(6,173,202,0.15)',
        }}>
          <div className="label-mono">{sorted.length} listings</div>
          <select className="cryo-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="listed">Recently Listed</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>

        {loading && <div className="label-mono" style={{ textAlign: 'center', padding: '80px 0' }}>Loading marketplace...</div>}
        {error && <div className="label-mono" style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626' }}>✕ {error}</div>}

        {/* Table */}
        {!loading && !error && (
          <div style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(6,173,202,0.2)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 130px 100px 110px',
              padding: '12px 24px',
              borderBottom: '1px solid rgba(6,173,202,0.12)',
              background: 'rgba(6,173,202,0.04)',
            }}>
              {['Event', 'Listed', 'Floor Δ', ''].map(h => (
                <div key={h} className="label-mono" style={{ textAlign: h === '' ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {sorted.length === 0 && (
              <div className="label-mono" style={{ padding: '60px', textAlign: 'center' }}>
                No listings yet — be the first to list a ticket.
              </div>
            )}

            {sorted.map(listing => {
              const { pct, up } = priceChange(listing.originalPrice, listing.askingPrice);
              return (
                <div
                  key={listing.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 130px 100px 110px',
                    padding: '18px 24px',
                    borderBottom: '1px solid rgba(6,173,202,0.08)',
                    alignItems: 'center',
                  }}
                >
                  {/* Event info */}
                  <div>
                    <div style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '14px', fontWeight: 400, color: '#0c0a09', marginBottom: '4px',
                    }}>
                      {listing.eventName}
                    </div>
                    <div className="label-mono" style={{ fontSize: '8px' }}>
                      {listing.seatInfo} · {listing.date} · {listing.listedAgo}
                    </div>
                  </div>

                  {/* Price + seller */}
                  <div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '15px', fontWeight: 600, color: '#0c0a09', letterSpacing: '-0.01em',
                    }}>
                      {listing.askingPrice} SOL
                    </div>
                    <div className="label-mono" style={{ fontSize: '8px', marginTop: '2px' }}>
                      {listing.seller}
                    </div>
                  </div>

                  {/* Price delta */}
                  <div style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '11px', fontWeight: 600,
                    color: up ? '#16a34a' : '#dc2626', letterSpacing: '0.04em',
                  }}>
                    {pct === '—' ? '—' : `${up ? '+' : ''}${pct}%`}
                  </div>

                  {/* Buy button */}
                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onBuy(listing.raw)}
                      className="btn-calibrate"
                      style={{ fontSize: '8px', padding: '9px 18px', letterSpacing: '0.4em' }}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: '60px' }} />
      </div>
    </div>
  );
}