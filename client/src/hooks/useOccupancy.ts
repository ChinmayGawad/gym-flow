import { useState, useEffect, useCallback, useRef } from 'react';
import { OccupancyData, OccupancyStatus, DEFAULT_CAPACITY } from '@/types/occupancy';
import { API_BASE } from '@/lib/api-config';

// BroadcastChannel for instant cross-tab live synchronization
const BROADCAST_CHANNEL_NAME = 'gymflow_realtime_sync';

export function useOccupancy(initialPeople = 18, initialCapacity = DEFAULT_CAPACITY) {
  const [capacity, setCapacity] = useState<number>(() => {
    const saved = localStorage.getItem('gymflow_capacity');
    return saved ? parseInt(saved, 10) : initialCapacity;
  });
  const [peopleCount, setPeopleCount] = useState<number>(initialPeople);
  const [totalRegisteredMembers, setTotalRegisteredMembers] = useState<number>(35);
  const [checkedInUserIds, setCheckedInUserIds] = useState<string[]>([]);
  const [isCheckedInSelf, setIsCheckedInSelf] = useState<boolean>(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [gymName, setGymName] = useState<string>('GymFlow Fitness');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toISOString());

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Broadcast state changes across browser tabs
  const broadcastSync = useCallback((payload: Partial<OccupancyData>) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'GYM_OCCUPANCY_SYNC',
          payload,
          timestamp: Date.now(),
        });
      }
    } catch {
      // BroadcastChannel not available in environment
    }
  }, []);

  // Fetch live gym status from backend
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gym/status`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.capacity) {
            setCapacity(data.capacity);
            localStorage.setItem('gymflow_capacity', String(data.capacity));
          }
          if (typeof data.peopleCount === 'number') {
            setPeopleCount(data.peopleCount);
          }
          if (typeof data.totalRegisteredMembers === 'number') {
            setTotalRegisteredMembers(data.totalRegisteredMembers);
          }
          if (typeof data.isCheckedInSelf === 'boolean') {
            setIsCheckedInSelf(data.isCheckedInSelf);
          }
          if (data.gymName) {
            setGymName(data.gymName);
          }
          if (Array.isArray(data.checkedInUserIds)) {
            setCheckedInUserIds(data.checkedInUserIds);
          }
          setLastUpdated(new Date().toISOString());
        }
      }
    } catch {
      // Offline fallback: graceful degradation
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // 1. Initial status fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 2. Real-Time Server-Sent Events (SSE) stream subscription
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    function connectSSE() {
      try {
        eventSource = new EventSource(`${API_BASE}/api/gym/live-stream`, {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          setIsLiveConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            if (!event.data || event.data.startsWith(':')) return; // Ignore keepalives
            const data = JSON.parse(event.data);
            if (data.type === 'occupancy_update') {
              if (typeof data.peopleCount === 'number') {
                setPeopleCount(data.peopleCount);
              }
              if (typeof data.capacity === 'number') {
                setCapacity(data.capacity);
                localStorage.setItem('gymflow_capacity', String(data.capacity));
              }
              if (typeof data.totalRegisteredMembers === 'number') {
                setTotalRegisteredMembers(data.totalRegisteredMembers);
              }
              if (Array.isArray(data.checkedInUserIds)) {
                setCheckedInUserIds(data.checkedInUserIds);
              }
              if (data.gymName) {
                setGymName(data.gymName);
              }
              setLastUpdated(data.timestamp || new Date().toISOString());
            }
          } catch (parseErr) {
            // Ignore parse errors on ping lines
          }
        };

        eventSource.onerror = () => {
          setIsLiveConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect with 4-second delay
          reconnectTimeout = setTimeout(connectSSE, 4000);
        };
      } catch {
        setIsLiveConnected(false);
      }
    }

    connectSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // 3. Multi-Tab Instant Sync with BroadcastChannel
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event) => {
          if (event.data && event.data.type === 'GYM_OCCUPANCY_SYNC') {
            const { payload } = event.data;
            if (typeof payload.peopleCount === 'number') setPeopleCount(payload.peopleCount);
            if (typeof payload.capacity === 'number') setCapacity(payload.capacity);
            if (typeof payload.totalRegisteredMembers === 'number') setTotalRegisteredMembers(payload.totalRegisteredMembers);
            if (typeof payload.isCheckedInSelf === 'boolean') setIsCheckedInSelf(payload.isCheckedInSelf);
            if (payload.gymName) setGymName(payload.gymName);
            if (Array.isArray(payload.checkedInUserIds)) setCheckedInUserIds(payload.checkedInUserIds);
            setLastUpdated(new Date().toISOString());
          }
        };

        return () => {
          channel.close();
          channelRef.current = null;
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }
  }, []);

  // 4. Adaptive Periodic Background Polling (Safety fallback every 4s)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchStatus();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [fetchStatus]);

  // 5. Visibility Change & Focus Sync (Immediate update when tab is activated)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus();
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus]);

  // Compute percentage, turnout, status, and wait times
  const effectiveCapacity = Math.max(1, capacity || DEFAULT_CAPACITY);
  const clampedPeople = Math.min(Math.max(0, peopleCount), effectiveCapacity);
  const percentage = Math.round((clampedPeople / effectiveCapacity) * 100);
  const turnoutPercentage =
    totalRegisteredMembers > 0
      ? Math.round((clampedPeople / totalRegisteredMembers) * 100)
      : 0;

  let status: OccupancyStatus = 'MODERATE';
  let waitTime = '10 min';

  if (percentage < 40) {
    status = 'LOW';
    waitTime = '0–5 min';
  } else if (percentage < 75) {
    status = 'MODERATE';
    waitTime = '10 min';
  } else {
    status = 'HIGH';
    waitTime = '15–25 min';
  }

  // Member self check-in / check-out toggle
  const toggleSelfCheckIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/gym/checkin-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsCheckedInSelf(data.isCheckedIn);
          if (typeof data.peopleCount === 'number') {
            setPeopleCount(data.peopleCount);
          }
          broadcastSync({
            isCheckedInSelf: data.isCheckedIn,
            peopleCount: data.peopleCount,
          });
          return { success: true, isCheckedIn: data.isCheckedIn, message: data.message };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        // If not logged in, optimistically toggle local state with feedback
        const nextState = !isCheckedInSelf;
        const nextCount = nextState ? Math.min(peopleCount + 1, effectiveCapacity) : Math.max(0, peopleCount - 1);
        setIsCheckedInSelf(nextState);
        setPeopleCount(nextCount);
        broadcastSync({
          isCheckedInSelf: nextState,
          peopleCount: nextCount,
        });
        return {
          success: true,
          isCheckedIn: nextState,
          message: errData.error || (nextState ? 'Checked in (Local Demo)' : 'Checked out (Local Demo)'),
          isLocal: true,
        };
      }
    } catch {
      // Local fallback
      const nextState = !isCheckedInSelf;
      const nextCount = nextState ? Math.min(peopleCount + 1, effectiveCapacity) : Math.max(0, peopleCount - 1);
      setIsCheckedInSelf(nextState);
      setPeopleCount(nextCount);
      broadcastSync({
        isCheckedInSelf: nextState,
        peopleCount: nextCount,
      });
      return { success: true, isCheckedIn: nextState, message: nextState ? 'Checked in (Offline)' : 'Checked out (Offline)' };
    } finally {
      setIsLoading(false);
    }
  }, [isCheckedInSelf, peopleCount, effectiveCapacity, broadcastSync]);

  // Gym Owner: update capacity
  const updateCapacity = useCallback(async (newCapacity: number, newGymName?: string) => {
    const validCapacity = Math.max(10, Math.min(2000, newCapacity));
    setCapacity(validCapacity);
    localStorage.setItem('gymflow_capacity', String(validCapacity));
    broadcastSync({ capacity: validCapacity, gymName: newGymName });

    try {
      const res = await fetch(`${API_BASE}/api/admin/gym/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ capacity: validCapacity, gymName: newGymName }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings?.capacity) {
          setCapacity(data.settings.capacity);
          if (data.settings.gymName) setGymName(data.settings.gymName);
          broadcastSync({
            capacity: data.settings.capacity,
            gymName: data.settings.gymName,
          });
        }
      }
    } catch {
      // Saved in localStorage as fallback
    }
  }, [broadcastSync]);

  const setOccupantsClamped = useCallback((count: number) => {
    const nextCount = Math.min(Math.max(0, count), effectiveCapacity);
    setPeopleCount(nextCount);
    broadcastSync({ peopleCount: nextCount });

    // Sync with backend simulation step if possible
    fetch(`${API_BASE}/api/gym/simulation-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ exactCount: nextCount }),
    }).catch(() => {});
  }, [effectiveCapacity, broadcastSync]);

  const increment = useCallback(() => {
    setPeopleCount((prev) => {
      const nextCount = Math.min(prev + 1, effectiveCapacity);
      broadcastSync({ peopleCount: nextCount });
      fetch(`${API_BASE}/api/gym/simulation-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ delta: 1 }),
      }).catch(() => {});
      return nextCount;
    });
  }, [effectiveCapacity, broadcastSync]);

  const decrement = useCallback(() => {
    setPeopleCount((prev) => {
      const nextCount = Math.max(prev - 1, 0);
      broadcastSync({ peopleCount: nextCount });
      fetch(`${API_BASE}/api/gym/simulation-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ delta: -1 }),
      }).catch(() => {});
      return nextCount;
    });
  }, [broadcastSync]);

  const toggleAutoSimulating = useCallback(() => {
    setIsAutoSimulating((prev) => !prev);
  }, []);

  // Automatic 4-second live simulation loop
  useEffect(() => {
    if (!isAutoSimulating) return;

    const interval = setInterval(() => {
      setPeopleCount((current) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const updated = Math.min(Math.max(0, current + change), effectiveCapacity);
        broadcastSync({ peopleCount: updated });

        // Trigger simulation step on backend
        fetch(`${API_BASE}/api/gym/simulation-step`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ delta: change }),
        }).catch(() => {});

        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoSimulating, effectiveCapacity, broadcastSync]);

  const data: OccupancyData = {
    peopleCount: clampedPeople,
    capacity: effectiveCapacity,
    totalRegisteredMembers,
    turnoutPercentage,
    percentage,
    status,
    waitTime,
    isCheckedInSelf,
    isAutoSimulating,
    gymName,
    isLiveConnected,
    checkedInUserIds,
    lastUpdated,
  };

  return {
    ...data,
    isLoading,
    isInitialLoading,
    refreshStatus: fetchStatus,
    toggleSelfCheckIn,
    updateCapacity,
    setOccupants: setOccupantsClamped,
    increment,
    decrement,
    toggleAutoSimulating,
  };
}

