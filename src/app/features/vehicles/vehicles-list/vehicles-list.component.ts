import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiclesApi } from '../../../api/vehicles.service';
import { Vehicle } from '../../../shared/models/vehicle.model';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { DealersApi } from '../../../api/dealers.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { HttpErrorResponse } from '@angular/common/http';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { SectionHeaderComponent } from '../../../shared/ui/section-header.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader.component';
import { VehicleCardComponent } from '../../../shared/ui/vehicle-card.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SectionHeaderComponent,
    VehicleCardComponent,
    SkeletonLoaderComponent,
    BadgeComponent,
  ],
  template: `
    <section class="page-card page-shell">
      <app-section-header
        [title]="role === 'ROLE_CUSTOMER' ? 'Discover Two-Wheelers' : 'Dealer Vehicles'"
        [subtitle]="role === 'ROLE_CUSTOMER'
          ? 'Browse bikes and scooters from trusted dealers.'
          : 'Manage vehicle inventory, updates, and bookings.'"
      ></app-section-header>

      <div class="toolbar">
        <div *ngIf="role !== 'ROLE_CUSTOMER'">
          <label>Dealer</label>
          <select [(ngModel)]="dealerId">
            <option *ngFor="let d of dealers" [ngValue]="d.dealerId">
              {{ d.dealerId }} - {{ d.dealerName }}
            </option>
          </select>
        </div>

        <div>
          <label>Search</label>
          <input [(ngModel)]="searchText" placeholder="Search by bike name or brand" />
        </div>

        <div>
          <label>Status</label>
          <select [(ngModel)]="statusFilter">
            <option value="">All</option>
            <option value="AVAILABLE">Available</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>

        <button class="btn btn-ghost" type="button" (click)="loadAll()">Load All</button>
        <button class="btn btn-secondary" *ngIf="role !== 'ROLE_CUSTOMER'" type="button" (click)="loadByDealer()">Load By Dealer</button>

        <span class="grow"></span>

        <a *ngIf="role !== 'ROLE_CUSTOMER'" routerLink="/dealer/vehicles/create">
          <button class="btn" type="button">Add Vehicle</button>
        </a>
      </div>

      <app-skeleton-loader *ngIf="loading" [grid]="true" variant="card" [count]="role === 'ROLE_CUSTOMER' ? 6 : 4"></app-skeleton-loader>

      <div class="state-card error" *ngIf="!loading && errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="btn btn-ghost" type="button" (click)="loadAll()">Retry</button>
      </div>

      <div class="empty" *ngIf="!loading && !errorMessage && filteredList.length === 0">
        {{ role === 'ROLE_CUSTOMER' ? 'No vehicles found.' : 'No vehicles in dealer inventory.' }}
      </div>

      <div class="vehicle-grid" *ngIf="!loading && !errorMessage && filteredList.length > 0 && role === 'ROLE_CUSTOMER'">
        <app-vehicle-card
          *ngFor="let v of filteredList"
          [vehicle]="v"
          [dealerName]="getDealerName(v.dealerId)"
          [statusLabel]="formatVehicleStatus(v.status)"
          (book)="bookNow($event)"
          (favorite)="openFavorite($event)"
          (review)="openReview($event)"
        ></app-vehicle-card>
      </div>

      <div class="vehicle-grid dealer-grid" *ngIf="!loading && !errorMessage && filteredList.length > 0 && role !== 'ROLE_CUSTOMER'">
        <article class="dealer-vehicle-card" *ngFor="let v of filteredList">
          <div class="dealer-image-wrap">
            <img [src]="v.imageUrl || placeholderImage" [alt]="v.name" class="dealer-image" />
          </div>
          <div class="dealer-content">
            <h3 [title]="v.name">{{ v.name }}</h3>
            <p class="dealer-meta" [title]="v.brand + ' | ' + getDealerName(v.dealerId)">
              {{ v.brand }} | {{ getDealerName(v.dealerId) }}
            </p>
            <p class="dealer-price">INR {{ v.price | number: '1.0-0' }}</p>
            <div class="dealer-status">
              <app-badge [value]="formatVehicleStatus(v.status)"></app-badge>
            </div>
            <div class="dealer-actions">
              <a [routerLink]="['/dealer/vehicles/edit', v.id]"><button class="btn btn-ghost" type="button">Edit</button></a>
              <button class="btn btn-danger" type="button" (click)="del(v.id!)">Delete</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  `,
  styleUrl: './vehicles-list.component.css'
})
export class VehiclesListComponent implements OnInit {
  list: Vehicle[] = [];
  loading = false;
  errorMessage = '';
  placeholderImage = 'https://placehold.co/640x360/e5edf7/36597f?text=MotoMint';
  skeletonCards = [1, 2, 3, 4, 5, 6];
  skeletonRows = [1, 2, 3, 4, 5];
  searchText = '';
  statusFilter = '';
  dealerId = 1;
  dealers: Dealer[] = [];
  dealerNames = new Map<number, string>();
  role: ReturnType<AuthService['getRole']>;

