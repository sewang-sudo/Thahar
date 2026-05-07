import React, { useEffect, useState } from 'react';
import { fetchOracleData } from '../utils/thahar';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';

const REGIONS = ['kathmandu', 'khotang', 'chitwan'];

const REGION_META = {
  kathmandu: { threshold: 40 },
  khotang:   { threshold: 35 },
  chitwan:   { threshold: 38 },
};

const MOCK_HISTORY = {
  kathmandu: [
    {day: 'Sun', mm:38}, {day: 'Mon', mm:52}, {day: 'Tue', mm:44}, {day: 'Wed', mm:39},
    {day: 'Thu', mm:35}, {day: 'Fri', mm:41}, {day: 'Sat', mm:38}
  ],
  khotang: [
    {day: 'Sun', mm:22}, {day: 'Mon', mm:30}, {day: 'Tue', mm:25}, {day: 'Wed', mm:18},
    {day: 'Thu', mm:15}, {day: 'Fri', mm:20}, {day: 'Sat', mm:22}
  ],
  chitwan: [
    {day: 'Sun', mm:55}, {day: 'Mon', mm:60}, {day: 'Tue', mm:58}, {day: 'Wed', mm:55},
    {day: 'Thu', mm:62}, {day: 'Fri', mm:57}, {day: 'Sat', mm:55}
  ],
};

const CustomTooltip = ({ active, payload, label, threshold }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const below = val < threshold;
    return (
      <div style={{ background: '#fff', border: '1.5px solid #e8e8e6', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: '#1c1c1c' }}>{label}</div>
        <div style={{ color: below ? '#dc2626' : '#3b6d11', fontWeight: 700 }}>
          {val} mm {below ? '⚠ Below threshold' : '✓ Above threshold'}
        </div>
      </div>
    );
  }
  return null;
};

export default function Oracle() {
  const [oracles, setOracles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(REGIONS.map(r => fetchOracleData(r).catch(() => null)))
      .then(results => {
        setOracles(results.map((data, i) => ({ region: REGIONS[i], data })));
      })
      .finally(() => setLoading(false));
  }, []);

  const isStale = (timestamp) => {
    if (!timestamp) return true;
    const age = Date.now() / 1000 - timestamp;
    return age > 86400;
  };

  return (
    <div className="page-container">
      <h2 className="section-title">Oracle Data</h2>
      <p className="section-sub">
        Live rainfall and flood readings pushed on-chain by authorized oracle wallets.
        Data older than 24h is considered stale and cannot trigger payouts.
      </p>

      {loading && <div className="loading-state">Fetching oracle data...</div>}

      <div className="cryo-grid">
        {oracles.map(({ region, data }) => (
          <div className="cryo-card oracle-card-page" key={region}>
            <div className="oracle-header">
              <span className="oracle-region-lbl">📍 {region.charAt(0).toUpperCase() + region.slice(1)}</span>
              {data ? (
                <span className={`status-badge ${isStale(data.timestamp) ? 'stale' : 'fresh'}`}>
                  {isStale(data.timestamp) ? '⚠ Stale' : '✅ Fresh'}
                </span>
              ) : (
                <span className="status-badge stale">No Data</span>
              )}
            </div>

            {data ? (
              <div>
                <div className="oracle-readings">
                  <div className="oracle-reading">
                    <span className="reading-label">Rainfall</span>
                    <span className="reading-value rain">{data.rainfallMm?.toString()} mm</span>
                  </div>
                  <div className="oracle-reading">
                    <span className="reading-label">Flood Level</span>
                    <span className="reading-value flood">{data.floodLevel?.toString()} cm</span>
                  </div>
                  <div className="oracle-reading">
                    <span className="reading-label">Last Update</span>
                    <span className="reading-value time">
                      {data.timestamp
                        ? new Date(data.timestamp * 1000).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                    7-Day Rainfall
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={MOCK_HISTORY[region]} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<CustomTooltip threshold={REGION_META[region].threshold} />} />
                      <ReferenceLine y={REGION_META[region].threshold} stroke="#dc2626" strokeDasharray="4 3" label={{ value: 'Trigger', fontSize: 9, fill: '#dc2626' }} />
                      <Bar dataKey="mm" fill="var(--green-mid)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                    7-Day Rainfall
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={MOCK_HISTORY[region]} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<CustomTooltip threshold={REGION_META[region].threshold} />} />
                      <ReferenceLine y={REGION_META[region].threshold} stroke="#dc2626" strokeDasharray="4 3" label={{ value: 'Trigger', fontSize: 9, fill: '#dc2626' }} />
                      <Bar dataKey="mm" fill="var(--green-mid)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="oracle-empty" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
                  No live oracle data pushed for this region yet.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="cryo-card info-card">
        <h3>How the Oracle Works</h3>
        <p>
          An authorized wallet calls the <code>update_oracle</code> instruction on-chain,
          pushing rainfall (mm) and flood level (cm) for a specific region.
          The <code>trigger_payout</code> instruction verifies this data is under 24 hours old
          before releasing funds. No external API is trusted — everything lives on-chain.
        </p>
      </div>
    </div>
  );
}