"use client";
import React, { useEffect, useState } from "react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <header className="header">
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <a href="/" style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>Pennywise</a>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <a href="/learn" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Learn</a>
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div role="group" aria-label="Theme" className="segment" aria-live="polite">
            <button aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Light</button>
            <button aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</button>
          </div>
          <SignedOut>
            <SignInButton>Sign In</SignInButton>
            <SignUpButton>Sign Up</SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

