import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';

export interface CreatePaymentOrderResponse {
  keyId: string;
  currency: string;
  amountInPaise: number;
  razorpayOrderId: string;
  mockMode?: boolean;
  message?: string;
  bookingId: number;
  customerId: number;
}

export interface VerifyPaymentPayload {
  bookingId: number;
  customerId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResult {
  status: 'SUCCESS' | 'FAILED' | string;
  message: string;
  bookingId: number;
  transactionId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly base = `${environment.apiBaseUrl}/payments`;

  constructor(private http: HttpClient) {}

  createOrder(bookingId: number, customerId: number): Observable<CreatePaymentOrderResponse> {
    return this.http.post<CreatePaymentOrderResponse>(`${this.base}/create-order`, { bookingId, customerId }).pipe(
      retry({
        count: 2,
        delay: (error) => {
          const status = Number(error?.status || 0);
          if ([502, 503, 504].includes(status)) {
            return timer(700);
          }
          return throwError(() => error);
        }
      })
    );
  }

  verifyPayment(payload: VerifyPaymentPayload): Observable<VerifyPaymentResult> {
    return this.http.post<VerifyPaymentResult>(`${this.base}/verify`, payload);
  }
}
