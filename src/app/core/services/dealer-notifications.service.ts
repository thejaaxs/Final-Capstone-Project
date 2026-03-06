import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, Subscription, interval, switchMap, tap } from 'rxjs';
import { BookingsApi } from '../../api/bookings.service';
import { DealersApi } from '../../api/dealers.service';
import { AuthService } from './auth.service';
import { Booking } from '../../shared/models/booking.model';

export interface DealerNotificationItem {
  bookingId: number;
  message: string;
  amount?: number;
  createdAt?: string;
  unread: boolean;
}

const POLL_INTERVAL_MS = 30000;

@Injectable({ providedIn: 'root' })
export class DealerNotificationsService implements OnDestroy {
  private readonly itemsSubject = new BehaviorSubject<DealerNotificationItem[]>([]);
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  private pollSub?: Subscription;
  private dealerId = 0;

  readonly items$ = this.itemsSubject.asObservable();
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private bookingsApi: BookingsApi,
    private dealersApi: DealersApi,
    private auth: AuthService
  ) {}

  start(): void {
    if (this.pollSub && !this.pollSub.closed) return;

    const email = (this.auth.getEmail() || '').toLowerCase();
    if (!email) return;

    this.pollSub = this.dealersApi.list().pipe(
      tap((rows) => {
        const matched = rows.find((d) => d.email?.toLowerCase() === email);
        this.dealerId = matched?.dealerId || 0;
      }),
      switchMap(() => {
        if (!this.dealerId) return EMPTY;
        this.refresh();
        return interval(POLL_INTERVAL_MS).pipe(
          tap(() => this.refresh())
        );
      })
    ).subscribe({
      complete: () => {},
      error: () => {}
    });
  }

  stop(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
    this.itemsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  markAllRead(): void {
    if (!this.dealerId) return;
    const current = this.itemsSubject.value;
    const seen = new Set<number>(this.readSeenBookingIds());
    current.forEach((item) => seen.add(item.bookingId));
    this.writeSeenBookingIds(Array.from(seen.values()));
    this.itemsSubject.next(current.map((item) => ({ ...item, unread: false })));
    this.unreadCountSubject.next(0);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private refresh(): void {
    if (!this.dealerId) return;

    this.bookingsApi.byDealer(this.dealerId).subscribe({
      next: (rows) => this.updateNotifications(rows),
      error: () => {}
    });
  }

  private updateNotifications(rows: Booking[]): void {
    const seen = new Set<number>(this.readSeenBookingIds());
    const paidBookings = rows
      .filter((b) => !!b.id && (b.paymentStatus || '').toUpperCase() === 'PAID')
      .sort((a, b) => this.toEpoch(b.createdAt || b.bookingDate) - this.toEpoch(a.createdAt || a.bookingDate));

    const items = paidBookings.map((b) => {
      const bookingId = b.id as number;
      return {
        bookingId,
        message: `Payment received for booking #${bookingId}`,
        amount: b.amount,
        createdAt: b.createdAt || b.bookingDate,
        unread: !seen.has(bookingId)
      } as DealerNotificationItem;
    });

    this.itemsSubject.next(items);
    this.unreadCountSubject.next(items.filter((item) => item.unread).length);
  }

  private readSeenBookingIds(): number[] {
    if (!this.dealerId) return [];
    const raw = localStorage.getItem(this.getSeenKey());
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as number[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x) => typeof x === 'number');
    } catch {
      return [];
    }
  }

  private writeSeenBookingIds(ids: number[]): void {
    if (!this.dealerId) return;
    localStorage.setItem(this.getSeenKey(), JSON.stringify(ids));
  }

  private getSeenKey(): string {
    return `dealer_paid_seen_${this.dealerId}`;
  }

  private toEpoch(value?: string): number {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
