
import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '../../app/page';

// Mock the necessary hooks and components
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: true, user: { fullName: 'Test User' } }),
  useAuth: () => ({ getToken: () => 'test-token' }),
  SignInButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserButton: () => <div>User Button</div>,
}));

describe('Page component', () => {
  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByText('Pennywise: Your Investment Guide')).toBeInTheDocument();
  });
});
