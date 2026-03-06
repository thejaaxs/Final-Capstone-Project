import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BookingsApi } from '../../api/bookings.service';
import {
  PaymentsApiService,
  VerifyPaymentResult,
  VerifyPaymentPayload
} from '../../api/payments.api';
import { CustomersApi } from '../../api/customers.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Booking } from '../../shared/models/booking.model';

declare var Razorpay: any;

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const MOCK_PAYMENT_SIGNATURE = 'mock_signature';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit, OnDestroy {
  bookingId = 0;
  customerId = 0;

  loading = false;
  loadingBooking = false;
  resolvingCustomer = false;
  errorMsg = '';
  successMsg = '';
  verifyResult: VerifyPaymentResult | null = null;
  redirectInSeconds = 0;
  booking?: Booking;

  private prefillEmail = '';
  private prefillContact = '';
  private redirectTimerId?: number;
  private redirectIntervalId?: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingsApi: BookingsApi,
    private paymentsApi: PaymentsApiService,
    private customersApi: CustomersApi,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('bookingId') || '0');
    this.customerId = Number(this.route.snapshot.queryParamMap.get('customerId') || '0');
    this.resolveBookingContext();
  }

  ngOnDestroy(): void {
    this.clearRedirectTimers();
  }

  get payButtonLabel(): string {
    if (this.loading) return 'Processing...';
    if (this.errorMsg) return 'Retry Payment';
    return 'Pay Now';
  }

  payNow() {
    this.errorMsg = '';
    this.successMsg = '';
    this.verifyResult = null;
    this.clearRedirectTimers();

    if (!this.bookingId) {
      this.errorMsg = 'Invalid booking id.';
      return;
    }
    if (this.loadingBooking) {
      this.errorMsg = 'Loading booking details. Please wait.';
      return;
    }
    if (this.isAlreadyPaid()) {
      this.errorMsg = 'This booking is already paid.';
      return;
    }
    if (this.isCancelledBooking()) {
      this.errorMsg = 'Cancelled bookings cannot be paid.';
      return;
    }
    if (!this.booking) {
      this.errorMsg = 'Unable to verify booking status. Please refresh and try again.';
      return;
    }
    if (!this.isBookingApproved()) {
      this.errorMsg = 'Booking not approved yet';
      this.toast.info(this.errorMsg);
      return;
    }
    if (!this.customerId) {
      this.errorMsg = 'Unable to resolve customer for this payment.';
      return;
    }
    if (this.loading) return;

    this.loading = true;
    this.paymentsApi.createOrder(this.bookingId, this.customerId).subscribe({
      next: (order) => {
        this.loading = false;

        if (order.mockMode) {
          if (!order.razorpayOrderId) {
            this.errorMsg = 'Invalid payment order received from server.';
            this.toast.error(this.errorMsg);
            return;
          }
          if (order.message) {
            this.toast.info(order.message);
          }
          this.verifyPayment(this.buildMockPaymentResponse(order.razorpayOrderId));
          return;
        }

        if (typeof Razorpay === 'undefined') {
          this.errorMsg = 'Razorpay checkout is unavailable.';
          this.toast.error(this.errorMsg);
          return;
        }

        const options: any = {
          key: order.keyId,
          amount: order.amountInPaise,
          currency: order.currency || 'INR',
          name: 'MotoMint',
          description: 'Booking Payment',
          order_id: order.razorpayOrderId,
          method: {
            card: true,
            upi: false,
            netbanking: false,
            wallet: false,
            emi: false
          },
          handler: (response: RazorpaySuccessResponse) => {
            this.verifyPayment(response);
          },
          modal: {
            ondismiss: () => {
              this.errorMsg = 'Payment cancelled.';
              this.toast.info('Payment cancelled.');
            }
          },
          prefill: this.buildPrefill(),
          theme: { color: '#1e3a8a' }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const message = this.extractBackendMessage(err, 'Failed to create payment order.');
        this.errorMsg = message;
        this.toast.error(message);
      }
    });
  }

  back() {
    this.router.navigateByUrl('/customer/bookings');
  }

  goToBookings() {
    this.clearRedirectTimers();
    this.router.navigateByUrl('/customer/bookings');
  }

  private verifyPayment(response: RazorpaySuccessResponse) {
    this.loading = true;
    const payload: VerifyPaymentPayload = {
      bookingId: this.bookingId,
      customerId: this.customerId,
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
    };

    this.paymentsApi.verifyPayment(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if ((res.status || '').toUpperCase() === 'SUCCESS') {
          this.verifyResult = res;
          this.successMsg = res.message || 'Payment successful.';
          this.toast.success(this.successMsg);
          this.startRedirectCountdown(2);
          return;
        }
        this.verifyResult = null;
        this.errorMsg = res.message || 'Payment failed.';
        this.toast.error(this.errorMsg);
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Payment verification failed. Do not retry immediately if amount debited; contact support.';
        this.toast.error(this.errorMsg);
      }
    });
  }

  private buildMockPaymentResponse(orderId: string): RazorpaySuccessResponse {
    return {
      razorpay_order_id: orderId,
      razorpay_payment_id: `mock_payment_${this.bookingId}_${Date.now()}`,
      razorpay_signature: MOCK_PAYMENT_SIGNATURE,
    };
  }

  private resolveCustomer() {
    const email = (this.auth.getEmail() || '').toLowerCase();
    if (!email) return;

    this.resolvingCustomer = true;
    this.customersApi.list().subscribe({
      next: (rows) => {
        const matched = rows.find((c) => c.email?.toLowerCase() === email);
        if (!matched?.customerId) return;
        this.customerId = matched.customerId;
        this.prefillEmail = matched.email || '';
        this.prefillContact = matched.contactNumber || '';
      },
      error: () => {},
      complete: () => {
        this.resolvingCustomer = false;
      }
    });
  }

  private resolveBookingContext() {
    if (!this.bookingId || Number.isNaN(this.bookingId)) {
      this.errorMsg = 'Invalid booking id.';
      return;
    }

    this.loadingBooking = true;
    this.bookingsApi.getById(this.bookingId).subscribe({
      next: (booking) => {
        this.booking = booking;
        if (booking?.customerId) {
          this.customerId = booking.customerId;
        }
        if (this.isAlreadyPaid()) {
          this.successMsg = 'This booking is already paid.';
        }
        if (this.isCancelledBooking()) {
          this.errorMsg = 'Cancelled bookings cannot be paid.';
        }
      },
      error: () => {
        // Fallback to route/query + logged-in profile resolution.
      },
      complete: () => {
        this.loadingBooking = false;
        if (!this.customerId) {
          this.resolveCustomer();
          return;
        }
        this.resolvePrefillForKnownCustomer(this.customerId);
      }
    });
  }

  private resolvePrefillForKnownCustomer(customerId: number) {
    this.customersApi.get(customerId).subscribe({
      next: (customer) => {
        this.prefillEmail = customer.email || '';
        this.prefillContact = customer.contactNumber || '';
      },
      error: () => {}
    });
  }

  private buildPrefill(): { email?: string; contact?: string } {
    const email = this.prefillEmail || this.auth.getEmail() || '';
    const digits = this.prefillContact.replace(/\D/g, '');
    const prefill: { email?: string; contact?: string } = {};
    if (email) prefill.email = email;
    if (digits) prefill.contact = digits;
    return prefill;
  }

  private extractBackendMessage(err: HttpErrorResponse, fallback: string): string {
    if ([502, 503, 504].includes(err.status)) {
      return 'Payment service is temporarily unavailable (503). Please retry in a few seconds.';
    }
    const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
    return backendMessage || fallback;
  }

  private startRedirectCountdown(seconds: number) {
    this.clearRedirectTimers();
    this.redirectInSeconds = seconds;

    this.redirectIntervalId = window.setInterval(() => {
      this.redirectInSeconds = Math.max(this.redirectInSeconds - 1, 0);
    }, 1000);

    this.redirectTimerId = window.setTimeout(() => {
      this.goToBookings();
    }, seconds * 1000);
  }

  private clearRedirectTimers() {
    if (this.redirectTimerId !== undefined) {
      window.clearTimeout(this.redirectTimerId);
      this.redirectTimerId = undefined;
    }
    if (this.redirectIntervalId !== undefined) {
      window.clearInterval(this.redirectIntervalId);
      this.redirectIntervalId = undefined;
    }
    this.redirectInSeconds = 0;
  }

  private isAlreadyPaid(): boolean {
    return (this.booking?.paymentStatus || '').toUpperCase() === 'PAID';
  }

  private isCancelledBooking(): boolean {
    return (this.booking?.bookingStatus || '').toUpperCase() === 'CANCELLED';
  }

  private isBookingApproved(): boolean {
    return (this.booking?.bookingStatus || '').toUpperCase() === 'ACCEPTED';
  }
}
