import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BestTimeCard } from '@/components/dashboard/BestTimeCard';

function stubForecast(optimalWindow: {
  timeRange: string;
  expectedPeople: number;
  status: string;
}) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      success: true,
      optimalWindow: { plannedCount: 0, ...optimalWindow },
    }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BestTimeCard', () => {
  it('renders optimistic defaults before the forecast resolves', () => {
    stubForecast({ timeRange: 'x', expectedPeople: 1, status: 'LOW' });

    render(<BestTimeCard capacity={40} />);

    // Default window shown synchronously
    expect(screen.getByText('10:00 AM – 11:30 AM')).toBeInTheDocument();
    expect(screen.getByText('~10 people')).toBeInTheDocument(); // round(40 * 0.25)
    expect(screen.getByText('LOW CROWD')).toBeInTheDocument();
  });

  it('displays the optimal window returned by the API', async () => {
    const fetchMock = stubForecast({
      timeRange: '2 PM – 3:30 PM',
      expectedPeople: 7,
      status: 'HIGH',
    });

    render(<BestTimeCard capacity={30} />);

    await waitFor(() =>
      expect(screen.getByText('2 PM – 3:30 PM')).toBeInTheDocument()
    );
    expect(screen.getByText('~7 people')).toBeInTheDocument();
    expect(screen.getByText('HIGH CROWD')).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/gym/forecast?date='),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('keeps defaults when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );

    render(<BestTimeCard />);

    // Let the rejection settle
    await waitFor(() => expect(vi.mocked(global.fetch)).toHaveBeenCalled());
    expect(screen.getByText('10:00 AM – 11:30 AM')).toBeInTheDocument();
    expect(screen.getByText('LOW CROWD')).toBeInTheDocument();
  });
});
