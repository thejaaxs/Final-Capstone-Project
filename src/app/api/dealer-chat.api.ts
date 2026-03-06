import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../core/interceptors/error.interceptor';
import { ChatResponse, RecommendationRequest, VehicleRecommendation } from '../shared/models/dealer-chat.model';

@Injectable({ providedIn: 'root' })
export class DealerChatApi {
  private readonly base = `${environment.apiBaseUrl}/dealer-chat`;
  private readonly silentContext = new HttpContext().set(SKIP_GLOBAL_ERROR_HANDLING, true);

  constructor(private http: HttpClient) {}

  sendMessage(payload: RecommendationRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/message`, payload, { context: this.silentContext }).pipe(
      map((response) => ({
        ...response,
        recommendations: response.recommendations?.map((vehicle) => this.normalizeRecommendation(vehicle)) ?? null,
      }))
    );
  }

  private normalizeRecommendation(vehicle: VehicleRecommendation): VehicleRecommendation {
    if (!vehicle?.imageUrl) return vehicle;
    if (vehicle.imageUrl.startsWith('http://') || vehicle.imageUrl.startsWith('https://') || vehicle.imageUrl.startsWith('/api')) {
      return vehicle;
    }
    const prefix = vehicle.imageUrl.startsWith('/') ? '' : '/';
    return { ...vehicle, imageUrl: `${environment.apiBaseUrl}${prefix}${vehicle.imageUrl}` };
  }
}
