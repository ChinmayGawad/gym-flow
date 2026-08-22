import { useState, useEffect, useCallback } from 'react';
import { OccupancyData, OccupancyStatus, DEFAULT_CAPACITY } from '@/types/occupancy';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function useOccupancy(initialPeople = 18, initialCapacity = DEFAULT_CAPACITY) {
  const [capacity, setCapacity] = useState<number>(() => {
    const saved = localStorage.getItem('gymflow_capacity');
    return saved ? parseInt(saved, 10) : initialCapacity;
  });
  const [peopleCount, setPeopleCount] = useState<number>(initialPeople);
  const [totalRegisteredMembers, setTotalRegisteredMembers] = useState<number>(35);
  const [isCheckedInSelf, setIsCheckedInSelf] = useState<boolean>(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [gymName, setGymName] = useState<string>('GymFlow Fitness');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

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
        }
      }
    } catch {
      // Offline fallback: graceful degradation
    } finally {
      setIsInitialLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchStatus();
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
          return { success: true, isCheckedIn: data.isCheckedIn, message: data.message };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        // If not logged in, optimistically toggle local state with feedback
        const nextState = !isCheckedInSelf;
        setIsCheckedInSelf(nextState);
        setPeopleCount((prev) => (nextState ? Math.min(prev + 1, effectiveCapacity) : Math.max(0, prev - 1)));
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
      setIsCheckedInSelf(nextState);
      setPeopleCount((prev) => (nextState ? Math.min(prev + 1, effectiveCapacity) : Math.max(0, prev - 1)));
      return { success: true, isCheckedIn: nextState, message: nextState ? 'Checked in (Offline)' : 'Checked out (Offline)' };
    } finally {
      setIsLoading(false);
    }
  }, [isCheckedInSelf, effectiveCapacity]);

  // Gym Owner: update capacity
  const updateCapacity = useCallback(async (newCapacity: number, newGymName?: string) => {
    const validCapacity = Math.max(10, Math.min(2000, newCapacity));
    setCapacity(validCapacity);
    localStorage.setItem('gymflow_capacity', String(validCapacity));

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
        }
      }
    } catch {
      // Saved in localStorage as fallback
    }
  }, []);

  const setOccupantsClamped = useCallback((count: number) => {
    setPeopleCount(Math.min(Math.max(0, count), effectiveCapacity));
  }, [effectiveCapacity]);

  const increment = useCallback(() => {
    setPeopleCount((prev) => Math.min(prev + 1, effectiveCapacity));
  }, [effectiveCapacity]);

  const decrement = useCallback(() => {
    setPeopleCount((prev) => Math.max(prev - 1, 0));
  }, []);

  const toggleAutoSimulating = useCallback(() => {
    setIsAutoSimulating((prev) => !prev);
  }, []);

  // Automatic 5-second simulation loop
  useEffect(() => {
    if (!isAutoSimulating) return;

    const interval = setInterval(() => {
      setPeopleCount((current) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const updated = current + change;
        return Math.min(Math.max(0, updated), effectiveCapacity);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoSimulating, effectiveCapacity]);

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

