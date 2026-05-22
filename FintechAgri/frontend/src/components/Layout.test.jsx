import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Layout from './Layout';

describe('Layout Component', () => {
  it('renders the sidebar, topbar, and children', () => {
    render(
      <Layout>
        <div data-testid="child-content">Child Content</div>
      </Layout>
    );

    // Verify sidebar is rendered
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('AgroMind')).toBeInTheDocument();

    // Verify topbar is rendered
    expect(screen.getByTestId('topbar')).toBeInTheDocument();

    // Verify children are rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
