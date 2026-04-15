import React from 'react';

export default function BookingCard({ activity, onBook }) {
  return (
    <div className="cryo-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

      {/* Category + Name */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="label-mono" style={{ marginBottom: '8px' }}>{activity.category}</div>
          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '20px', fontWeight: 300,
            color: '#0c0a09', letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            {activity.name}
          </div>
        </div>
        <div className="telemetry-box" style={{ textAlign: 'right', padding: '12px 16px' }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '18px', fontWeight: 600, color: '#0c0a09',
          }}>
            {activity.price} SOL
          </div>
          <div className="label-mono" style={{ marginTop: '2px', fontSize: '8px' }}>Per Person</div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px', fontWeight: 300,
        color: '#44403c', lineHeight: 1.75,
      }}>
        {activity.description}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {activity.tags.map(t => (
          <span key={t} style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '8px', fontWeight: 500,
            letterSpacing: '0.7em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: '20px',
            border: '1px solid rgba(6,173,202,0.3)',
            color: '#06ADCA', background: 'rgba(6,182,212,0.06)',
          }}>{t}</span>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: '16px', borderTop: '1px solid rgba(6,173,202,0.15)',
      }}>
        <div className="label-mono">
          {activity.spotsLeft} spots · {activity.duration}
        </div>
        <button className="btn-calibrate" onClick={() => onBook(activity)}
          style={{ fontSize: '9px', padding: '10px 22px', letterSpacing: '0.5em' }}>
          Book → Mint NFT
        </button>
      </div>
    </div>
  );
}