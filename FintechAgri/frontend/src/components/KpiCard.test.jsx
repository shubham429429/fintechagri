import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KpiCard from './KpiCard';

describe('KpiCard Component', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Test Label" value="₹1,000" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
  });

  it('renders delta with correct class', () => {
    render(<KpiCard label="Test Label" value="₹1,000" delta="↑ 10%" deltaType="up" />);
    const deltaElement = screen.getByText('↑ 10%');
    expect(deltaElement).toBeInTheDocument();
    expect(deltaElement).toHaveClass('kpi-delta', 'up');
  });
});
