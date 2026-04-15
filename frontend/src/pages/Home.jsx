import React, { useState, useEffect } from 'react';
import BookingCard from '../components/BookingCard';
import { getActivities } from '../utils/api';

const FILTERS = ['All', 'Adventure', 'Trek', 'Water Sport', 'Extreme', 'Sightseeing'];

export default function Home({ onBook }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    getActivities()
      .then(data => setActivities(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const normalized = activities.map(a => ({
    id: a.id, name: a.title,
    category: a.description?.split(' ')[0] || 'Activity',
    description: a.description || '',
    price: a.price_sol,
    duration: a.event_date ? new Date(a.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    spotsLeft: a.seats_available,
    tags: [a.location], raw: a,
  }));

  const filtered = normalized
    .filter(a => activeFilter === 'All' || a.category === activeFilter)
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'spots') return a.spotsLeft - b.spotsLeft;
      return 0;
    });

  return (
    <div className="page-wrap">
      <div className="page-inner">

        {/* Hero */}
        <div style={{ marginBottom: '48px' }}>
          <div className="label-mono" style={{ marginBottom: '14px' }}>— Available Experiences</div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 200,
            color: '#0c0a09', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px',
          }}>
            Book once.<br /><strong style={{ fontWeight: 700 }}>Own forever.</strong>
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px', fontWeight: 300, color: '#44403c',
            lineHeight: 1.75, maxWidth: '440px',
          }}>
            Every booking mints an NFT to your Phantom wallet. Resell, transfer, or hold — your ticket, your chain.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' }}>
          {[
            { label: 'Live Events', value: activities.length },
            { label: 'Chain', value: 'Solana' },
            { label: 'Fee', value: '0%' },
          ].map(s => (
            <div key={s.label} className="telemetry-box" style={{ minWidth: '120px' }}>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '22px', fontWeight: 600, color: '#0c0a09', letterSpacing: '-0.02em',
              }}>{s.value}</div>
              <div className="label-mono" style={{ marginTop: '3px', fontSize: '8px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter + Sort */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
          marginBottom: '28px', paddingBottom: '20px',
          borderBottom: '1px solid rgba(6,173,202,0.15)',
        }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '8px', fontWeight: 600,
                letterSpacing: '0.7em', textTransform: 'uppercase',
                padding: '7px 16px', borderRadius: '20px', cursor: 'default',
                background: activeFilter === f ? '#06ADCA' : 'transparent',
                color: activeFilter === f ? 'white' : '#78716c',
                border: `1px solid ${activeFilter === f ? '#06ADCA' : 'rgba(6,173,202,0.3)'}`,
                boxShadow: activeFilter === f
                  ? 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -4px 12px rgba(0,0,0,0.15)'
                  : 'none',
              }}>{f}</button>
            ))}
          </div>
          <select className="cryo-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="spots">Spots: Fewest First</option>
          </select>
        </div>

        {loading && <div className="label-mono" style={{ textAlign: 'center', padding: '80px 0' }}>Loading activities...</div>}
        {error && <div className="label-mono" style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626' }}>✕ {error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="label-mono" style={{ textAlign: 'center', padding: '80px 0' }}>No activities found.</div>
        )}

        {!loading && !error && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px', paddingBottom: '60px',
          }}>
            {filtered.map((activity, i) => (
              <div key={activity.id} className="animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <BookingCard activity={activity} onBook={onBook} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}