import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { BookingsApi } from '../../../api/bookings.service';
import { CustomersApi } from '../../../api/customers.service';
import { DealersApi } from '../../../api/dealers.service';
import { VehiclesApi } from '../../../api/vehicles.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Booking } from '../../../shared/models/booking.model';
import { Vehicle } from '../../../shared/models/vehicle.model';
import { EmiCalculatorComponent } from '../../../shared/components/emi-calculator/emi-calculator.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent, EmiCalculatorComponent],
  template: `
    <section class="page-card vehicle-details-page">
      <div class="state-card" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading vehicle details...</p>
      </div>

      <div class="state-card error" *ngIf="!loading && errorMessage">
        <p>{{ errorMessage }}</p>
        <button type="button" (click)="load()">Retry</button>
      </div>

      <article class="details-card" *ngIf="!loading && !errorMessage && vehicle">
        <img [src]="vehicle.imageUrl || placeholderImage" [alt]="vehicle.name" class="vehicle-image" />

        <div class="content">
          <h2>{{ vehicle.name }}</h2>
          <p class="muted">{{ vehicle.brand }}</p>
          <div class="price-row">
            <p class="price">INR {{ vehicle.price | number: '1.0-0' }}</p>
            <button type="button" class="btn btn-ghost emi-trigger" (click)="openEmiCalculator()">
              Calculate EMI
            </button>
          </div>
          <app-badge [value]="formatVehicleStatus(vehicle.status)"></app-badge>
          <p class="meta">Dealer: {{ dealerName || ('Dealer #' + vehicle.dealerId) }}</p>

          <div class="actions">
            <button type="button" class="btn" (click)="bookVehicle()">Book Now</button>
            <button type="button" class="btn btn-ghost" (click)="addFavorite()">Add Favorite</button>
            <button type="button" class="btn btn-ghost" (click)="addReview()">Write Review</button>
            <a routerLink="/customer/vehicles"><button type="button" class="btn btn-ghost">Back</button></a>
          </div>

          <section class="payment-next-step" *ngIf="createdBooking as booking">
            <h3>{{ isCreatedBookingAccepted() ? 'Booking approved. Complete payment to confirm.' : 'Booking request submitted.' }}</h3>
            <p><span>Booking ID</span><b>#{{ booking.id || '-' }}</b></p>
            <p><span>Amount</span><b>INR {{ (booking.amount ?? vehicle.price) | number: '1.0-0' }}</b></p>
            <p><span>Booking Status</span><b>{{ normalizeBookingStatus(booking.bookingStatus) }}</b></p>
            <p><span>Payment Status</span><b>{{ normalizePaymentStatus(booking.paymentStatus) }}</b></p>
            <p class="approval-note" *ngIf="isCreatedBookingWaiting()">Waiting for dealer approval...</p>
            <p class="approval-note approval-ok" *ngIf="isCreatedBookingAccepted()">Approved! You can pay now.</p>
            <p class="approval-note approval-bad" *ngIf="isCreatedBookingRejected()">Dealer rejected booking.</p>
            <button
              type="button"
              class="btn"
              [disabled]="!booking.id || !canPayCreatedBooking()"
              [title]="payButtonHint()"
              (click)="goToPayment()"
            >
              Pay Now (Card)
            </button>
          </section>
        </div>
      </article>

      <div class="confirm-overlay" *ngIf="confirmBookingOpen">
        <section class="confirm-modal" role="dialog" aria-modal="true" aria-label="Confirm booking">
          <h3>Confirm booking for {{ vehicle?.name }}?</h3>
          <p class="summary-line"><span>Price</span><b>INR {{ vehicle?.price | number: '1.0-0' }}</b></p>
          <p class="summary-line"><span>Dealer</span><b>{{ dealerName || ('Dealer #' + vehicle?.dealerId) }}</b></p>
          <p class="summary-text">This will create your booking request and open card payment in the next step.</p>
          <button type="button" class="emi-link" (click)="openEmiCalculator()">View EMI</button>
          <p class="error-text" *ngIf="bookingConfirmError">{{ bookingConfirmError }}</p>

          <div class="confirm-actions">
            <button type="button" class="btn btn-ghost" [disabled]="creatingBooking" (click)="cancelBookingConfirm()">Cancel</button>
            <button type="button" class="btn" [disabled]="creatingBooking || resolvingCustomer" (click)="confirmBooking()">
              {{ creatingBooking ? 'Creating...' : 'Confirm Booking' }}
            </button>
          </div>
        </section>
      </div>

      <app-emi-calculator
        [open]="emiModalOpen"
        [price]="vehicle?.price ?? null"
        (close)="closeEmiCalculator()"
      ></app-emi-calculator>
    </section>
  `,
  styles: [`
    .vehicle-details-page {
      display: grid;
      gap: 0.9rem;
    }

    .details-card {
      background: #fff;
      border: 1px solid var(--mm-border);
      border-radius: 16px;
      box-shadow: var(--mm-shadow-md);
      overflow: hidden;
      display: grid;
      grid-template-columns: minmax(260px, 460px) 1fr;
    }

    .vehicle-image {
      width: 100%;
      height: 100%;
      min-height: 280px;
      object-fit: cover;
      background: #edf3ff;
    }

    .content {
      padding: 1rem;
    }

    .muted {
      margin: 0 0 0.55rem;
      color: #5c7290;
    }

    .price {
      margin: 0 0 0.35rem;
      font-size: 1.4rem;
      font-weight: 700;
      color: #103050;
    }

    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .emi-trigger {
      padding: 0.4rem 0.68rem;
    }

    .meta {
      margin: 0 0 0.8rem;
      color: #58718d;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .payment-next-step {
      margin-top: 1rem;
      border: 1px solid #d6e3fb;
      background: #f4f8ff;
      border-radius: 12px;
      padding: 0.8rem;
      display: grid;
      gap: 0.45rem;
    }

    .payment-next-step h3 {
      margin: 0;
      font-size: 1.02rem;
      color: #143d68;
    }

    .payment-next-step p {
      margin: 0;
      display: flex;
      justify-content: space-between;
      gap: 0.6rem;
      color: #284c77;
    }

    .payment-next-step p span {
      color: #577396;
    }

    .approval-note {
      margin: 0;
      font-weight: 700;
      color: #946200;
    }

    .approval-ok {
      color: #1d4ed8;
    }

    .approval-bad {
      color: #b91c1c;
    }

    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(14, 27, 47, 0.6);
      display: grid;
      place-items: center;
      padding: 1rem;
      z-index: 5500;
    }

    .confirm-modal {
      width: min(100%, 520px);
      background: #fff;
      border-radius: 16px;
      border: 1px solid #dbe3f3;
      box-shadow: 0 18px 40px rgba(18, 42, 78, 0.3);
      padding: 1rem;
    }

    .confirm-modal h3 {
      margin: 0 0 0.65rem;
    }

    .summary-line {
      margin: 0.35rem 0;
      display: flex;
      justify-content: space-between;
      gap: 0.55rem;
      color: #24486f;
    }

    .summary-line span {
      color: #597392;
    }

    .summary-text {
      margin: 0.55rem 0 0;
      color: #4c6789;
    }

    .emi-link {
      margin-top: 0.55rem;
      align-self: flex-start;
      border: 0;
      background: transparent;
      color: var(--mm-primary-600);
      padding: 0;
      text-decoration: underline;
      font-size: 0.86rem;
      font-weight: 700;
      cursor: pointer;
    }

    .error-text {
      margin: 0.55rem 0 0;
      color: #b91c1c;
      font-weight: 600;
    }

    .confirm-actions {
      margin-top: 0.95rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    @media (max-width: 840px) {
      .details-card {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VehicleDetailsComponent implements OnInit, OnDestroy {
  vehicle?: Vehicle;
  dealerName = '';
  loading = false;
  errorMessage = '';
  placeholderImage = 'https://placehold.co/900x540/e5edf7/36597f?text=MotoMint';
  confirmBookingOpen = false;
  creatingBooking = false;
  bookingConfirmError = '';
  createdBooking?: Booking;
  resolvingCustomer = false;
  emiModalOpen = false;
  private bookingStatusPollSub?: Subscription;
  private approvalToastShown = false;
  private rejectionToastShown = false;

  private vehicleId = 0;
  private customerId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingsApi: BookingsApi,
    private customersApi: CustomersApi,
    private dealersApi: DealersApi,
    private vehiclesApi: VehiclesApi,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.vehicleId = Number(this.route.snapshot.paramMap.get('id'));
    this.resolveCustomerId();
    this.load();
  }

  ngOnDestroy() {
    this.stopBookingStatusPolling();
  }

  load() {
    if (!this.vehicleId || Number.isNaN(this.vehicleId)) {
      this.errorMessage = 'Invalid vehicle id.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.vehiclesApi.getById(this.vehicleId).subscribe({
      next: (res) => {
        this.vehicle = res;
        this.resolveDealerName(res.dealerId);
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Failed to load vehicle details.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  bookVehicle() {
    if (!this.vehicle?.id) return;
    this.bookingConfirmError = '';
    this.confirmBookingOpen = true;
  }

  cancelBookingConfirm() {
    if (this.creatingBooking) return;
    this.confirmBookingOpen = false;
    this.bookingConfirmError = '';
  }

  confirmBooking() {
    if (!this.vehicle?.id) return;
    if (!this.customerId) {
      this.bookingConfirmError = 'Unable to resolve your customer profile. Please re-login and try again.';
      return;
    }
    if (this.creatingBooking) return;

    this.creatingBooking = true;
    this.bookingConfirmError = '';
    this.bookingsApi.create({
      customerId: this.customerId,
      dealerId: this.vehicle.dealerId,
      vehicleId: this.vehicle.id,
      amount: this.vehicle.price
    }).subscribe({
      next: (booking) => {
        this.createdBooking = this.withNormalizedBookingStates(booking);
        this.confirmBookingOpen = false;
        this.toast.info('Booking request submitted. Waiting for dealer approval.');
        if (this.createdBooking.id) {
          this.startBookingStatusPolling(this.createdBooking.id);
        }
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.bookingConfirmError = msg || 'Failed to create booking.';
      },
      complete: () => {
        this.creatingBooking = false;
      }
    });
  }

  goToPayment() {
    if (!this.createdBooking?.id) return;
    const status = this.getCreatedBookingStatus();
    if (status !== 'ACCEPTED') {
      this.toast.error('Booking not approved yet');
      return;
    }
    this.router.navigate(['/customer/pay', this.createdBooking.id], {
      queryParams: { customerId: this.createdBooking.customerId || this.customerId }
    });
  }

  addFavorite() {
    if (!this.vehicle) return;
    this.router.navigate(['/customer/favorites/create'], {
      queryParams: {
        dealerId: this.vehicle.dealerId,
        dealerName: this.dealerName || `Dealer #${this.vehicle.dealerId}`,
        productName: this.vehicle.name
      }
    });
  }

  addReview() {
    if (!this.vehicle) return;
    this.toast.info('Share your experience after booking.');
    this.router.navigate(['/customer/reviews/create'], {
      queryParams: {
        productName: this.vehicle.name
      }
    });
  }

  openEmiCalculator() {
    this.emiModalOpen = true;
  }

  closeEmiCalculator() {
    this.emiModalOpen = false;
  }

  canPayCreatedBooking(): boolean {
    const status = this.getCreatedBookingStatus();
    if (status !== 'ACCEPTED') return false;
    return this.getCreatedPaymentStatus() !== 'PAID';
  }

  payButtonHint(): string {
    const status = this.getCreatedBookingStatus();
    if (status === 'REJECTED') return 'Dealer rejected this booking';
    if (status !== 'ACCEPTED') return 'Waiting for dealer approval';
    return 'Proceed to payment';
  }

  isCreatedBookingWaiting(): boolean {
    return this.getCreatedBookingStatus() === 'REQUESTED';
  }

  isCreatedBookingAccepted(): boolean {
    return this.getCreatedBookingStatus() === 'ACCEPTED';
  }

  isCreatedBookingRejected(): boolean {
    return this.getCreatedBookingStatus() === 'REJECTED';
  }

  normalizeBookingStatus(status?: string): 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED' | 'CANCELLED' {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'ACCEPTED') return 'ACCEPTED';
    if (normalized === 'REJECTED') return 'REJECTED';
    if (normalized === 'CONFIRMED') return 'CONFIRMED';
    if (normalized === 'CANCELLED') return 'CANCELLED';
    if (normalized === 'PENDING') return 'REQUESTED';
    return 'REQUESTED';
  }

  normalizePaymentStatus(status?: string): 'PAID' | 'UNPAID' {
    return (status || '').toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID';
  }

  private resolveDealerName(dealerId: number) {
    this.dealerName = '';
    this.dealersApi.get(dealerId).subscribe({
      next: (dealer) => {
        this.dealerName = dealer.dealerName || '';
      },
      error: () => {
        this.dealerName = '';
      }
    });
  }

  private resolveCustomerId() {
    const email = (this.auth.getEmail() || '').toLowerCase();
    if (!email) return;

    this.resolvingCustomer = true;
    this.customersApi.list().subscribe({
      next: (customers) => {
        const matched = customers.find((c) => c.email?.toLowerCase() === email);
        if (matched?.customerId) {
          this.customerId = matched.customerId;
        }
      },
      error: () => {
        this.customerId = 0;
      },
      complete: () => {
        this.resolvingCustomer = false;
      }
    });
  }

  formatVehicleStatus(status?: string): 'AVAILABLE' | 'OUT_OF_STOCK' {
    return this.normalizeStatus(status);
  }

  private normalizeStatus(status?: string): 'AVAILABLE' | 'OUT_OF_STOCK' {
    return (status || '').toUpperCase() === 'AVAILABLE' ? 'AVAILABLE' : 'OUT_OF_STOCK';
  }

  private getCreatedBookingStatus(): 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED' | 'CANCELLED' {
    return this.normalizeBookingStatus(this.createdBooking?.bookingStatus);
  }

  private getCreatedPaymentStatus(): 'PAID' | 'UNPAID' {
    return this.normalizePaymentStatus(this.createdBooking?.paymentStatus);
  }

  private startBookingStatusPolling(bookingId: number): void {
    this.stopBookingStatusPolling();
    this.approvalToastShown = false;
    this.rejectionToastShown = false;

    this.bookingStatusPollSub = interval(7000).pipe(
      startWith(0),
      switchMap(() => this.bookingsApi.getBookingById(bookingId))
    ).subscribe({
      next: (booking) => {
        this.createdBooking = this.withNormalizedBookingStates(booking);
        const status = this.getCreatedBookingStatus();

        if (status === 'ACCEPTED' && !this.approvalToastShown) {
          this.approvalToastShown = true;
          this.toast.success('Dealer approved! You can pay now.');
        }
        if (status === 'REJECTED' && !this.rejectionToastShown) {
          this.rejectionToastShown = true;
          this.toast.error('Dealer rejected booking.');
        }

        if (status === 'ACCEPTED' || status === 'REJECTED' || status === 'CONFIRMED') {
          this.stopBookingStatusPolling();
        }
      },
      error: () => {}
    });
  }

  private stopBookingStatusPolling(): void {
    this.bookingStatusPollSub?.unsubscribe();
    this.bookingStatusPollSub = undefined;
  }

  private withNormalizedBookingStates(booking: Booking): Booking {
    return {
      ...booking,
      bookingStatus: this.normalizeBookingStatus(booking.bookingStatus),
      paymentStatus: this.normalizePaymentStatus(booking.paymentStatus)
    };
  }
}
