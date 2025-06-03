import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

type PortfolioItem = { ticker: string; weight: number };
type PerformanceEntry = { date: string; value: number };

export default function Home() {
  const [risk, setRisk] = useState<'low' | 'mid' | 'high'>('mid');
  const [horizon, setHorizon] = useState<'short' | 'mid' | 'long'>('mid');
  const [years, setYears] = useState<number>(5);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [performance, setPerformance] = useState<PerformanceEntry[]>([]);
  const [gain, setGain] = useState<number>(0);

  const riskLabels: Array<'low' | 'mid' | 'high'> = ['low', 'mid', 'high'];
  const horizonLabels: Array<'short' | 'mid' | 'long'> = ['short', 'mid', 'long'];
  const yearOptions = [1, 3, 5];

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(
        `/api/portfolio?risk=${risk}&horizon=${horizon}&years=${years}`
      );
      const data = await res.json();
      setPortfolio(data.portfolio);
      setPerformance(data.performance);
      setGain(data.gain);
    }
    fetchData();
  }, [risk, horizon, years]);

  const gainColor = gain >= 0 ? 'var(--color-gain)' : 'var(--color-loss)';

  return (
    <>
      <Head>
        <title>Pennywise Investment Portfolio</title>
      </Head>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <h1>Pennywise Investment Portfolio Recommendation</h1>
        <section>
          <label>Risk Preference: {risk}</label>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={riskLabels.indexOf(risk)}
            onChange={e => setRisk(riskLabels[+e.target.value])}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {riskLabels.map(label => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </section>
        <section>
          <label>Investment Horizon: {horizon}</label>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={horizonLabels.indexOf(horizon)}
            onChange={e => setHorizon(horizonLabels[+e.target.value])}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {horizonLabels.map(label => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </section>
        <section>
          <h2>
            Performance ({years} year{years > 1 ? 's' : ''}) –{' '}
            <span style={{ color: gainColor }}>{gain.toFixed(2)}%</span>
          </h2>
          <div style={{ marginBottom: '1rem' }}>
            {yearOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setYears(opt)}
                style={{
                  marginRight: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor:
                    years === opt ? 'var(--color-primary)' : 'transparent',
                  color: years === opt ? '#fff' : 'var(--color-text)',
                  border: `1px solid var(--color-primary)`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {opt} year{opt > 1 ? 's' : ''}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performance}>
              <XAxis dataKey="date" />
              <YAxis domain={["auto", "auto"]} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section>
          <h2>Recommended Portfolio</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}
                >
                  Ticker
                </th>
                <th
                  style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}
                >
                  Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map(({ ticker, weight }) => (
                <tr key={ticker}>
                  <td>{ticker}</td>
                  <td style={{ textAlign: 'right' }}>
                    {(weight * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}