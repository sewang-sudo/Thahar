import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import Marketplace from './pages/Marketplace';
import Esim from './pages/Esim';
import { isLoggedIn, logout, buyResaleTicket, bookTicket } from './utils/api';
import './styles/theme.css';

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(6,182,212,0.08)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#F0F9FF',
        border: '0.5px solid rgba(6,182,212,0.25)',
        borderRadius: '24px', padding: '36px',
        width: '100%', maxWidth: '420px',
      }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif", fontSize: '9px', fontWeight: 400,
          letterSpacing: '0.7em', textTransform: 'uppercase',
          color: '#06B6D4', marginBottom: '20px',
        }}>Nordic Cryo · {title}</div>
        {children}
        <button onClick={onClose} style={{
          marginTop: '10px', width: '100%',
          fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 400,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          padding: '12px', borderRadius: '14px',
          background: 'transparent', color: '#44403c',
          border: '0.5px solid rgba(6,182,212,0.25)', cursor: 'default',
        }}>Cancel</button>
      </div>
    </div>
  );
}

const btnPrimary = {
  width: '100%', fontFamily: "'Outfit', sans-serif",
  fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em',
  textTransform: 'uppercase', padding: '13px', borderRadius: '14px',
  background: '#06ADCA', color: '#F0F9FF', border: 'none', cursor: 'default',
  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -4px 12px rgba(0,0,0,0.15)',
};

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [showAuth, setShowAuth] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Book modal state
  const [bookingActivity, setBookingActivity] = useState(null);
  const [bookWallet, setBookWallet] = useState('');
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState(null);

  // Buy resale modal state
  const [buyListing, setBuyListing] = useState(null);
  const [buyWallet, setBuyWallet] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState(null);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }

  function handleNavigate(id) {
    setPage(id);
  }

  function handleAuthSuccess() {
    setLoggedIn(true);
    setShowAuth(false);
    showToast('Signed in successfully');
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setPage('home');
    showToast('Signed out');
  }

  // Home → book a ticket
  function handleBook(activity) {
    if (!loggedIn) { setShowAuth(true); return; }
    setBookingActivity(activity);
    setBookWallet(walletAddress || '');
    setBookError(null);
  }

  async function confirmBook() {
    if (!bookWallet) { setBookError('Wallet address required'); return; }
    setBookLoading(true); setBookError(null);
    try {
      await bookTicket(bookingActivity.id, bookWallet);
      setBookingActivity(null);
      showToast('Ticket booked! NFT minted to your wallet.');
    } catch (e) {
      setBookError(e.message);
    } finally {
      setBookLoading(false);
    }
  }

  // Marketplace → buy resale ticket
  function handleBuy(listing) {
    if (!loggedIn) { setShowAuth(true); return; }
    setBuyListing(listing);
    setBuyWallet(walletAddress || '');
    setBuyError(null);
  }

  async function confirmBuy() {
    if (!buyWallet) { setBuyError('Wallet address required'); return; }
    setBuyLoading(true); setBuyError(null);
    try {
      await buyResaleTicket(buyListing.id, buyWallet);
      setBuyListing(null);
      showToast('Ticket purchased!');
    } catch (e) {
      setBuyError(e.message);
    } finally {
      setBuyLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F9FF' }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '64px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, background: '#A5F76A',
          border: '1px solid rgba(255,255,255,0.4)', borderRadius: '14px',
          padding: '10px 24px',
          fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 400,
          letterSpacing: '0.7em', textTransform: 'uppercase', color: '#0c0a09',
          whiteSpace: 'nowrap',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Navbar — uses activePage + onNavigate */}
      <Navbar
        activePage={page}
        onNavigate={handleNavigate}
        walletAddress={walletAddress}
        onConnectWallet={() => setShowAuth(true)}
      />

      {/* Pages */}
      {page === 'home' && (
        <Home onBook={handleBook} />
      )}
      {page === 'my-tickets' && (
        <MyTickets
          loggedIn={loggedIn}
          onConnectWallet={() => setShowAuth(true)}
          onToast={showToast}
        />
      )}
      {page === 'marketplace' && (
        <Marketplace onBuy={handleBuy} />
      )}
      {page === 'esim' && (
        <Esim
          walletAddress={walletAddress}
          onConnectWallet={() => setShowAuth(true)}
        />
      )}

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* Book Modal */}
      {bookingActivity && (
        <Modal title="Book Ticket" onClose={() => setBookingActivity(null)}>
          <div style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 200,
            color: '#0c0a09', marginBottom: '20px', letterSpacing: '-0.01em',
          }}>
            {bookingActivity.name} — {bookingActivity.price} SOL
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif", fontSize: '9px',
              letterSpacing: '0.5em', textTransform: 'uppercase',
              color: '#78716c', marginBottom: '7px',
            }}>Your Wallet Address</div>
            <input
              className="cryo-input"
              type="text"
              value={bookWallet}
              onChange={e => setBookWallet(e.target.value)}
              placeholder="Your Solana wallet address"
            />
          </div>
          {bookError && (
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#dc2626', marginBottom: '12px' }}>
              ✕ {bookError}
            </div>
          )}
          <button style={btnPrimary} onClick={confirmBook} disabled={bookLoading}>
            {bookLoading ? 'Please wait...' : `Confirm Booking · ${bookingActivity.price} SOL`}
          </button>
        </Modal>
      )}

      {/* Buy Resale Modal */}
      {buyListing && (
        <Modal title="Buy Ticket" onClose={() => setBuyListing(null)}>
          <div style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 200,
            color: '#0c0a09', marginBottom: '20px', letterSpacing: '-0.01em',
          }}>
            {buyListing.booking_title || 'NFT Ticket'} — {buyListing.asking_price_sol} SOL
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif", fontSize: '9px',
              letterSpacing: '0.5em', textTransform: 'uppercase',
              color: '#78716c', marginBottom: '7px',
            }}>Your Wallet Address</div>
            <input
              className="cryo-input"
              type="text"
              value={buyWallet}
              onChange={e => setBuyWallet(e.target.value)}
              placeholder="Your Solana wallet address"
            />
          </div>
          {buyError && (
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#dc2626', marginBottom: '12px' }}>
              ✕ {buyError}
            </div>
          )}
          <button style={btnPrimary} onClick={confirmBuy} disabled={buyLoading}>
            {buyLoading ? 'Please wait...' : `Confirm Purchase · ${buyListing.asking_price_sol} SOL`}
          </button>
        </Modal>
      )}

    </div>
  );
}