import { useState, useEffect, useCallback, useRef } from 'react';
import { ForecastResponse, HourlyForecastSlot, PlannedVisit } from '@/types/occupancy';
import { API_BASE } from '@/lib/api-config';

interface UseForecastOptions {
  date?: string;
  enabled?: boolean;
}

export function useForecast({ date, enabled = true }: UseForecastOptions = {}) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => date || new Date().toISOString().split('T')[0]
  );
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Update selected date if prop changes
  useEffect(() => {
    if (date && date !== selectedDate) {
      setSelectedDate(date);
    }
  }, [date, selectedDate]);

  const fetchForecast = useCallback(async (targetDate: string, silent = false) => {
    if (!enabled) return;
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/gym/forecast?date=${targetDate}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data: ForecastResponse = await res.json();
        if (data.success) {
          setForecastData(data);
        }
      } else {
        setError('Failed to load forecast data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching crowd forecast.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [enabled]);

  // Initial and date-change fetch
  useEffect(() => {
    fetchForecast(selectedDate);
  }, [fetchForecast, selectedDate]);

  // SSE Live-Stream Listener for Real-Time Forecast Updates
  useEffect(() => {
    if (!enabled) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connectSSE() {
      try {
        const es = new EventSource(`${API_BASE}/api/gym/live-stream`, {
          withCredentials: true,
        });
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsLiveStreamActive(true);
        };

        es.onmessage = (event) => {
          try {
            if (!event.data || event.data.startsWith(':')) return;
            const data = JSON.parse(event.data);
            if (data.type === 'forecast_update' && data.forecast) {
              setForecastData((prev) => ({
                ...prev,
                ...data,
                // Preserve userPlannedVisit because the broadcast is global and has userPlannedVisit=null
                userPlannedVisit: prev?.userPlannedVisit || null,
              }));
            }
          } catch {
            // Keepalive ping parse ignored
          }
        };

        es.onerror = () => {
          setIsLiveStreamActive(false);
          if (es) {
            es.close();
            eventSourceRef.current = null;
          }
          reconnectTimer = setTimeout(connectSSE, 5000);
        };
      } catch {
        setIsLiveStreamActive(false);
      }
    }

    connectSSE();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled]);

  // Cross-tab broadcast listener
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('gymflow_realtime_sync');
      bc.onmessage = (event) => {
        if (
          event.data?.type === 'GYM_VISIT_PLANNED' ||
          event.data?.type === 'GYM_VISIT_CANCELLED' ||
          event.data?.type === 'GYM_OCCUPANCY_SYNC'
        ) {
          fetchForecast(selectedDate, true);
        }
      };
      return () => {
        bc.close();
      };
    } catch {
      // BroadcastChannel unsupported
    }
  }, [fetchForecast, selectedDate]);

  // Actions: Book Slot & Cancel Slot
  const cancelSlot = useCallback(async (visitId: string) => {
    // Optimistically clear userPlannedVisit
    setForecastData((prev) => (prev ? { ...prev, userPlannedVisit: null } : null));

    try {
      const res = await fetch(`${API_BASE}/api/gym/planned-visits/${visitId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        await fetchForecast(selectedDate, true);
        try {
          const bc = new BroadcastChannel('gymflow_realtime_sync');
          bc.postMessage({ type: 'GYM_VISIT_CANCELLED', visitId });
          bc.close();
        } catch {}
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchForecast, selectedDate]);

  const rawSlots: HourlyForecastSlot[] = forecastData?.forecast || [];
  const userPlannedVisit: PlannedVisit | null = forecastData?.userPlannedVisit || null;
  const optimalWindow = forecastData?.optimalWindow || {
    timeRange: '10:00 AM – 11:30 AM',
    expectedPeople: 6,
    status: 'LOW',
  };

  return {
    selectedDate,
    setSelectedDate,
    forecast: rawSlots,
    userPlannedVisit,
    optimalWindow,
    totalPlannedVisits: forecastData?.totalPlannedVisits || 0,
    capacity: forecastData?.capacity || 30,
    isLoading,
    isLiveStreamActive,
    error,
    refetch: () => fetchForecast(selectedDate),
    cancelSlot,
  };
}
