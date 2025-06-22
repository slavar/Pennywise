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
} from 'recharts';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';

import { categoryTickerOptions, categories, Category, PortfolioItem } from '../lib/portfolio';

// PerformanceEntry: date and portfolio value time-series
type PerformanceEntry = { date: string; value: number };

export default function Page() {
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
        const res = await fetch('/api/portfolio-saved');
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
      const overrideParam = categories
        .map(cat => categoryTickerOptions[cat][selectedIndexes[cat]])
        .join(',');
      const res = await fetch(
        `/api/portfolio?risk=${risk}&horizon=${horizon}&years=${years}&tickers=${encodeURIComponent(
          overrideParam
        )}`
      );
      const data = await res.json();
      if ('error' in data) {
        console.error(data.error);
        setPortfolio([]);
        setPerformance([]);
        setGain(0);
        return;
      }
      setPortfolio(data.portfolio ?? []);
      setPerformance(data.performance ?? []);
      setGain(data.gain ?? 0);
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
      const response = await fetch('/api/portfolio-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="controls">
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
        <a
          href="/learn"
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'underline',
            fontWeight: 'bold',
            marginLeft: '1rem',
          }}
        >
          Financial Literacy Basics
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <SignedOut>
            <SignInButton>Sign In</SignInButton>
            <SignUpButton>Sign Up</SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>


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
            <div
              style={{
                background: '#fff',
                padding: '2rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90%',
                overflowY: 'auto',
              }}
            >
              <h3>Upload Existing Portfolio</h3>
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
  );
}