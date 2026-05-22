import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Flow', () => {
  it('handles login and logout flow correctly', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially on Login Page
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();

    // Try submitting empty
    await user.click(screen.getByTestId('btn-login'));
    expect(screen.getByTestId('login-error')).toBeInTheDocument();

    // Fill form and submit
    await user.type(screen.getByTestId('input-phone'), '9876543210');
    await user.type(screen.getByTestId('input-key'), 'secret');
    await user.click(screen.getByTestId('btn-login'));

    // Now on Dashboard Page
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.getByText('Ramesh Singh')).toBeInTheDocument();

    // Logout
    await user.click(screen.getByTestId('btn-logout'));
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
