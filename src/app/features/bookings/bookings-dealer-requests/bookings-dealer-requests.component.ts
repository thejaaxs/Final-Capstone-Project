import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BookingsApi } from '../../../api/bookings.api';
import { DealersApi } from '../../../api/dealers.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Booking } from '../../../shared/models/booking.model';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { SectionHeaderComponent } from '../../../shared/ui/section-header.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader.component';

type ActionType = 'ACCEPT' | 'REJECT';

@Component({
  standalone: true,
  selector: 'app-bookings-dealer-requests',
  imports: [CommonModule, BadgeComponent, SectionHeaderComponent, SkeletonLoaderComponent],
  templateUrl: './bookings-dealer-requests.component.html',
  styleUrl: './bookings-dealer-requests.component.css'
})
export class BookingsDealerRequestsComponent implements OnInit {
  dealerId = 0;
  loading = false;
  resolvingDealer = false;
  errorMessage = '';
  requests: Booking[] = [];
  actionBookingId: number | null = null;
  actionType: ActionType | null = null;

  constructor(
    private bookingsApi: BookingsApi,
    private dealersApi: DealersApi,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.resolveDealerIdAndLoad();
  }

  load(): void {
    if (!this.dealerId) {
      this.errorMessage = 'Unable to resolve dealer account.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.bookingsApi.byDealer(this.dealerId).subscribe({
      next: (rows) => {
        this.requests = rows.filter((b) => this.normalizeStatus(b.bookingStatus) === 'REQUESTED');
      },
      error: (err: HttpErrorResponse) => {
        const backend = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = backend || 'Failed to load booking requests.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  accept(booking: Booking): void {
    this.takeAction(booking, 'ACCEPT');
  }

  reject(booking: Booking): void {
    this.takeAction(booking, 'REJECT');
  }

  isActionLoading(bookingId?: number, action?: ActionType): boolean {
    return !!bookingId && this.actionBookingId === bookingId && this.actionType === action;
  }

  normalizeStatus(status?: string): 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED' | 'CANCELLED' {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'ACCEPTED') return 'ACCEPTED';
    if (normalized === 'REJECTED') return 'REJECTED';
    if (normalized === 'CONFIRMED') return 'CONFIRMED';
    if (normalized === 'CANCELLED') return 'CANCELLED';
    if (normalized === 'PENDING') return 'REQUESTED';
    return 'REQUESTED';
  }

  private resolveDealerIdAndLoad(): void {
    const cachedDealerId = this.auth.getDealerId();
    if (cachedDealerId) {
      this.dealerId = cachedDealerId;
      this.load();
      return;
    }

    const email = (this.auth.getEmail() || '').toLowerCase();
    if (!email) {
      this.errorMessage = 'Unable to resolve dealer profile. Please login again.';
      return;
    }

    this.resolvingDealer = true;
    this.dealersApi.list().subscribe({
      next: (rows) => {
        const matched = rows.find((d) => d.email?.toLowerCase() === email);
        if (!matched?.dealerId) {
          this.errorMessage = 'Dealer profile not found for this login.';
          return;
        }
        this.dealerId = matched.dealerId;
        this.auth.setDealerId(matched.dealerId);
        this.load();
      },
      error: () => {
        this.errorMessage = 'Failed to load dealer profile.';
      },
      complete: () => {
        this.resolvingDealer = false;
      }
    });
  }

  private takeAction(booking: Booking, action: ActionType): void {
    if (!booking.id || this.actionBookingId !== null) return;

    this.actionBookingId = booking.id;
    this.actionType = action;

    const call = action === 'ACCEPT'
      ? this.bookingsApi.acceptBooking(booking.id)
      : this.bookingsApi.rejectBooking(booking.id);

    call.subscribe({
      next: () => {
        this.toast.success(action === 'ACCEPT' ? 'Booking accepted' : 'Booking rejected');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        const backend = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backend || `Failed to ${action.toLowerCase()} booking.`);
      },
      complete: () => {
        this.actionBookingId = null;
        this.actionType = null;
      }
    });
  }
}
