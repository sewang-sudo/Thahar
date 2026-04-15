const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ── Token helpers ──────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem('access_token');
export const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};
export const isLoggedIn = () => !!getToken();

// ── Base fetch ─────────────────────────────────────────────────────────────────

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearTokens();
    window.location.reload();
    return;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function register(username, email, password, account_type = 'tourist') {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, account_type }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function login(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Login failed');
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function logout() {
  const refresh_token = localStorage.getItem('refresh_token');
  if (refresh_token) {
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    }).catch(() => {});
  }
  clearTokens();
}

// ── Activities ─────────────────────────────────────────────────────────────────

export async function getActivities() {
  return request('/activities');
}

// ── Bookings ───────────────────────────────────────────────────────────────────

export async function bookTicket(activity_id, wallet_address) {
  return request('/book', {
    method: 'POST',
    body: JSON.stringify({ activity_id, wallet_address }),
  });
}

export async function getMyTickets() {
  return request('/my-tickets');
}

// ── Resale ─────────────────────────────────────────────────────────────────────

export async function getResaleListings() {
  return request('/resale');
}

export async function listForResale(booking_id, asking_price_sol) {
  return request('/resale/list', {
    method: 'POST',
    body: JSON.stringify({ booking_id, asking_price_sol: parseFloat(asking_price_sol) }),
  });
}

export async function buyResaleTicket(listing_id, buyer_wallet) {
  return request('/resale/buy', {
    method: 'POST',
    body: JSON.stringify({ listing_id, buyer_wallet }),
  });
}

// ── eSIM ───────────────────────────────────────────────────────────────────────

export async function getAvailableEsims() {
  return request('/esim/available');
}

export async function rentEsim(esim_id, rental_days, wallet_address) {
  return request('/esim/rent', {
    method: 'POST',
    body: JSON.stringify({ esim_id, rental_days, wallet_address }),
  });
}

export async function getMyRentals() {
  return request('/esim/my-rentals');
}