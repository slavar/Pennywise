import React from 'react';
import { render, screen } from '@testing-library/react';
import LearnPage from '../../../app/learn/page';

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div>User Button</div>,
}));

describe('LearnPage', () => {
  beforeEach(() => {
    render(<LearnPage />);
  });

  it('renders the main heading', () => {
    expect(screen.getByText('Financial Literacy Basics')).toBeInTheDocument();
  });

  it('renders all the section headings', () => {
    const headings = [
      'Portfolio',
      'Diversification',
      'Asset Category',
      'ETF (Exchange-Traded Fund)',
      'Ticker Symbol',
      'Share',
      'Price',
      'Allocation (Weight)',
      'Risk Preference',
      'Investment Horizon',
      'Performance',
      'Gain / Loss',
    ];
    headings.forEach(heading => {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    });
  });
});
