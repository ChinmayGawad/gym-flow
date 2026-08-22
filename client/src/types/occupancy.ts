export type OccupancyStatus = 'LOW' | 'MODERATE' | 'HIGH';

export const DEFAULT_CAPACITY = 30;

export interface OccupancyData {
  peopleCount: number;
  capacity: number;
  totalRegisteredMembers: number;
  turnoutPercentage: number;
  percentage: number;
  status: OccupancyStatus;
  waitTime: string;
  isCheckedInSelf: boolean;
  isAutoSimulating: boolean;
  gymName?: string;
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
