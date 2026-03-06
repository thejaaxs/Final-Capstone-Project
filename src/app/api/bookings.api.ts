import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Booking, BookingCreateRequest } from '../shared/models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsApi {
  private readonly base = `${environment.apiBaseUrl}/bookings`;

  constructor(private http: HttpClient) {}

  create(payload: BookingCreateRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}`, payload);
  }

  getById(id: number): Observable<Booking> {
    return this.getBookingById(id);
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.base}/${id}`);
  }

  byCustomer(customerId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/customer/${customerId}`);
  }

  byDealer(dealerId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/dealer/${dealerId}`);
  }

  acceptBooking(id: number): Observable<string> {
    return this.http.put(`${this.base}/${id}/accept`, {}, { responseType: 'text' });
  }

  rejectBooking(id: number): Observable<string> {
    return this.http.put(`${this.base}/${id}/reject`, {}, { responseType: 'text' });
  }

  // Backward-compatible aliases for older screens.
  confirm(id: number): Observable<string> {
    return this.http.put(`${this.base}/confirm/${id}`, {}, { responseType: 'text' });
  }

  cancel(id: number): Observable<string> {
    return this.http.put(`${this.base}/cancel/${id}`, {}, { responseType: 'text' });
  }
}
