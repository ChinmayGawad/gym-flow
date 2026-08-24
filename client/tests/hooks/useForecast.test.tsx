import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ForecastResponse } from '@/types/occupancy';
import { useForecast } from '@/hooks/useForecast';
import { MockEventSource, MockBroadcastChannel } from '../stubs';

const forecastFixture: ForecastResponse = {
  success: true,
  date: '2026-08-24',
  capacity: 50,
  totalPlannedVisits: 3,
  optimalWindow: {
    timeRange: '3 PM – 3:30 PM',
    expectedPeople: 4,
    plannedCount: 0,
    status: 'LOW',
  },
  forecast: [
    {
      id: '1',
      time: '6 AM',
      hour24: 6,
      plannedCount: 0,
      predictedCount: 3,
      percentage: 8,
      status: 'LOW',
      waitTime: '0–5 min',
      isHigh: false,
      isHighest: false,
      isOptimal: false,
      plannedMembers: [],
    },
    {
      id: '13',
      time: '6 PM',
      hour24: 18,
      plannedCount: 2,
      predictedCount: 17,
      percentage: 34,
      status: 'LOW',
      waitTime: '0–5 min',
      isHigh: false,
      isHighest: true,
      isOptimal: false,
      plannedMembers: [{ id: 'u1', name: 'Ann', image: null }],
    },
  ],
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

function arrangeFetch(overrides: Partial<Record<string, unknown>> = {}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('/api/gym/forecast')) return jsonResponse(forecastFixture);
    if (init?.method === 'DELETE' && u.includes('/api/gym/planned-visits/')) {
      const handler = overrides.deleteHandler as ((u: string) => unknown) | undefined;
      if (handler) return handler(u);
    }
    throw new Error(`Unexpected fetch: ${init?.method ?? 'GET'} ${u}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useForecast', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    MockBroadcastChannel.instances = [];
  });

  it('loads the forecast for today on mount', async () => {
    const fetchMock = arrangeFetch();

    const { result } = renderHook(() => useForecast());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/gym/forecast?date='),
      expect.objectContaining({ credentials: 'include' })
    );
    expect(result.current.forecast).toHaveLength(2);
    expect(result.current.capacity).toBe(50);
    expect(result.current.totalPlannedVisits).toBe(3);
    expect(result.current.optimalWindow.timeRange).toBe('3 PM – 3:30 PM');
    expect(result.current.error).toBeNull();
    expect(result.current.userPlannedVisit).toBeNull();
  });

  it('sets an error message when the API responds with a failure status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    );

    const { result } = renderHook(() => useForecast());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Failed to load forecast data.');
    expect(result.current.forecast).toEqual([]);
  });

  it('surfaces network errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('socket hang up');
      })
    );

    const { result } = renderHook(() => useForecast());

    await waitFor(() => expect(result.current.error).toBe('socket hang up'));
  });

  it('does not fetch anything when disabled', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useForecast({ enabled: false }));

    // Give effects a tick to run
    await act(async () => {});
    expect(fetchMock).not.toHaveBeenCalled();
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('subscribes to the live stream and tracks connection state', async () => {
    arrangeFetch();

    const { result } = renderHook(() => useForecast());
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    const es = MockEventSource.instances[0];
    expect(es.url).toContain('/api/gym/live-stream');
    expect(es.withCredentials).toBe(true);

    act(() => es.open());
    expect(result.current.isLiveStreamActive).toBe(true);

    act(() => es.error());
    expect(result.current.isLiveStreamActive).toBe(false);
    expect(es.closed).toBe(true); // cleaned up before scheduling reconnect
  });

  it('merges live forecast_update payloads into existing state', async () => {
    arrangeFetch();

    const { result } = renderHook(() => useForecast());
    await waitFor(() => expect(result.current.forecast).toHaveLength(2));

    const es = MockEventSource.instances[0];
    act(() =>
      es.emit({
        type: 'forecast_update',
        totalPlannedVisits: 99,
        forecast: forecastFixture.forecast.slice(0, 1),
      })
    );

    expect(result.current.totalPlannedVisits).toBe(99);
    expect(result.current.forecast).toHaveLength(1);
  });

  it('ignores keepalive comment frames without parsing them', async () => {
    arrangeFetch();

    const { result } = renderHook(() => useForecast());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = result.current;

    const es = MockEventSource.instances[0];
    act(() => es.onmessage?.({ data: ': keepalive ping' }));
    act(() => es.onmessage?.({ data: '' }));

    expect(result.current).toEqual(before);
  });

  describe('cancelSlot', () => {
    it('cancels the visit, broadcasts cross-tab and silently refreshes', async () => {
      let deleteCalled = 0;
      const fetchMock = arrangeFetch({
        deleteHandler: () => {
          deleteCalled += 1;
          return jsonResponse({ success: true });
        },
      });

      const { result } = renderHook(() => useForecast());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let outcome: boolean | undefined;
      await act(async () => {
        outcome = await result.current.cancelSlot('v42');
      });

      expect(outcome).toBe(true);
      expect(deleteCalled).toBe(1);
      expect(fetchMock.mock.calls.some(([u]) => String(u).includes('planned-visits/v42'))).toBe(
        true
      );
      // A silent refetch of the forecast was triggered afterwards
      const forecastCalls = fetchMock.mock.calls.filter(([u]) =>
        String(u).includes('/api/gym/forecast')
      );
      expect(forecastCalls.length).toBeGreaterThanOrEqual(2);

      const bc = MockBroadcastChannel.instances.at(-1)!;
      expect(bc.postMessage).toHaveBeenCalledWith({
        type: 'GYM_VISIT_CANCELLED',
        visitId: 'v42',
      });
    });

    it('returns false when cancellation fails', async () => {
      arrangeFetch({
        deleteHandler: () => jsonResponse({ error: 'not found' }, false, 404),
      });

      const { result } = renderHook(() => useForecast());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let outcome: boolean | undefined;
      await act(async () => {
        outcome = await result.current.cancelSlot('missing');
      });

      expect(outcome).toBe(false);
    });
  });
});
