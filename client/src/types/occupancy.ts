export type OccupancyStatus = 'LOW' | 'MODERATE' | 'HIGH';

export interface OccupancyData {
  peopleCount: number;
  capacity: number;
  percentage: number;
  status: OccupancyStatus;
  waitTime: string;
  isAutoSimulating: boolean;
}

export interface HourlyPrediction {
  id: string;
  time: string;
  peopleCount: number;
  percentage: number;
  isHigh?: boolean;
  isHighest?: boolean;
}

export interface RecommendedTimeSlot {
  timeRange: string;
  expectedPeople: number;
  status: OccupancyStatus;
}

export interface VisitHistoryItem {
  id: string;
  date: string;
  timeRange: string;
  duration: string;
}
