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

  const riskOptions: Array<{ value: 'low' | 'mid' | 'high'; label: string }> = [
    { value: 'low', label: 'Low' },
    { value: 'mid', label: 'Mid' },
    { value: 'high', label: 'High' },
  ];
  const horizonOptions: Array<{ value: 'short' | 'mid' | 'long'; label: string }> = [
    { value: 'short', label: 'Short (1-2 years)' },
    { value: 'mid', label: 'Mid (2-5 years)' },
    { value: 'long', label: 'Long (5-10 years)' },
  ];
  const yearOptions = [1, 3, 5];
  const [chartType, setChartType] = useState<'historical' | 'forecast'>(
    'historical'
  );

  const tickerDescriptions: Record<string, string> = {
    BND: 'Vanguard Total Bond Market ETF — a broad-based bond ETF',
    VOO: 'Vanguard S&P 500 ETF — broad U.S. equity exposure',
    AAPL: 'Apple Inc. — a large-cap growth stock example',
  };

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

  // Fixed expected return forecast model: weighted by each ticker's assumed return
  const tickerExpectedReturns: Record<string, number> = {
    BND: 0.03,
    VOO: 0.07,
    AAPL: 0.1,
  };
  const portfolioExpectedReturn = portfolio.reduce(
    (sum, p) => sum + p.weight * (tickerExpectedReturns[p.ticker] || 0),
    0
  );
  const forecastData: PerformanceEntry[] = performance.length
    ? (() => {
        const startValue = performance[performance.length - 1].value;
        return Array.from({ length: years + 1 }, (_, i) => ({
          date: `${i}`,
          value: startValue * Math.pow(1 + portfolioExpectedReturn, i),
        }));
      })()
    : [];
  const forecastGain = forecastData.length
    ? (forecastData[forecastData.length - 1].value / forecastData[0].value - 1) *
      100
    : 0;
  const forecastGainColor =
    forecastGain >= 0 ? 'var(--color-gain)' : 'var(--color-loss)';

  return (
    <>
      <Head>
        <title>Pennywise Investment Portfolio Recommendation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
        <h1 style={{ whiteSpace: 'nowrap', margin: '0 0 1rem' }}>
          Pennywise Investment Portfolio Recommendation
        </h1>
        <section
          className="top-row"
          style={{ display: 'flex', alignItems: 'stretch', gap: '2rem', marginBottom: '2rem' }}
        >
          <div style={{ flex: 1 }}>
            <section style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Risk Preference: {riskOptions.find(opt => opt.value === risk)!.label}
              </label>
              <input
                type="range"
                min={0}
                max={riskOptions.length - 1}
                step={1}
                value={riskOptions.findIndex(opt => opt.value === risk)}
                onChange={e => setRisk(riskOptions[+e.target.value].value)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {riskOptions.map(opt => (
                  <span key={opt.value}>{opt.label}</span>
                ))}
              </div>
            </section>
            <section>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Investment Horizon: {horizonOptions.find(opt => opt.value === horizon)!.label}
              </label>
              <input
                type="range"
                min={0}
                max={horizonOptions.length - 1}
                step={1}
                value={horizonOptions.findIndex(opt => opt.value === horizon)}
                onChange={e => setHorizon(horizonOptions[+e.target.value].value)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {horizonOptions.map(opt => (
                  <span key={opt.value}>{opt.label}</span>
                ))}
              </div>
            </section>
          </div>
          <div style={{ flex: '0 0 30%' }}>
          <h2 style={{ fontWeight: 'normal', fontSize: '1rem', whiteSpace: 'nowrap', marginBottom: '0.5rem' }}>
            Portfolio Breakdown
          </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                    Ticker
                  </th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                    Allocation (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map(({ ticker, weight }) => (
                  <tr key={ticker}>
                    <td>
                      <span
                        title={tickerDescriptions[ticker]}
                        style={{ cursor: 'help' }}
                      >
                        {ticker}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {(weight * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span>Historic</span>
            <div
              onClick={() =>
                setChartType(chartType === 'historical' ? 'forecast' : 'historical')
              }
              style={{
                margin: '0 0.5rem',
                width: '40px',
                height: '20px',
                backgroundColor:
                  chartType === 'forecast' ? 'var(--color-primary)' : '#ccc',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left:
                    chartType === 'forecast'
                      ? 'calc(100% - 18px)'
                      : '2px',
                  transition: 'left 0.2s',
                }}
              />
            </div>
            <span>Forecast</span>
          </label>
          <h2 style={{ marginBottom: '1rem' }}>
            {chartType === 'historical' ? (
              <>
                Historic Performance ({years} year{years > 1 ? 's' : ''}):{' '}
                <span style={{ color: gainColor }}>{gain.toFixed(2)}%</span>
              </>
            ) : (
              <>
                Performance Forecast ({years} year{years > 1 ? 's' : ''}):{' '}
                <span style={{ color: forecastGainColor }}>
                  {forecastGain.toFixed(2)}%
                </span>
              </>
            )}
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
            <LineChart
              data={chartType === 'historical' ? performance : forecastData}
            >
              <XAxis dataKey="date" />
              <YAxis domain={[
                'auto',
                'auto'
              ]} />
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
      </main>
    </>
  );
}