import type { TripIntentPayload, TripPlan } from "@/lib/types/plan";

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

export interface TripPlanRequestBody {
  intent: TripIntentPayload;
  options?: {
    preferCached?: boolean;
  };
}

export interface TripPlanResponse {
  plan: TripPlan;
  fromCache?: boolean;
  provider?: "dashscope" | "mock";
}

export interface SpeechRecognitionResponse {
  transcript: string;
  confidence?: number;
  provider?: "aliyun" | "mock";
}

export interface TripIntentParseRequest {
  transcript: string;
}

export interface TripIntentParseResponse {
  intent: TripIntentPayload;
  provider?: "dashscope" | "heuristic";
  message?: string;
}
