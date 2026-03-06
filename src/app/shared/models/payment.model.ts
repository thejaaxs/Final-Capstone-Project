export interface Payment {
  id?: number;
  bookingId: number;
  customerId: number;
  amount: number;
  paymentMethod?: 'CARD' | 'UPI' | string;
  paymentStatus?: 'SUCCESS' | 'FAILED' | string;
  transactionId?: string;
  paymentDate?: string;
  message?: string;
}

export interface CreateRazorpayOrderRequest {
  bookingId: number;
  customerId: number;
  amount: number;
  paymentMethod: 'CARD' | 'UPI';
}

export interface CreateRazorpayOrderResponse {
  orderId?: string;
  razorpayOrderId?: string;
  key?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
}

export interface VerifyPaymentRequest {
  bookingId: number;
  customerId: number;
  amount: number;
  paymentMethod: 'CARD' | 'UPI';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  orderId?: string;
  paymentId?: string;
  signature?: string;
}

export interface VerifyPaymentResponse extends Payment {
  verified?: boolean;
}
