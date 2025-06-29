
import React from 'react';
import { render, screen } from '@testing-library/react';
import FloatingFeedback from '../../app/FloatingFeedback';

describe('FloatingFeedback component', () => {
  it('renders without crashing', () => {
    render(<FloatingFeedback />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
