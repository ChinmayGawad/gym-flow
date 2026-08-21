import { useState, useEffect, useCallback } from 'react';
import { OccupancyData, OccupancyStatus } from '@/types/occupancy';

const DEFAULT_CAPACITY = 60;
const INITIAL_PEOPLE = 42;

export function useOccupancy(initialPeople = INITIAL_PEOPLE, capacity = DEFAULT_CAPACITY) {
  const [peopleCount, setPeopleCount] = useState<number>(initialPeople);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(true);

  // Calculate status and wait time based on core architecture rules
  const percentage = Math.round((peopleCount / capacity) * 100);

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

  const setOccupantsClamped = useCallback((count: number) => {
    setPeopleCount(Math.min(Math.max(0, count), capacity));
  }, [capacity]);

  const increment = useCallback(() => {
    setPeopleCount((prev) => Math.min(prev + 1, capacity));
  }, [capacity]);

  const decrement = useCallback(() => {
    setPeopleCount((prev) => Math.max(prev - 1, 0));
  }, []);

  const toggleAutoSimulating = useCallback(() => {
    setIsAutoSimulating((prev) => !prev);
  }, []);

  // Automatic 5-second random simulation loop matching index.html script
  useEffect(() => {
    if (!isAutoSimulating) return;

    const interval = setInterval(() => {
      setPeopleCount((current) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const updated = current + change;
        return Math.min(Math.max(0, updated), capacity);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoSimulating, capacity]);

  const data: OccupancyData = {
    peopleCount,
    capacity,
    percentage,
    status,
    waitTime,
    isAutoSimulating,
  };

  return {
    ...data,
    setOccupants: setOccupantsClamped,
    increment,
    decrement,
    toggleAutoSimulating,
  };
}
