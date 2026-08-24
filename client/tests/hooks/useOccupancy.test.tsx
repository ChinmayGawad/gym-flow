import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOccupancy } from '@/hooks/useOccupancy';
import { MockEventSource, MockBroadcastChannel } from '../stubs';

const statusFixture = {
  success: true,
  peopleCount: 12,
  capacity: 45,
  totalRegisteredMembers: 40,
  isCheckedInSelf: false,
  gymName: 'Iron Paradise',
  checkedInUserIds: ['u1', 'u2'],
};

function arrangeFetch(handlers: {
  status?: unknown;
  checkin?: unknown;
  capacityUpdate?: unknown;
} = {}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? 'GET';
    if (u.includes('/api/gym/status')) {
      return { ok: true, json: async () => handlers.status ?? statusFixture };
    }
    if (u.includes('/api/gym/checkin-toggle')) {
      return { ok: true, json: async () => handlers.checkin };
    }
    if (u.includes('/api/admin/gym/capacity')) {
      return { ok: true, json: async () => handlers.capacityUpdate ?? {} };
    }
    if (u.includes('/api/gym/simulation-step')) {
      return { ok: true, json: async () => ({ success: true }) };
    }
    throw new Error(`Unexpected fetch: ${method} ${u}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useOccupancy', () => {
  beforeEach(() => {
    window.localStorage.clear();
    MockEventSource.instances = [];
    MockBroadcastChannel.instances = [];
  });

  it('hydrates from /api/gym/status on mount and persists the capacity', async () => {
    arrangeFetch();

    const { result } = renderHook(() => useOccupancy());

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.peopleCount).toBe(12);
    expect(result.current.capacity).toBe(45);
    expect(result.current.totalRegisteredMembers).toBe(40);
    expect(result.current.gymName).toBe('Iron Paradise');
    expect(window.localStorage.getItem('gymflow_capacity')).toBe('45');
    expect(result.current.checkedInUserIds).toEqual(['u1', 'u2']);

    // Derived metrics: 12/45 = 27% -> LOW
    expect(result.current.percentage).toBe(27);
    expect(result.current.status).toBe('LOW');
    expect(result.current.waitTime).toBe('0–5 min');
  });

  it('applies live occupancy_update frames from the SSE stream', async () => {
    arrangeFetch();

    const { result } = renderHook(() => useOccupancy());
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const es = MockEventSource.instances[0];

    act(() =>
      es.emit({
        type: 'occupancy_update',
        peopleCount: 33,
        capacity: 60,
        gymName: 'Pumped Palace',
        checkedInUserIds: ['a', 'b', 'c'],
        timestamp: '2026-08-24T10:00:00.000Z',
      })
    );

    expect(result.current.peopleCount).toBe(33);
    expect(result.current.capacity).toBe(60);
    expect(result.current.gymName).toBe('Pumped Palace');
    expect(result.current.checkedInUserIds).toEqual(['a', 'b', 'c']);
    expect(result.current.lastUpdated).toBe('2026-08-24T10:00:00.000Z');
    // Persisted for next session
    expect(window.localStorage.getItem('gymflow_capacity')).toBe('60');

    // HIGH at 33/60 = 55%? No -> MODERATE
    expect(result.current.status).toBe('MODERATE');
  });

  it('ignores keepalive comment lines on the stream', async () => {
    arrangeFetch();

    const { result } = renderHook(() => useOccupancy());
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    act(() => MockEventSource.instances[0].onmessage?.({ data: ': ping' }));
    act(() => MockEventSource.instances[0].onmessage?.({ data: '' }));

    expect(result.current.peopleCount).toBe(12); // unchanged
  });

  describe('toggleSelfCheckIn', () => {
    it('applies the server response on success', async () => {
      const fetchMock = arrangeFetch({
        status: { ...statusFixture, peopleCount: 12 },
        checkin: {
          success: true,
          isCheckedIn: true,
          peopleCount: 13,
          message: 'Welcome to the gym!',
        },
      });

      const { result } = renderHook(() => useOccupancy());
      await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

      let outcome: any;
      await act(async () => {
        outcome = await result.current.toggleSelfCheckIn();
      });

      expect(outcome).toMatchObject({ success: true, isCheckedIn: true });
      expect(result.current.isCheckedInSelf).toBe(true);
      expect(result.current.peopleCount).toBe(13);

      const [, init] = fetchMock.mock.calls.find(([u]) =>
        String(u).includes('/api/gym/checkin-toggle')
      )!;
      expect(init.method).toBe('POST');
    });

    it('falls back to an optimistic local toggle when offline', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
          if (String(url).includes('/api/gym/status')) {
            return { ok: true, json: async () => ({ success: true }) };
          }
          throw new TypeError('Failed to fetch'); // offline
        })
      );

      const { result } = renderHook(() => useOccupancy());
      await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
      expect(result.current.isCheckedInSelf).toBe(false);

      let outcome: any;
      await act(async () => {
        outcome = await result.current.toggleSelfCheckIn();
      });

      expect(outcome.success).toBe(true);
      expect(outcome.message).toContain('(Offline)');
      expect(result.current.isCheckedInSelf).toBe(true);
      // Default initialPeople=18 -> 19 after optimistic check-in
      expect(result.current.peopleCount).toBe(19);
    });

    it('optimistically toggles with a demo message when the server rejects auth', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
          if (String(url).includes('/api/gym/status')) {
            return { ok: true, json: async () => ({ success: true }) };
          }
          return {
            ok: false,
            status: 401,
            json: async () => ({ error: 'Authentication required to check in.' }),
          };
        })
      );

      const { result } = renderHook(() => useOccupancy());
      await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

      let outcome: any;
      await act(async () => {
        outcome = await result.current.toggleSelfCheckIn();
      });

      expect(outcome.isLocal).toBe(true);
      expect(outcome.message).toBe('Authentication required to check in.');
      expect(result.current.isCheckedInSelf).toBe(true);
    });
  });

  describe('updateCapacity', () => {
    it('clamps to the 10–2000 range and persists immediately', async () => {
      const fetchMock = arrangeFetch();

      const { result } = renderHook(() => useOccupancy());
      await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

      await act(async () => {
        await result.current.updateCapacity(3);
      });
      expect(result.current.capacity).toBe(10);
      expect(window.localStorage.getItem('gymflow_capacity')).toBe('10');

      await act(async () => {
        await result.current.updateCapacity(99999);
      });
      expect(result.current.capacity).toBe(2000);

      const putCalls = fetchMock.mock.calls.filter(([u]) =>
        String(u).includes('/api/admin/gym/capacity')
      );
      expect(JSON.parse(putCalls.at(-1)![1].body)).toEqual({
        capacity: 2000,
        gymName: undefined,
      });
    });

    it('adopts the authoritative settings returned by the admin endpoint', async () => {
      arrangeFetch({
        capacityUpdate: {
          success: true,
          settings: { capacity: 80, gymName: 'Renamed Gym' },
        },
      });

      const { result } = renderHook(() => useOccupancy());
      await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

      await act(async () => {
        await result.current.updateCapacity(80, ' Renamed Gym ');
      });

      expect(result.current.capacity).toBe(80);
      expect(result.current.gymName).toBe('Renamed Gym');
      expect(window.localStorage.getItem('gymflow_capacity')).toBe('80');
    });
  });

  describe('occupancy simulation controls', () => {
    it('setOccupants clamps values and reports the exact count to the backend', async () => {
      arrangeFetch({ status: { success: true } }); // keeps default capacity 30

      const { result } = renderHook(() => useOccupancy());
      await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

      act(() => result.current.setOccupants(500));
      expect(result.current.peopleCount).toBe(30);

      await waitFor(() => {
        expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
          expect.stringContaining('/api/gym/simulation-step'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ exactCount: 30 }),
          })
        );
      });
    });

    it('increment respects the ceiling and decrement respects zero', async () => {
      arrangeFetch({ status: { success: true } });

      const { result } = renderHook(() => useOccupancy());
      await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

      act(() => result.current.setOccupants(30));
      await waitFor(() => expect(result.current.peopleCount).toBe(30));
      act(() => result.current.increment());
      expect(result.current.peopleCount).toBe(30); // clamped

      act(() => result.current.setOccupants(0));
      await waitFor(() => expect(result.current.peopleCount).toBe(0));
      act(() => result.current.decrement());
      expect(result.current.peopleCount).toBe(0); // floored
    });
  });

  it('propagates cross-tab GYM_OCCUPANCY_SYNC payloads into state', async () => {
    arrangeFetch();

    const { result } = renderHook(() => useOccupancy());
    await waitFor(() => expect(MockBroadcastChannel.instances.length).toBeGreaterThanOrEqual(1));

    const listenerChannel = MockBroadcastChannel.instances[0];
    act(() =>
      listenerChannel.receive({
        type: 'GYM_OCCUPANCY_SYNC',
        payload: { peopleCount: 7, gymName: 'Synced Gym' },
      })
    );

    expect(result.current.peopleCount).toBe(7);
    expect(result.current.gymName).toBe('Synced Gym');
  });

  it('toggles the auto-simulator flag', async () => {
    arrangeFetch();

    const { result } = renderHook(() => useOccupancy());
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    act(() => result.current.toggleAutoSimulating());
    expect(result.current.isAutoSimulating).toBe(true);
    act(() => result.current.toggleAutoSimulating());
    expect(result.current.isAutoSimulating).toBe(false);
  });
});
