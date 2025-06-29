import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../../app/Footer';

describe('Footer', () => {
  it('renders the footer', () => {
    render(<Footer />);
    expect(screen.getByText(/Questions or feedback?/)).toBeInTheDocument();
  });
});
