import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Custom render function that includes router provider
export function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return {
    ...render(ui, {
      wrapper: BrowserRouter
    })
  };
}

// Add more test utilities as needed
export * from '@testing-library/react';