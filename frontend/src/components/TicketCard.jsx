import React from 'react';

export default function TicketCard({ ticket, onListForResale }) {
  const statusColors = {
    ACTIVE: { bg: 'rgba(165,247,106,0.2)', text: '#16a34a', border: 'rgba(165,247,106,0.6)' },
    USED:   { bg: 'rgba(120,113,108,0.1)', text: '#78716c', border: 'rgba(120,113,108,0.3)' },
    LISTED: { bg: 'rgba(251,191,36,0.15)', text: '#b45309', border: 'rgba(251,191,36,0.4)' },
  };
  const sc = statusColors[ticket.status] || statusColors.ACTIVE;

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(6,173,202,0.25)' }}>

      {/* Dark header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)',
        padding: '22px 24px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative frost ring */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(6,182,212,0.08)',
          border: '1px solid rgba(6,182,212,0.12)',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <div className="label-mono" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
              {ticket.category?.toUpperCase()}
            </div>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '17px', fontWeight: 300, color: 'white', letterSpacing: '-0.01em',
            }}>
              {ticket.eventName}
            </div>
            <div className="label-mono" style={{ color: 'rgba(255,255,255,0.3)', marginTop: '5px', fontSize: '8px' }}>
              {ticket.date} · {ticket.time}
            </div>
          </div>
          <div style={{
            background: sc.bg, color: sc.text,
            border: `1px solid ${sc.border}`,
            fontFamily: "'Outfit', sans-serif",
            fontSize: '8px', fontWeight: 600,
            letterSpacing: '0.7em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: '20px',
          }}>
            {ticket.status}
          </div>
        </div>

        {/* Ticket tear line */}
        <div style={{ position: 'relative', margin: '18px -24px', height: '1px' }}>
          <div style={{ height: '1px', background: 'rgba(6,182,212,0.15)', margin: '0 12px' }} />
          <div style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#F0F9FF',
          }} />
          <div style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#F0F9FF',
          }} />
        </div>

        {/* Mint info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
          <div>
            <div className="label-mono" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px' }}>Mint Address</div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px', color: '#06B6D4', marginTop: '3px', letterSpacing: '0.02em',
            }}>
              {ticket.mintAddress}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="label-mono" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px' }}>Paid</div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '18px', fontWeight: 600, color: 'white', letterSpacing: '-0.02em',
            }}>
              {ticket.pricePaid} SOL
            </div>
          </div>
        </div>
      </div>

      {/* Light footer */}
      <div style={{
        background: 'rgba(240,249,255,0.9)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(6,173,202,0.15)',
      }}>
        <div className="label-mono">1 Person · Standard</div>

        {ticket.status === 'ACTIVE' && (
          <button
            onClick={() => onListForResale(ticket)}
            className="btn-ghost"
            style={{ fontSize: '8px', padding: '8px 16px', letterSpacing: '0.4em' }}
          >
            List for Resale
          </button>
        )}
        {ticket.status === 'LISTED' && (
          <span className="label-mono" style={{ color: '#b45309' }}>
            Listed @ {ticket.askingPrice} SOL
          </span>
        )}
        {ticket.status === 'USED' && (
          <span className="label-mono" style={{ color: '#78716c' }}>Redeemed</span>
        )}
      </div>
    </div>
  );
}