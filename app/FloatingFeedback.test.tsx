import { vi } from 'vitest';
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FloatingFeedback from "./FloatingFeedback";

// Allow fetch mocking
global.fetch = vi.fn();

describe("FloatingFeedback Component", () => {
  beforeEach(() => {
    (fetch as vi.Mock).mockClear();
  });

  it("renders Provide feedback button always", () => {
    render(<FloatingFeedback />);
    expect(screen.getByText(/provide feedback/i)).toBeInTheDocument();
  });

  it("shows textarea and submit on click", () => {
    render(<FloatingFeedback />);
    fireEvent.click(screen.getByText(/provide feedback/i));
    expect(screen.getByPlaceholderText(/your feedback/i)).toBeInTheDocument();
    expect(screen.getByText(/submit/i)).toBeInTheDocument();
  });

  it("submits feedback, clears and closes", async () => {
    // Act needed for state updates when using async
    (fetch as vi.Mock).mockResolvedValue({ ok: true, json: async () => ({ message: "ok" }) });
    render(<FloatingFeedback />);
    fireEvent.click(screen.getByText(/provide feedback/i));
    const textarea = screen.getByPlaceholderText(/your feedback/i);
    fireEvent.change(textarea, { target: { value: "hello world" } });
    // Use act to ensure all state is updated after click
    await act(async () => {
      fireEvent.click(screen.getByText(/submit/i));
    });
    // Should close modal and clear textarea
    expect(screen.queryByPlaceholderText(/your feedback/i)).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/feedback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ feedback: "hello world" }),
        headers: expect.any(Object),
      })
    );
  });

  it("closes on Escape key", () => {
    render(<FloatingFeedback />);
    fireEvent.click(screen.getByText(/provide feedback/i));
    expect(screen.getByPlaceholderText(/your feedback/i)).toBeInTheDocument();
    // Fake Escape keydown using native event
    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(screen.queryByPlaceholderText(/your feedback/i)).not.toBeInTheDocument();
  });
});