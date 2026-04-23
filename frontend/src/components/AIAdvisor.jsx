import { useState } from 'react';

const AIAdvisor = () => {
  const [crop, setCrop] = useState('');
  const [region, setRegion] = useState('');
  const [season, setSeason] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop, region, season }),
      });
      const data = await response.json();
      setResult(data.advice);
    } catch (err) {
      setResult('Error getting advice. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="ai-advisor">
      <h2>AI Crop Risk Advisor</h2>
      <select onChange={(e) => setCrop(e.target.value)} value={crop}>
        <option value="">Select Crop</option>
        <option value="rice">Rice</option>
        <option value="wheat">Wheat</option>
        <option value="maize">Maize</option>
      </select>
      <select onChange={(e) => setRegion(e.target.value)} value={region}>
        <option value="">Select Region</option>
        <option value="Kathmandu">Kathmandu</option>
        <option value="Pokhara">Pokhara</option>
        <option value="Terai">Terai</option>
        <option value="Chitwan">Chitwan</option>
      </select>
      <select onChange={(e) => setSeason(e.target.value)} value={season}>
        <option value="">Select Season</option>
        <option value="monsoon">Monsoon</option>
        <option value="winter">Winter</option>
        <option value="spring">Spring</option>
      </select>
      <button onClick={getAdvice} disabled={loading}>
        {loading ? 'Analyzing...' : 'Get AI Advice'}
      </button>
      {result && <div className="advice-result">{result}</div>}
    </div>
  );
};

export default AIAdvisor;
