export type TravelTheme =
  | "culinary"
  | "family"
  | "culture"
  | "nature"
  | "adventure"
  | "relaxation"
  | "shopping"
  | "nightlife";

export interface TravelerProfile {
  adults: number;
  children: number;
  seniors?: number;
}

export interface TripPreferences {
  themes: TravelTheme[];
  mustSee?: string[];
  dietaryNotes?: string;
  pace?: "relaxed" | "balanced" | "intensive";
  specialRequests?: string;
}

export interface BudgetEstimate {
  currency: string;
  total: number;
  transportation: number;
  lodging: number;
  activities: number;
  dining: number;
  contingency: number;
}

export interface DailyScheduleItem {
  title: string;
  description: string;
  startTime?: string;
  endTime?: string;
  location?: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  estimatedCost?: number;
  tags?: string[];
}

export interface DayPlan {
  date: string;
  summary: string;
  items: DailyScheduleItem[];
}

export interface TripPlan {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelerProfile: TravelerProfile;
  preferences: TripPreferences;
  highlights: string[];
  itinerary: DayPlan[];
  budget: BudgetEstimate;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  tripId: string;
  category: "transportation" | "lodging" | "dining" | "activities" | "shopping" | "misc";
  description: string;
  amount: number;
  currency: string;
  incurredAt: string;
  createdAt: string;
}

export interface TripIntentPayload {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  travelers: TravelerProfile;
  preferences: TripPreferences;
  notes?: string;
}
