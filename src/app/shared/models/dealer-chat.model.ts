export interface ChatSession {
  step: number;
  budget: number;
  dailyKm: number;
  rideType: string | null;
  mileage: number;
}

export interface RecommendationRequest {
  message: string;
  session: ChatSession | null;
}

export interface VehicleRecommendation {
  id: number;
  name: string;
  brand: string;
  price: number;
  dealerId: number;
  status: string;
  imageUrl: string;
  mileage: number;
  rideType: string;
  suitableDailyKm: number;
}

export interface ChatResponse {
  message: string;
  session: ChatSession;
  recommendations: VehicleRecommendation[] | null;
}
