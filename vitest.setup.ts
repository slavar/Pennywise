import '@testing-library/jest-dom';

// Polyfill ResizeObserver
if (typeof window !== 'undefined') {
  const { ResizeObserver } = window;
  if (ResizeObserver === undefined) {
    // @ts-ignore
    window.ResizeObserver = class ResizeObserver {
      observe() {
        // do nothing
      }
      unobserve() {
        // do nothing
      }
      disconnect() {
        // do nothing
      }
    };
  }
}