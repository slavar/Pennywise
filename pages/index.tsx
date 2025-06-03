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

import { categoryTickerOptions, categories, Category, PortfolioItem } from '../lib/portfolio';

// PerformanceEntry: date and portfolio value time-series
type PerformanceEntry = { date: string; value: number };

export default function Home() {
  // Theme state: light or dark, persisted in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark'
      ? 'dark'
      : 'light'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const [risk, setRisk] = useState<'low' | 'mid' | 'high'>('mid');
  const [horizon, setHorizon] = useState<'short' | 'mid' | 'long'>('mid');
  const [years, setYears] = useState<number>(5);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [performance, setPerformance] = useState<PerformanceEntry[]>([]);
  const [gain, setGain] = useState<number>(0);
  // Selected index into categoryTickerOptions for each asset category
  const [selectedIndexes, setSelectedIndexes] = useState<Record<Category, number>>(
    () => Object.fromEntries(categories.map(cat => [cat, 0])) as Record<Category, number>
  );
  // Handlers to cycle through available ticker options per category
  const handlePrevTicker = (cat: Category) =>
    setSelectedIndexes(prev => ({
      ...prev,
      [cat]:
        (prev[cat] - 1 + categoryTickerOptions[cat].length) %
        categoryTickerOptions[cat].length,
    }));
  const handleNextTicker = (cat: Category) =>
    setSelectedIndexes(prev => ({
      ...prev,
      [cat]: (prev[cat] + 1) % categoryTickerOptions[cat].length,
    }));

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
    BND: 'Vanguard Total Bond Market ETF — broad-based bond exposure',
    AGG: 'iShares Core U.S. Aggregate Bond ETF — broad U.S. bond exposure',
    TLT: 'iShares 20+ Year Treasury Bond ETF — long-term U.S. Treasuries',
    VOO: 'Vanguard S&P 500 ETF — broad U.S. equity exposure',
    SPY: 'SPDR S&P 500 ETF Trust — broad U.S. equity exposure',
    IVV: 'iShares Core S&P 500 ETF — broad U.S. equity exposure',
    AAPL: 'Apple Inc. — a large-cap technology stock example',
    MSFT: 'Microsoft Corporation — a large-cap technology stock example',
    GOOGL: 'Alphabet Inc. — a large-cap technology stock example',
  };

  useEffect(() => {
    async function fetchData() {
      // Build override tickers string in order of categories
      const overrideParam = categories
        .map(cat => categoryTickerOptions[cat][selectedIndexes[cat]])
        .join(',');
      const res = await fetch(
        `/api/portfolio?risk=${risk}&horizon=${horizon}&years=${years}&tickers=${encodeURIComponent(
          overrideParam
        )}`
      );
      const data = await res.json();
      setPortfolio(data.portfolio);
      setPerformance(data.performance);
      setGain(data.gain);
    }
    fetchData();
  }, [risk, horizon, years, selectedIndexes]);

  const gainColor = gain >= 0 ? 'var(--color-gain)' : 'var(--color-loss)';

  // Fixed expected return forecast model: weighted by each ticker's assumed return
  const tickerExpectedReturns: Record<string, number> = {
    BND: 0.03,
    AGG: 0.025,
    TLT: 0.04,
    VOO: 0.07,
    SPY: 0.07,
    IVV: 0.07,
    AAPL: 0.1,
    MSFT: 0.1,
    GOOGL: 0.1,
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <label
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '1rem' }}
          >
            <span style={{ marginRight: '0.5rem' }}>Light</span>
            <div
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{
                width: '40px',
                height: '20px',
                backgroundColor: theme === 'dark' ? 'var(--color-primary)' : '#ccc',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
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
                  left: theme === 'dark' ? 'calc(100% - 18px)' : '2px',
                  transition: 'left 0.2s',
                }}
              />
            </div>
            <span style={{ marginLeft: '0.5rem' }}>Dark</span>
          </label>
          <h1 style={{ whiteSpace: 'nowrap', margin: 0 }}>
            Pennywise Investment Portfolio Recommendation
          </h1>
        </div>
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
                {portfolio.map(({ category, ticker, weight }) => (
                  <tr key={`${category}-${ticker}`}> 
                    <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={() => handlePrevTicker(category)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0,
                          marginRight: '0.25rem',
                        }}
                      >
                        ◀
                      </button>
                      <span
                        title={tickerDescriptions[ticker]}
                        style={{ cursor: 'help', margin: '0 0.25rem' }}
                      >
                        {ticker}
                      </span>
                      <button
                        onClick={() => handleNextTicker(category)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0,
                          marginLeft: '0.25rem',
                        }}
                      >
                        ▶
                      </button>
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
            <span
              title="Fixed-return approach"
              style={{ cursor: 'help' }}
            >
              Forecast
            </span>
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

        <footer style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--color-secondary)',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-secondary)'
        }}>
          Disclaimer: Pennywise is not a financial advisor. The information presented here is for educational purposes only and does not constitute financial advice. Please consult a professional before making any investment decisions.
        </footer>
      </main>
    </>
  );
}