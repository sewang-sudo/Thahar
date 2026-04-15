import React, { useState } from 'react';
import { login, register } from '../utils/api';

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', account_type: 'tourist' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password, form.account_type);
      }
      onSuccess(); onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(12,10,9,0.5)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#F0F9FF',
          border: '1px solid rgba(6,173,202,0.3)',
          borderRadius: '20px',
          padding: '36px',
          width: '100%', maxWidth: '400px',
        }}
      >
        {/* Brand */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.7em', textTransform: 'uppercase',
          color: '#06ADCA', marginBottom: '24px', textAlign: 'center',
        }}>
          NORDIC · CRYO
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0', marginBottom: '24px',
          border: '1px solid rgba(6,173,202,0.3)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1,
              fontFamily: "'Outfit', sans-serif",
              fontSize: '9px', fontWeight: 600,
              letterSpacing: '0.7em', textTransform: 'uppercase',
              padding: '10px',
              background: mode === m ? '#06ADCA' : 'transparent',
              color: mode === m ? 'white' : '#78716c',
              border: 'none', cursor: 'default',
              boxShadow: mode === m
                ? 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -4px 12px rgba(0,0,0,0.15)'
                : 'none',
            }}>{m}</button>
          ))}
        </div>

        {mode === 'register' && (
          <>
            <input className="cryo-input" style={{ marginBottom: '10px' }}
              placeholder="Username" value={form.username}
              onChange={e => set('username', e.target.value)} />
            <select className="cryo-select" style={{ width: '100%', marginBottom: '10px' }}
              value={form.account_type} onChange={e => set('account_type', e.target.value)}>
              <option value="tourist">Tourist</option>
              <option value="business">Business</option>
            </select>
          </>
        )}

        <input className="cryo-input" style={{ marginBottom: '10px' }}
          placeholder="Email" type="email" value={form.email}
          onChange={e => set('email', e.target.value)} />
        <input className="cryo-input" style={{ marginBottom: '10px' }}
          placeholder="Password" type="password" value={form.password}
          onChange={e => set('password', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        {error && (
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px', color: '#dc2626',
            marginBottom: '12px', letterSpacing: '0.02em',
          }}>✕ {error}</div>
        )}

        <button className="btn-calibrate" onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginBottom: '8px', letterSpacing: '0.5em' }}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
        <button className="btn-ghost" onClick={onClose}
          style={{ width: '100%', textAlign: 'center', letterSpacing: '0.5em' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}