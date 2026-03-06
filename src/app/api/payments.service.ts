import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CreateOrderReq {
  bookingId: number;
  customerId: number;
}
export interface CreateOrderRes {
  keyId: string;
  currency: string;
  amountInPaise: number;
  razorpayOrderId: string;
  mockMode?: boolean;
  message?: string;
  bookingId: number;
  customerId: number;
}

export interface VerifyReq {
  bookingId: number;
  customerId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}
export interface VerifyRes {
  status: 'SUCCESS' | 'FAILED';
  message: string;
  bookingId: number;
  transactionId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private base = `${environment.apiBaseUrl}/payments`;

  constructor(private http: HttpClient) {}

  createOrder(req: CreateOrderReq) {
    return this.http.post<CreateOrderRes>(`${this.base}/create-order`, req);
  }

  verify(req: VerifyReq) {
    return this.http.post<VerifyRes>(`${this.base}/verify`, req);
  }
}
