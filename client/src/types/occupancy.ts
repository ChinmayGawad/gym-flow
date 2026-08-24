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
  isLiveConnected?: boolean;
  checkedInUserIds?: string[];
  lastUpdated?: string;
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

export interface PlannedMemberSummary {
  id: string;
  name: string;
  image?: string | null;
  workoutFocus?: string | null;
}

export interface PlannedVisit {
  id: string;
  userId?: string;
  scheduledDate: string;
  timeSlot: string;
  hour24: number;
  workoutFocus?: string | null;
  notes?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HourlyForecastSlot {
  id: string;
  time: string;
  hour24: number;
  plannedCount: number;
  predictedCount: number;
  percentage: number;
  status: OccupancyStatus;
  waitTime: string;
  isHigh: boolean;
  isHighest: boolean;
  isOptimal: boolean;
  plannedMembers: PlannedMemberSummary[];
  hasUserBooked?: boolean;
  userVisitId?: string;
}

export interface ForecastResponse {
  success: boolean;
  date: string;
  capacity: number;
  totalPlannedVisits: number;
  optimalWindow: {
    timeRange: string;
    expectedPeople: number;
    plannedCount: number;
    status: OccupancyStatus;
  };
  forecast: HourlyForecastSlot[];
  userPlannedVisit?: PlannedVisit | null;
}

