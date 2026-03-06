import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingsApi } from '../../../api/bookings.service';
import { Booking } from '../../../shared/models/booking.model';
import { ToastService } from '../../../core/services/toast.service';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomersApi } from '../../../api/customers.service';
import { Customer } from '../../../shared/models/customer.model';
import { AuthService } from '../../../core/services/auth.service';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { SectionHeaderComponent } from '../../../shared/ui/section-header.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BadgeComponent, SectionHeaderComponent, SkeletonLoaderComponent],
  templateUrl: './bookings-customer.component.html',
  styleUrl: './bookings-customer.component.css'
})
export class BookingsCustomerComponent {
  customerId = 0;
  customers: Customer[] = [];
  list: Booking[] = [];
  loading = false;
  errorMessage = '';
  skeletonRows = [1, 2, 3, 4, 5];

  constructor(
    private api: BookingsApi,
    private customersApi: CustomersApi,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.loadCustomers();
  }

  private loadCustomers() {
    this.customersApi.list().subscribe({
      next: (res) => {
        this.customers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.customers.find((c) => c.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.customerId) {
          this.customerId = matched.customerId;
          this.load();
        } else if (this.customers[0]?.customerId) {
          this.customerId = this.customers[0].customerId;
        }
      },
      error: () => this.toast.error('Failed to load customers'),
    });
  }

  load() {
    this.loading = true;
    this.errorMessage = '';
    this.api.byCustomer(this.customerId).subscribe({
      next: (res) => (this.list = res),
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Could not load bookings.';
      },
      complete: () => (this.loading = false),
    });
  }

  canCancel(b: Booking): boolean {
    const status = this.normalizeBookingStatus(b.bookingStatus);
    return status === 'REQUESTED' || status === 'ACCEPTED';
  }

  cancel(id: number) {
    this.api.cancel(id).subscribe({
      next: () => {
        this.toast.success('Booking cancelled');
        this.load();
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Cancel failed'),
    });
  }

  bookingStatusClass(status?: string): string {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'CONFIRMED') return 'badge-confirmed';
    if (normalized === 'CANCELLED') return 'badge-cancelled';
    return 'badge-pending';
  }

  paymentStatusClass(status?: string): string {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'PAID') return 'badge-paid';
    return 'badge-unpaid';
  }

  canShowPay(b: Booking): boolean {
    const paymentStatus = (b.paymentStatus || 'UNPAID').toUpperCase();
    const bookingStatus = this.normalizeBookingStatus(b.bookingStatus);
    return !!b.id && paymentStatus !== 'PAID' && bookingStatus !== 'REJECTED' && bookingStatus !== 'CANCELLED';
  }

  canPay(b: Booking): boolean {
    return this.canShowPay(b) && this.normalizeBookingStatus(b.bookingStatus) === 'ACCEPTED';
  }

  payTooltip(b: Booking): string {
    const status = this.normalizeBookingStatus(b.bookingStatus);
    if (status === 'REQUESTED') return 'Waiting for dealer approval';
    if (status === 'REJECTED') return 'Dealer rejected booking';
    if (status === 'CANCELLED') return 'Booking cancelled';
    return 'Proceed to payment';
  }

  openPayment(b: Booking) {
    if (!b.id) return;
    if (!this.canPay(b)) {
      this.toast.info('Booking not approved yet');
      return;
    }
    this.router.navigate(['/customer/pay', b.id], {
      queryParams: { customerId: b.customerId || this.customerId }
    });
  }

  private normalizeBookingStatus(status?: string): 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED' | 'CANCELLED' {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'ACCEPTED') return 'ACCEPTED';
    if (normalized === 'REJECTED') return 'REJECTED';
    if (normalized === 'CONFIRMED') return 'CONFIRMED';
    if (normalized === 'CANCELLED') return 'CANCELLED';
    if (normalized === 'PENDING') return 'REQUESTED';
    return 'REQUESTED';
  }
}

