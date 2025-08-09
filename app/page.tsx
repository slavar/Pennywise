 'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
} from 'recharts';
// useAuth hook is imported from Clerk to get the user's token
import { SignedIn, useUser, useAuth } from '@clerk/nextjs';

import { categoryTickerOptions, categories, Category, PortfolioItem, getPortfolio } from '../lib/portfolio';

// PerformanceEntry: date and portfolio value time-series
type PerformanceEntry = { date: string; value: number };

export default function Page() {
  // Theme handled globally in Header
  const [risk, setRisk] = useState<'low' | 'mid' | 'high'>('mid');
  const [horizon, setHorizon] = useState<'short' | 'mid' | 'long'>('mid');
  const [years, setYears] = useState<number>(5);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [performance, setPerformance] = useState<PerformanceEntry[]>([]);
  const [gain, setGain] = useState<number>(0);
  // Custom portfolio analysis state (logged-in users only)
  const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);
  const [uploadText, setUploadText] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [customPortfolio, setCustomPortfolio] = useState<PortfolioItem[] | null>(null);
  const [savedChecked, setSavedChecked] = useState(false);
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
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
    if (!isUserLoaded || savedChecked) return;
    if (!isSignedIn) {
      setSavedChecked(true);
      return;
    }
    (async () => {
      try {
        // The fetch URL is updated to use a template literal.
        const res = await fetch(`/api/portfolio-saved`);
        if (res.ok) {
          const data = await res.json();
          setCustomPortfolio(data.portfolio ?? []);
          setPerformance(data.performance ?? []);
          setGain(data.gain ?? 0);
        }
      } catch {
      }
      setSavedChecked(true);
    })();
  }, [isUserLoaded, isSignedIn, savedChecked]);

  useEffect(() => {
    if (!savedChecked || customPortfolio) {
      return;
    }
    async function fetchData() {
      const selectedTickers = categories
        .map(cat => categoryTickerOptions[cat][selectedIndexes[cat]]);

      // Build weights on the client based on current risk/horizon
      const overrideTickers = Object.fromEntries(
        categories.map((cat, idx) => [cat, [selectedTickers[idx]]])
      ) as Partial<Record<Category, readonly string[]>>;
      const computedPortfolio = getPortfolio(risk, horizon, overrideTickers);

      const overrideParam = selectedTickers.join(',');
      const res = await fetch(`/api/portfolio?years=${years}&tickers=${overrideParam}`);
      const data = await res.json();
      if ('error' in data) {
        console.error(data.error);
        setPortfolio([]);
        setPerformance([]);
        setGain(0);
        return;
      }

      const series: Array<{ symbol: string; points: { date: string; close: number }[] }> = data.series ?? [];
      if (!series.length) {
        setPortfolio(computedPortfolio);
        setPerformance([]);
        setGain(0);
        return;
      }

      // Index quotes by date for quick lookup
      const bySymbol: Record<string, Record<string, number>> = Object.fromEntries(
        series.map(s => [
          s.symbol,
          Object.fromEntries(
            s.points.map(p => [new Date(p.date).toISOString().slice(0, 10), p.close])
          )
        ])
      );

      // Use intersection of dates across all symbols to avoid gaps causing zeros
      const dateSets = series.map(s => new Set(s.points.map(p => new Date(p.date).toISOString().slice(0, 10))));
      let baseDates = Array.from(dateSets[0] ?? []);
      for (let i = 1; i < dateSets.length; i++) {
        baseDates = baseDates.filter(d => dateSets[i].has(d));
      }
      baseDates.sort();
      if (baseDates.length === 0 && series[0]) {
        baseDates = series[0].points.map(p => new Date(p.date).toISOString().slice(0, 10));
      }
      const perf = baseDates.map((date) => {
        const value = computedPortfolio.reduce<number>((sum, p: PortfolioItem) => {
          const price = bySymbol[p.ticker]?.[date] ?? 0;
          return sum + price * p.weight;
        }, 0);
        return { date, value };
      });
      const g = perf.length > 1 ? ((perf[perf.length - 1].value / perf[0].value) - 1) * 100 : 0;

      setPortfolio(computedPortfolio);
      setPerformance(perf);
      setGain(g);
    }
    fetchData();
  }, [risk, horizon, years, selectedIndexes, customPortfolio, savedChecked]);

  const compressImage = async (file: File): Promise<Blob> => {
    const imgBitmap = await createImageBitmap(file);
    const MAX_WIDTH = 600;
    const scale = Math.min(1, MAX_WIDTH / imgBitmap.width);
    const width = imgBitmap.width * scale;
    const height = imgBitmap.height * scale;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imgBitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Image compression failed'));
        },
        'image/jpeg',
        0.2
      );
    });
  };

  // getToken is retrieved from the useAuth hook to authorize the API request.
  const { getToken } = useAuth();

  const handleAnalyze = async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      let payload: { text?: string; fileData?: string; fileType?: string };
      if (uploadFile) {
        let fileToRead: Blob = uploadFile;
        if (uploadFile.type.startsWith('image/')) {
          fileToRead = await compressImage(uploadFile);
        }
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileToRead);
        });
        payload = { fileData: dataUrl.split(',')[1], fileType: fileToRead.type };
      } else {
        payload = { text: uploadText };
      }
      // The Authorization header is added to the request, containing the user's JWT.
      const response = await fetch('/api/portfolio-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ ...payload, years }),
      });
      const data = await response.json();
      if (response.ok) {
        setCustomPortfolio(data.portfolio);
        setPerformance(data.performance);
        setGain(data.gain);
        setShowUploadDialog(false);
      } else {
        setAnalysisError(data.error || 'Analysis failed');
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Analysis failed');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const gainColor = gain >= 0 ? 'var(--color-gain)' : 'var(--color-loss)';

  // Fixed expected return forecast model: weighted by each ticker's assumed return
  const tickerExpectedReturns: Record<string, number> = {
    BND: 0.03,
    AGG: 0.025,
    TLT: 0.04,
  VOO: 0.07,
  SPY: 0.068,
  IVV: 0.069,
  AAPL: 0.10,
  MSFT: 0.095,
  GOOGL: 0.11,
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
    <main className="container">
      {/* Global header provides navigation and theme */}


      <div className="page-header">
        <h1 style={{ whiteSpace: 'nowrap', margin: 0 }}>
          Pennywise: Your Investment Guide
        </h1>
        <p style={{ margin: '0.5rem 0', color: 'var(--color-secondary)' }}>
          From risk tolerance to performance tracking
        </p>
      </div>
      <section
        className="top-row"
        style={{ display: 'flex', alignItems: 'stretch', gap: '2rem', marginBottom: '2rem' }}
      >
          <div style={{ flex: 1 }}>
            <section className="card" style={{ marginBottom: '2rem' }}>
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
            <section className="card">
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
          <div style={{ flex: '0 0 30%' }} className="card">
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
                {!customPortfolio
                  ? portfolio.map(({ category, ticker, weight }) => (
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
                    ))
                  : customPortfolio.map(({ ticker, weight }) => (
                      <tr key={ticker}>
                        <td style={{ textAlign: 'left' }}>{ticker}</td>
                        <td style={{ textAlign: 'right' }}>
                          {(weight * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            <SignedIn>
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  onClick={() => setShowUploadDialog(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Upload Existing Portfolio
                </button>
              </div>
            </SignedIn>
          </div>
        </section>

        {showUploadDialog && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <div className="card"
              style={{
                background: 'var(--surface)',
                padding: '2rem',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90%',
                overflowY: 'auto',
              }}
            >
              <h3>Upload Existing Portfolio</h3>
              <div className="segment" role="tablist" aria-label="Input mode" style={{ margin: '0.5rem 0 1rem' }}>
                <button role="tab" aria-selected={!uploadFile} onClick={() => { setUploadFile(null); }}>
                  Paste Text
                </button>
                <button role="tab" aria-selected={!!uploadFile} onClick={() => { /* switch by selecting file below */ }}>
                  Upload File
                </button>
              </div>
              <p style={{ margin: '0.5rem 0 1rem', color: '#555' }}>
                You can upload a screenshot of your portfolio from your investment application.
              </p>
              <div
                onPaste={(e) => {
                  const files = Array.from(e.clipboardData.files);
                  if (files.length > 0) {
                    setUploadFile(files[0]);
                    e.preventDefault();
                  }
                }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) setUploadFile(files[0]);
                }}
                style={{
                  border: '1px dashed #ccc',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                {uploadFile ? (
                  <p>File loaded: {uploadFile.name}</p>
                ) : (
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder="Paste text here"
                    style={{ width: '100%', minHeight: '100px' }}
                  />
                )}
                {!uploadFile && (
                  <input
                    type="file"
                    accept=".pdf, image/*"
                    onChange={(e) =>
                      e.target.files && setUploadFile(e.target.files[0])
                    }
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>
              {analysisError && (
                <p style={{ color: 'red' }}>{analysisError}</p>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                }}
              >
                <button
                  onClick={() => {
                    setShowUploadDialog(false);
                    setUploadText('');
                    setUploadFile(null);
                    setAnalysisError(null);
                  }}
                  disabled={analysisLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={analysisLoading || (!uploadFile && !uploadText)}
                >
                  {analysisLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          </div>
        )}
        <section className="card" style={{ marginBottom: '2rem' }}>
          <div className="chart-header">
            <div role="group" aria-label="Series" className="segment">
              <button aria-pressed={chartType === 'historical'} onClick={() => setChartType('historical')}>Historic</button>
              <button aria-pressed={chartType === 'forecast'} onClick={() => setChartType('forecast')}>Forecast</button>
            </div>
            <div role="group" aria-label="Years" className="segment">
              {yearOptions.map(opt => (
                <button key={opt} aria-pressed={years === opt} onClick={() => setYears(opt)}>
                  {opt}y
                </button>
              ))}
            </div>
          </div>
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartType === 'historical' ? performance : forecastData}>
              <defs>
                <linearGradient id="pwGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--color-secondary)" />
              <YAxis domain={['auto','auto']} stroke="var(--color-secondary)" />
              <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Area type="monotone" dataKey="value" stroke="none" fill="url(#pwGradient)" />
              <Line type="monotone" dataKey="value" stroke="var(--color-primary)" dot={false} />
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
  );
}
