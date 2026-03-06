import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Vehicle } from '../models/vehicle.model';
import { BadgeComponent } from './badge.component';

@Component({
  standalone: true,
  selector: 'app-vehicle-card',
  imports: [CommonModule, BadgeComponent],
  template: `
    <article
      class="mm-vehicle-card"
      role="button"
      tabindex="0"
      aria-label="Open vehicle details"
      (click)="openVehicle()"
      (keydown)="handleCardKeydown($event)"
    >
      <div class="image-wrap">
        <img [src]="vehicle.imageUrl || placeholderImage" [alt]="vehicle.name" class="vehicle-image" />
        <button type="button" class="wish-btn" (click)="emitFavorite($event)">&#9825;</button>
      </div>

      <div class="content">
        <h3 [title]="vehicle.name">{{ vehicle.name }}</h3>
        <p class="meta" [title]="metaLine">{{ metaLine }}</p>
        <p class="price">INR {{ vehicle.price | number: '1.0-0' }}</p>
        <div class="meta-row">
          <app-badge [value]="statusLabel"></app-badge>
          <span class="small-tag">{{ extraTag }}</span>
        </div>

        <div class="actions">
          <button class="btn btn-ghost" type="button" (click)="openVehicle($event)">View Details</button>
          <button class="btn" type="button" (click)="emitBook($event)">Book Now</button>
          <button class="btn btn-ghost" type="button" (click)="emitReview($event)">Review</button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .mm-vehicle-card {
      display: grid;
      gap: 0.66rem;
      background: #fff;
      border: 1px solid var(--mm-border);
      border-radius: 16px;
      padding: 0.72rem;
      box-shadow: var(--mm-shadow-sm);
      transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      min-width: 0;
      cursor: pointer;
    }

    .mm-vehicle-card:hover {
      transform: translateY(-3px);
      border-color: #c6d4ea;
      box-shadow: var(--mm-shadow-md);
    }

	    .image-wrap {
	      position: relative;
	      display: grid;
	      place-items: center;
	      border-radius: 12px;
	      overflow: hidden;
	      background: #edf3ff;
	    }
	
	    .vehicle-image {
	      width: 100%;
	      height: 170px;
	      object-fit: contain;
	      object-position: center;
	      padding: 0.65rem;
	      display: block;
	    }

    .wish-btn {
      position: absolute;
      top: 0.45rem;
      right: 0.45rem;
      width: 30px;
      height: 30px;
      border-radius: 999px;
      border: 1px solid #d4dded;
      background: rgba(255, 255, 255, 0.92);
      color: #334b70;
      display: grid;
      place-items: center;
      padding: 0;
      line-height: 1;
      font-size: 0.94rem;
    }

    .content {
      display: grid;
      gap: 0.32rem;
      min-width: 0;
    }

    h3 {
      margin: 0;
      font-size: 0.98rem;
      line-height: 1.3;
    }

    .meta {
      margin: 0;
      font-size: 0.83rem;
      color: #58728f;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .price {
      margin: 0.18rem 0 0;
      font-size: 1.08rem;
      font-weight: 800;
      color: #123d66;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.45rem;
    }

    .small-tag {
      font-size: 0.73rem;
      color: #516d8d;
      background: #eef3fb;
      border: 1px solid #d2deef;
      border-radius: 999px;
      padding: 0.14rem 0.45rem;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      margin-top: 0.16rem;
    }
  `]
})
export class VehicleCardComponent {
  @Input({ required: true }) vehicle!: Vehicle;
  @Input() dealerName = '';
  @Input() statusLabel = '';
  @Output() book = new EventEmitter<Vehicle>();
  @Output() favorite = new EventEmitter<Vehicle>();
  @Output() review = new EventEmitter<Vehicle>();
  placeholderImage = 'https://placehold.co/640x360/e5edf7/36597f?text=MotoMint';

  constructor(
    private router: Router,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  get metaLine(): string {
    const dealer = this.dealerName ? ` | ${this.dealerName}` : '';
    return `${this.vehicle.brand}${dealer}`;
  }

  get extraTag(): string {
    return (this.vehicle.fuelType || '').toUpperCase() === 'ELECTRIC' ? 'Electric' : 'Petrol';
  }

  handleCardKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    this.openVehicle(event);
  }

  openVehicle(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.vehicle?.id) return;

    const role = this.auth.getRole();
    if (role === 'ROLE_CUSTOMER') {
      this.router.navigate(['/customer/vehicles', this.vehicle.id]);
      return;
    }

    if (!role) {
      this.toast.info('Please login or sign up to view vehicle details.');
      this.router.navigateByUrl('/login');
      return;
    }

    this.toast.info('Vehicle details are available for customer accounts.');
  }

  emitFavorite(event: Event): void {
    event.stopPropagation();
    this.favorite.emit(this.vehicle);
  }

  emitBook(event: Event): void {
    event.stopPropagation();
    this.book.emit(this.vehicle);
  }

  emitReview(event: Event): void {
    event.stopPropagation();
    this.review.emit(this.vehicle);
  }
}
