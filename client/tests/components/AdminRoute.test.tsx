import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { useSession } from '@/lib/auth-client';

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

function renderRoute(onOpenAuth?: () => void) {
  return render(
    <MemoryRouter>
      <AdminRoute onOpenAuth={onOpenAuth}>
        <div>TOP SECRET ADMIN CONTENT</div>
      </AdminRoute>
    </MemoryRouter>
  );
}

describe('AdminRoute', () => {
  it('shows a verification spinner while the session is pending', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as any);

    renderRoute();

    expect(screen.getByText(/Verifying administrator credentials/i)).toBeInTheDocument();
  });

  it('renders protected children for an admin session', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'a1', role: 'admin' } },
      isPending: false,
    } as any);

    renderRoute();

    expect(screen.getByText('TOP SECRET ADMIN CONTENT')).toBeInTheDocument();
  });

  it('blocks members without the admin role', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: 'm1', role: 'user' } },
      isPending: false,
    } as any);

    renderRoute();

    expect(screen.queryByText('TOP SECRET ADMIN CONTENT')).not.toBeInTheDocument();
    expect(screen.getByText('Administrator Access Required')).toBeInTheDocument();
  });

  it('blocks anonymous visitors and offers the auth modal entry point', () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as any);
    const onOpenAuth = vi.fn();

    renderRoute(onOpenAuth);

    expect(screen.getByText('Administrator Access Required')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Sign In as Admin/i }));
    expect(onOpenAuth).toHaveBeenCalledTimes(1);
  });

  it('Return to Dashboard navigates to / via location assignment', () => {
    mockedUseSession.mockReturnValue({
      data: { user: { role: 'user' } },
      isPending: false,
    } as any);

    let assignedHref = '';
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        get href() {
          return 'http://localhost/';
        },
        set href(value: string) {
          assignedHref = value;
        },
      },
    });

    renderRoute();
    fireEvent.click(screen.getByRole('button', { name: /Return to Dashboard/i }));

    expect(assignedHref).toBe('/');
  });
});
