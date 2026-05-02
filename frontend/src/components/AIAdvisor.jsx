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
      const rainfall = parseInt(oracleData.rainfallMm);
      const flood = parseFloat(oracleData.floodLevelCm);

      let riskLevel, coverage, reason; 

      if (season === 'Monsoon' && rainfall <40){
        riskLevel = 'High';
        coverage = 2.0;
        reason = 'Low rainfall in monsoon season means high drought risk.';
      } else if (flood > 100 || (season === 'Monsoon' && rainfall >180)){
        riskLevel = 'High';
        coverage = 2.0;
        reason = 'High flood levels detected in your region.';
      } else if (rainfall <80) {
        riskLevel = 'Medium';
        coverage = 1.0;
        reason = 'Moderate dought risk based on current rainfall.';
      } else if (season == 'Winter') {
        riskLevel = 'Low';
        coverage = 0.5;
        reason = 'Winter is dry season in Nepal. Low insurance risk.';
      } else if (season === 'Spring' && rainfall <50){
        riskLevel = 'Medium';
        coverage = 1.0;
        reason = 'Spring rainfall is low. Moderate drought risk ahead.';
      } else {
        riskLevel = 'Low';
        coverage = 0.5;
        reason = 'Conditions looks stable but insurance is still recomended.';
      }

      setResult({ riskLevel, coverage, reason, rainfall, flood});

    } catch (err) {
      setResult({ error: err.message});
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
    {result && (
      <p style={{color: 'red'}}>{result.error}</p>
    )}

    {result?.riskLevel && (
      <div className="cryo-card" style={{marginTop: '1rem'}}>
        <h3>Risk Level: {result.riskLevel === 'High' ? '🔴' : result.riskLevel === 'Medium' ? '🟡' : '🟢'} {result.riskLevel}</h3>
        <p> {result.reason}</p>
        <p> Current Rainfall: <strong>{result.rainfall} mm </strong></p>
        <p> Recommended Coverage: <strong>{result.coverage} SOL</strong></p>
        <button className='cryo-btn' onClick={() =>{
          setForm(f => ({ ...f, coverageAmount: result.coverage, regionId: region}));
          window.scrollTo({ top : 0, behavior: 'smooth'});
        }}>
          Register This Policy
        </button>
        </div>
    )}
    </div>
  );
};

export default AIAdvisor;