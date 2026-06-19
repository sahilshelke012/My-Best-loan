import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loan amortization calculator header', () => {
  render(<App />);
  const headerElement = screen.getByRole('heading', { name: /MY BEST LOAN/i });
  expect(headerElement).toBeInTheDocument();
});
