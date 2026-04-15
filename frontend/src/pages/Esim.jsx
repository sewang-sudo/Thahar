import React, { useState, useEffect } from 'react';
import { getAvailableEsims, getMyRentals, rentEsim, isLoggedIn } from '../utils/api';

export default function Esim({ walletAddress, onConnectWallet }) {
  const [esims, setEsims] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('BROWSE');
  const [renting, setRenting] = useState(null);
  const [rentDays, setRentDays] = useState(7);
  const [rentWallet, setRentWallet] = useState(walletAddress || '');
  const [rentLoading, setRentLoading] = useState(false);
  const [rentError, setRentError] = useState(null);
  const [rentSuccess, setRentSuccess] = useState(null);

  useEffect(() => { fetchData(); }, []);

  function fetchData() {
    setLoading(true);
    const promises = [getAvailableEsims()];
    if (isLoggedIn()) promises.push(getMyRentals());
    Promise.all(promises)
      .then(([available, myRentals]) => {
        setEsims(available || []);
        setRentals(myRentals || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleRent(esim) {
    setRenting(esim);
    setRentError(null);
    setRentSuccess(null);
  }

  async function confirmRent() {
    if (!rentWallet) { setRentError('Wallet address required'); return; }
    setRentLoading(true); setRentError(null);
    try {
      await rentEsim(renting.id, rentDays, rentWallet);
      setRentSuccess(`eSIM rented for ${rentDays} days!`);
      setRenting(null);
      fetchData();
    } catch (e) {
      setRentError(e.message);
    } finally {
      setRentLoading(false);
    }
  }

  if (!isLoggedIn()) {
    return (
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px', padding: '0 24px' }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '48px', color: '#06B6D4', marginBottom: '24px' }}>◈</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '24px', fontWeight: 200, color: '#0c0a09', marginBottom: '10px', letterSpacing: '-0.02em' }}>
            Sign in to rent eSIMs
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 300, color: '#44403c', lineHeight: 1.7, marginBottom: '28px' }}>
            Log in to browse available eSIMs and manage your rentals.
          </p>
          <button className="btn-calibrate" onClick={onConnectWallet} style={{ letterSpacing: '0.5em' }}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-inner">

        {/* Hero */}
        <div style={{ marginBottom: '36px' }}>
          <div className="label-mono" style={{ marginBottom: '14px' }}>— Stay Connected</div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 200,
            color: '#0c0a09', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px',
          }}>
            <strong style={{ fontWeight: 700 }}>eSIM</strong> Rentals
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 300, color: '#44403c', lineHeight: 1.75 }}>
            Rent a local eSIM for your Nepal trip. Activate instantly, pay with SOL.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { label: 'Available', value: esims.length },
            { label: 'My Rentals', value: rentals.length },
          ].map(s => (
            <div key={s.label} className="telemetry-box" style={{ minWidth: '120px' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: 600, color: '#0c0a09', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div className="label-mono" style={{ marginTop: '3px', fontSize: '8px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '24px',
          paddingBottom: '16px', borderBottom: '1px solid rgba(6,173,202,0.15)',
        }}>
          {['BROWSE', 'MY RENTALS'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '8px', fontWeight: 600, letterSpacing: '0.7em', textTransform: 'uppercase',
              padding: '7px 16px', borderRadius: '20px', cursor: 'default',
              background: tab === t ? '#06ADCA' : 'transparent',
              color: tab === t ? 'white' : '#78716c',
              border: `1px solid ${tab === t ? '#06ADCA' : 'rgba(6,173,202,0.3)'}`,
              boxShadow: tab === t ? 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -4px 12px rgba(0,0,0,0.15)' : 'none',
            }}>{t}</button>
          ))}
        </div>

        {loading && <div className="label-mono" style={{ textAlign: 'center', padding: '60px 0' }}>Loading...</div>}
        {error && <div className="label-mono" style={{ textAlign: 'center', padding: '60px 0', color: '#dc2626' }}>✕ {error}</div>}

        {/* Success banner */}
        {rentSuccess && (
          <div style={{
            background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)',
            borderRadius: '12px', padding: '12px 18px', marginBottom: '16px',
          }}>
            <span className="label-mono" style={{ color: '#16a34a' }}>✓ {rentSuccess}</span>
          </div>
        )}

        {/* BROWSE tab */}
        {!loading && !error && tab === 'BROWSE' && (
          <>
            {esims.length === 0 && (
              <div className="label-mono" style={{ textAlign: 'center', padding: '60px 0' }}>No eSIMs available right now.</div>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px', paddingBottom: '60px',
            }}>
              {esims.map((esim, i) => (
                <div key={esim.id} className="cryo-card animate-in" style={{ animationDelay: `${i * 0.07}s` }}>

                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div className="label-mono" style={{ marginBottom: '5px' }}>{esim.provider}</div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 300, color: '#0c0a09', letterSpacing: '-0.01em' }}>
                        {esim.data_total_gb} GB Plan
                      </div>
                    </div>
                    <div className="telemetry-box" style={{ padding: '6px 12px' }}>
                      <div className="label-mono" style={{ fontSize: '8px', color: '#16a34a' }}>AVAILABLE</div>
                    </div>
                  </div>

                  {/* Data grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
                    {[
                      { label: 'Price/day', value: `${esim.price_sol_per_day} SOL` },
                      { label: 'Validity', value: `${esim.validity_days} days` },
                      { label: 'Deposit', value: `${esim.deposit_sol} SOL` },
                      { label: 'ICCID', value: `···${esim.iccid.slice(-6)}` },
                    ].map(item => (
                      <div key={item.label} style={{
                        background: 'rgba(6,173,202,0.05)', borderRadius: '10px', padding: '10px 12px',
                        border: '1px solid rgba(6,173,202,0.1)',
                      }}>
                        <div className="label-mono" style={{ fontSize: '7px', marginBottom: '3px' }}>{item.label}</div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#0c0a09' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <button className="btn-calibrate" onClick={() => handleRent(esim)}
                    style={{ width: '100%', fontSize: '9px', letterSpacing: '0.5em', textAlign: 'center' }}>
                    Rent eSIM
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MY RENTALS tab */}
        {!loading && !error && tab === 'MY RENTALS' && (
          <>
            {rentals.length === 0 && (
              <div className="label-mono" style={{ textAlign: 'center', padding: '60px 0' }}>No active rentals — rent an eSIM to get started.</div>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px', paddingBottom: '60px',
            }}>
              {rentals.map((rental, i) => (
                <div key={rental.id} className="cryo-card animate-in" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className="label-mono" style={{ marginBottom: '6px' }}>Active Rental</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 300, color: '#0c0a09', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                    {rental.rental_days} Day Plan
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { label: 'Total paid', value: `${rental.total_cost_sol} SOL` },
                      { label: 'Deposit', value: `${rental.deposit_sol} SOL` },
                      { label: 'Starts', value: new Date(rental.rental_start).toLocaleDateString() },
                      { label: 'Ends', value: new Date(rental.rental_end).toLocaleDateString() },
                    ].map(item => (
                      <div key={item.label} style={{
                        background: 'rgba(6,173,202,0.05)', borderRadius: '10px', padding: '10px 12px',
                        border: '1px solid rgba(6,173,202,0.1)',
                      }}>
                        <div className="label-mono" style={{ fontSize: '7px', marginBottom: '3px' }}>{item.label}</div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#0c0a09' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Rent Modal */}
      {renting && (
        <div
          onClick={() => setRenting(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(12,10,9,0.5)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: '#F0F9FF',
            border: '1px solid rgba(6,173,202,0.3)',
            borderRadius: '20px', padding: '36px',
            width: '100%', maxWidth: '400px',
          }}>
            <div className="label-mono" style={{ marginBottom: '6px' }}>Rent eSIM</div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: 200, color: '#0c0a09', marginBottom: '24px', letterSpacing: '-0.02em' }}>
              {renting.provider} — {renting.data_total_gb}GB
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div className="label-mono" style={{ marginBottom: '7px' }}>Rental Days</div>
              <input
                className="cryo-input"
                type="number" min="1" max={renting.validity_days}
                value={rentDays}
                onChange={e => setRentDays(Number(e.target.value))}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div className="label-mono" style={{ marginBottom: '7px' }}>Wallet Address</div>
              <input
                className="cryo-input"
                type="text"
                value={rentWallet}
                onChange={e => setRentWallet(e.target.value)}
                placeholder="Your Solana wallet address"
              />
            </div>

            {/* Cost summary */}
            <div style={{
              background: 'rgba(165,247,106,0.15)',
              border: '1px solid rgba(165,247,106,0.5)',
              borderRadius: '12px', padding: '14px 16px', marginBottom: '20px',
            }}>
              <div className="label-mono" style={{ marginBottom: '4px', fontSize: '7px' }}>Total Cost</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: '#0c0a09', letterSpacing: '-0.02em' }}>
                {(renting.price_sol_per_day * rentDays + renting.deposit_sol).toFixed(3)} SOL
              </div>
              <div className="label-mono" style={{ fontSize: '7px', marginTop: '3px' }}>
                {rentDays}d × {renting.price_sol_per_day} + {renting.deposit_sol} deposit
              </div>
            </div>

            {rentError && (
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#dc2626', marginBottom: '12px' }}>
                ✕ {rentError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-ghost" onClick={() => setRenting(null)}
                style={{ flex: 1, textAlign: 'center', letterSpacing: '0.4em', fontSize: '8px' }}>
                Cancel
              </button>
              <button className="btn-calibrate" onClick={confirmRent} disabled={rentLoading}
                style={{ flex: 2, textAlign: 'center', letterSpacing: '0.4em', fontSize: '8px' }}>
                {rentLoading ? 'Please wait...' : 'Confirm Rent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}