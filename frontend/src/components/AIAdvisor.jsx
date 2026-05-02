import { useState } from 'react';
import { fetchOracleData } from '../utils/thahar';

const CROPS = ['Rice', 'Maize', 'Wheat', 'Millet'];
const SEASONS = ['Monsoon', 'Winter', 'Spring'];
const REGIONS = ['kathmandu', 'khotang', 'chitwan'];

const AIAdvisor = ({ setForm }) => {
  const [region, setRegion] = useState('kathmandu');
  const [crop, setCrop] = useState('Rice');
  const [season, setSeason] = useState('Monsoon');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeRisk = async () => {
    setLoading(true);
    setResult(null);
    try {
      const oracleData = await fetchOracleData(region);
      console.log(oracleData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="ai-advisor">
      <h2>🌾 Crop Risk Advisor</h2>

  <select value={region} onChange={e => setRegion(e.target.value)} className="cryo-input">
  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
  </select>

  <select value={crop} onChange={e => setCrop(e.target.value)} className='cryo-input'>
    {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
    </select>

    <select value={season} onChange={e => setSeason(e.target.value)} className='cryo-input'>
      {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>

    <button onClick={analyzeRisk} disabled={loading} className='cryo-btn'>
      {loading ? '⏳ Analyzing...' : '🔍 Analyze My Risk'}
    </button>

    </div>
  );
};

export default AIAdvisor;