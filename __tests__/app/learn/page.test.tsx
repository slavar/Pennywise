import React from 'react';
import { render, screen } from '@testing-library/react';
import LearnPage from '@/app/learn/page';
import { ClerkProvider } from '@clerk/nextjs';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('LearnPage', () => {
  it('renders the main heading', () => {
    render(
      <ClerkProvider publishableKey="pk_test_ZGV2ZWxvcG1lbnQucGVubnkuYXBwJGRldiQ">
        <LearnPage />
      </ClerkProvider>
    );
    expect(screen.getByText('Financial Literacy Basics')).toBeInTheDocument();
  });

  it('renders all the section headings', () => {
    render(
      <ClerkProvider publishableKey="pk_test_ZGV2ZWxvcG1lbnQucGVubnkuYXBwJGRldiQ">
        <LearnPage />
      </ClerkProvider>
    );
    expect(screen.getByRole('heading', { name: 'Portfolio' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Diversification' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Asset Category' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ETF (Exchange-Traded Fund)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ticker Symbol' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Price' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Allocation (Weight)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Risk Preference' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Investment Horizon' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Performance' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gain / Loss' })).toBeInTheDocument();
  });
});
