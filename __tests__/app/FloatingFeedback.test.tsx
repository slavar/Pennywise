
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FloatingFeedback from '../../app/FloatingFeedback';

describe('FloatingFeedback component', () => {
  it('renders without crashing', () => {
    render(<FloatingFeedback />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens and closes the feedback form', () => {
    render(<FloatingFeedback />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByPlaceholderText('Your feedback...')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByPlaceholderText('Your feedback...')).not.toBeInTheDocument();
  });

  it('submits feedback', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      })
    ) as any;

    render(<FloatingFeedback />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const textarea = screen.getByPlaceholderText('Your feedback...');
    fireEvent.change(textarea, { target: { value: 'This is a test feedback.' } });
    const submitButton = screen.getByText('Submit');
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: 'This is a test feedback.' }),
    });
  });

  it('closes the feedback form with the Escape key', () => {
    render(<FloatingFeedback />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByPlaceholderText('Your feedback...')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByPlaceholderText('Your feedback...')).not.toBeInTheDocument();
  });
});