  constructor(
    private api: VehiclesApi,
    private dealersApi: DealersApi,
    private toast: ToastService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.role = this.auth.getRole();
  }
  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q');
      this.searchText = q ?? '';
    });
    this.loadDealers();
    this.loadAll();
  }

  private loadDealers() {
    this.dealersApi.list().subscribe({
      next: (res) => {
        this.dealers = res;
        this.dealerNames.clear();
        for (const dealer of this.dealers) {
          if (dealer.dealerId) {
            this.dealerNames.set(dealer.dealerId, dealer.dealerName);
          }
        }
        const email = this.auth.getEmail();
        const matched = email ? this.dealers.find((d) => d.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.dealerId) {
          this.dealerId = matched.dealerId;
          if (this.role !== 'ROLE_CUSTOMER') this.loadByDealer();
        } else if (this.dealers[0]?.dealerId) {
          this.dealerId = this.dealers[0].dealerId;
        }
      },
      error: () => {
        if (this.role !== 'ROLE_CUSTOMER') {
          this.toast.error('Failed to load dealers');
        }
      },
    });
  }

  getDealerName(dealerId: number): string {
    return this.dealerNames.get(dealerId) || `Dealer #${dealerId}`;
  }

  formatVehicleStatus(status?: string): 'AVAILABLE' | 'OUT_OF_STOCK' {
    return this.normalizeStatus(status);
  }

  get filteredList(): Vehicle[] {
    const search = this.searchText.trim().toLowerCase();
    const status = this.statusFilter.trim().toLowerCase();
    return this.list.filter((v) => {
      const searchable = `${v.name} ${v.brand}`.toLowerCase();
      const matchesSearch = !search || searchable.includes(search);
      const matchesStatus = !status || this.normalizeStatus(v.status).toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
  }

  loadAll() {
    this.loading = true;
    this.errorMessage = '';
    this.api.listAll().subscribe({
      next: (res) => (this.list = res),
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = backendMessage || 'Could not load vehicles.';
      },
      complete: () => (this.loading = false),
    });
  }

  loadByDealer() {
    this.loading = true;
    this.errorMessage = '';
    this.api.listByDealer(this.dealerId).subscribe({
      next: (res) => (this.list = res),
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = backendMessage || 'Could not load dealer vehicles.';
      },
      complete: () => (this.loading = false),
    });
  }

  del(id: number) {
    if (!confirm(`Delete vehicle #${id}?`)) return;
    this.api.delete(id).subscribe({
      next: () => {
        this.toast.success('Deleted');
        this.loadAll();
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Delete failed');
      },
    });
  }

  openFavorite(v: Vehicle) {
    this.router.navigate(['/customer/favorites/create'], {
      queryParams: {
        dealerId: v.dealerId,
        dealerName: this.getDealerName(v.dealerId),
        productName: v.name
      }
    });
  }

  openReview(v: Vehicle) {
    this.router.navigate(['/customer/reviews/create'], {
      queryParams: { productName: v.name }
    });
  }

  bookNow(v: Vehicle) {
    if (!v.id) return;
    this.router.navigate(['/customer/bookings/create'], {
      queryParams: {
        dealerId: v.dealerId,
        vehicleId: v.id,
        amount: v.price
      }
    });
  }

  private normalizeStatus(status?: string): 'AVAILABLE' | 'OUT_OF_STOCK' {
    return (status || '').toUpperCase() === 'AVAILABLE' ? 'AVAILABLE' : 'OUT_OF_STOCK';
  }
}

