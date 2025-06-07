"use client";

import React, { useState, useEffect } from 'react';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function FinancialLiteracyPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const linkStyle = { color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 'bold' };

  return (
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}
      >
        <h1 style={{ whiteSpace: 'nowrap', margin: 0 }}>Financial Literacy Basics</h1>
      </div>

      <div>
        <p>
          Welcome to the Financial Literacy Basics page for <a href="/" style={linkStyle}>Pennywise</a>. Here we explain the key terms and concepts
          you’ll encounter in the Investment Portfolio Recommendation app, so you can make informed decisions even
          if you have little or no prior finance experience.
        </p>

        <section>
          <h2>Portfolio</h2>
          <p>
            A <strong>portfolio</strong> is a collection of financial assets—such as stocks, bonds, or ETFs—that you
            own. In the <a href="/" style={linkStyle}>Pennywise</a> app, your portfolio shows which tickers (symbols) and how many shares you hold.
          </p>
        </section>

        <section>
          <h2>Diversification</h2>
          <p>
            <strong>Diversification</strong> means spreading your investments across different types of assets or
            categories (like bonds, ETFs, and stocks). This helps reduce risk, because the performance of one
            asset may offset another.
          </p>
        </section>

        <section>
          <h2>Asset Category</h2>
          <p>
            An <strong>asset category</strong> groups similar investments (for example, bonds, ETFs, or stocks). The
            <a href="/" style={linkStyle}>Pennywise</a> app uses these categories to recommend an allocation based on your risk preference and investment
            horizon.
          </p>
        </section>

        <section>
          <h2>ETF (Exchange-Traded Fund)</h2>
          <p>
            An <strong>ETF</strong> is a type of fund that trades like a stock on an exchange and holds a collection
            of assets (such as an index of stocks or bonds). ETFs offer built-in diversification.
          </p>
        </section>

        <section>
          <h2>Ticker Symbol</h2>
          <p>
            A <strong>ticker symbol</strong> (or <em>ticker</em>) is a short code that uniquely identifies a publicly
            traded security on an exchange (for example, AAPL for Apple Inc.). You’ll see tickers in the <a href="/" style={linkStyle}>Pennywise</a>
            app when reviewing your portfolio.
          </p>
        </section>


        <section>
          <h2>Share</h2>
          <p>
            A <strong>share</strong> represents a unit of ownership in a company (for stocks) or fund (for ETFs). In
            the app, you enter how many shares you hold of each ticker.
          </p>
        </section>

        <section>
          <h2>Price</h2>
          <p>
            The <strong>price</strong> is the current market value of one share or unit of an asset. <a href="/" style={linkStyle}>Pennywise</a> fetches
            the latest closing price to calculate the value of your holdings.
          </p>
        </section>

        <section>
          <h2>Allocation (Weight)</h2>
          <p>
            <strong>Allocation</strong> (or <em>weight</em>) shows the percentage of your total portfolio invested
            in a particular ticker or category (calculated as shares × price ÷ total portfolio value). The app
            displays this so you can see how diversified your money is.
          </p>
        </section>

        <section>
          <h2>Risk Preference</h2>
          <p>
            <strong>Risk preference</strong> (low, mid, or high) expresses how comfortable you are with potential
            fluctuations in your portfolio’s value. A higher risk preference typically leads to a larger allocation
            to equities (stocks), while a lower preference favors bonds.
          </p>
        </section>

        <section>
          <h2>Investment Horizon</h2>
          <p>
            <strong>Investment horizon</strong> (short, mid, or long) refers to the time frame over which you plan
            to keep your money invested. Longer horizons usually allow for more equity exposure, since there is more
            time to recover from short-term market swings.
          </p>
        </section>

        <section>
          <h2>Performance</h2>
          <p>
            <strong>Performance</strong> tracks how the total value of your portfolio changes over time. <a href="/" style={linkStyle}>Pennywise</a>
            shows historical performance (1, 3, and 5 years) and projected gains or losses.
          </p>
        </section>

        <section>
          <h2>Gain / Loss</h2>
          <p>
            <strong>Gain</strong> is the amount your portfolio has increased in value, while <strong>loss</strong> is
            the amount it has decreased. The app highlights these to help you see if you’re ahead or behind your
            starting point.
          </p>
        </section>
      </div>
    </main>
  );
}