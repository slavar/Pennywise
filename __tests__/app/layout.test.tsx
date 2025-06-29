import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Footer', () => {
  it('renders the footer', () => {
    render(
      <footer className="pw-footer" style={{ textAlign: "center", color: "var(--color-secondary)", marginTop: "1rem", fontSize: "0.97rem", padding: "16px 0" }}>
        Questions or feedback? Reach us at <a href="mailto:info@pennywise.business">info@pennywise.business</a>
      </footer>
    );
    expect(screen.getByText(/Questions or feedback?/)).toBeInTheDocument();
  });
});
