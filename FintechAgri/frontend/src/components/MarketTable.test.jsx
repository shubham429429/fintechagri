import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MarketTable from './MarketTable';

const mockData = [
  ['Lasalgaon MH', 1340, '1,100 – 1,580', '4,200 q', '22 km', 'HOLD'],
  ['Pune APMC MH', 1420, '1,200 – 1,620', '2,800 q', '168 km', 'SELL 30%'],
];

describe('MarketTable Component', () => {
  it('renders correctly with data', () => {
    render(<MarketTable data={mockData} />);
    
    // Check headers
    expect(screen.getByText('Mandi')).toBeInTheDocument();
    expect(screen.getByText('Modal Price')).toBeInTheDocument();
    
    // Check first row (best-row)
    const firstRow = screen.getByTestId('market-row-0');
    expect(firstRow).toHaveClass('best-row');
    expect(firstRow).toHaveTextContent('Lasalgaon');
    expect(firstRow).toHaveTextContent('₹1340');
    expect(firstRow).toHaveTextContent('HOLD');
    
    // Check second row
    const secondRow = screen.getByTestId('market-row-1');
    expect(secondRow).not.toHaveClass('best-row');
    expect(secondRow).toHaveTextContent('Pune APMC');
    expect(secondRow).toHaveTextContent('₹1420');
    expect(secondRow).toHaveTextContent('SELL 30%');
  });

  it('renders empty state when no data provided', () => {
    render(<MarketTable data={[]} />);
    expect(screen.getByText('No market data available')).toBeInTheDocument();
  });
});
