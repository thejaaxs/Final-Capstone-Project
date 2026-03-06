import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VehiclesApi } from '../../api/vehicles.service';
import { Vehicle } from '../../shared/models/vehicle.model';
import { AppFooterComponent } from '../../shared/ui/app-footer.component';
import { SectionHeaderComponent } from '../../shared/ui/section-header.component';
import { SkeletonLoaderComponent } from '../../shared/ui/skeleton-loader.component';
import { VehicleCardComponent } from '../../shared/ui/vehicle-card.component';
import { TopNavComponent } from '../layout/top-nav/top-nav.component';

interface InsightTile {
  label: string;
  value: string;
  caption: string;
}

interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  standalone: true,
  selector: 'app-home-landing',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TopNavComponent,
    SectionHeaderComponent,
    VehicleCardComponent,
    SkeletonLoaderComponent,
    AppFooterComponent,
  ],
  template: `
    <div class="home-page">
      <app-top-nav></app-top-nav>

      <main class="mm-container home-content">
        <section class="hero-banner">
          <div class="hero-inner">
            <span class="hero-chip">MotoMint Marketplace</span>
            <h1>Buy and sell trusted two-wheelers with confidence.</h1>
            <p>
              Explore verified listings, compare prices, and manage bookings in one clean and reliable experience.
            </p>

            <form class="hero-search" (ngSubmit)="applyHeroSearch()">
              <input
                type="search"
                [(ngModel)]="heroSearch"
                name="heroSearch"
                placeholder="Search by brand, model, or city"
              />
              <button type="submit" class="btn">Search</button>
            </form>

            <div class="hero-actions">
              <a routerLink="/login"><button type="button" class="btn">Browse Vehicles</button></a>
              <a routerLink="/register" [queryParams]="{ role: 'DEALER' }"><button type="button" class="btn btn-accent">Partner as Dealer</button></a>
            </div>
          </div>
        </section>

        <section class="panel">
          <app-section-header
            title="Featured Listings"
            subtitle="Premium picks curated for fast buying decisions."
          ></app-section-header>

          <div class="feature-tabs">
            <button
              type="button"
              class="btn btn-ghost"
              [class.active]="activeTab === 'best'"
              (click)="activeTab = 'best'"
            >
              Best for you
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              [class.active]="activeTab === 'new'"
              (click)="activeTab = 'new'"
            >
              Newly added
            </button>
          </div>

          <div class="state-card error" *ngIf="errorMessage">
            <p>{{ errorMessage }}</p>
            <button type="button" class="btn btn-ghost" (click)="loadVehicles()">Retry</button>
          </div>

          <div class="gallery-frame" *ngIf="!errorMessage">
            <ng-container *ngIf="loading; else featuredCards">
              <app-skeleton-loader [grid]="true" variant="card" [count]="4"></app-skeleton-loader>
            </ng-container>
            <ng-template #featuredCards>
              <div class="gallery-track">
                <app-vehicle-card
                  *ngFor="let vehicle of featuredVehicles"
                  [vehicle]="vehicle"
                  [dealerName]="'Trusted Dealer'"
                  [statusLabel]="normalizeStatus(vehicle.status)"
                  (book)="goLogin()"
                  (favorite)="goLogin()"
                ></app-vehicle-card>
              </div>
            </ng-template>
          </div>
        </section>

        <section class="panel">
          <app-section-header
            title="MotoMint Insights"
            subtitle="High-trust marketplace metrics inspired by real customer journeys."
          ></app-section-header>
          <div class="insights-grid">
            <article class="insight-tile" *ngFor="let tile of insights">
              <strong>{{ tile.value }}</strong>
              <p>{{ tile.label }}</p>
              <small>{{ tile.caption }}</small>
            </article>
          </div>
        </section>

        <section class="panel">
          <app-section-header
            title="Why Buyers Choose MotoMint"
            subtitle="Everything designed for a reliable and transparent experience."
          ></app-section-header>
          <div class="benefits-grid">
            <article class="benefit-card" *ngFor="let benefit of benefits">
              <h3>{{ benefit.icon }} {{ benefit.title }}</h3>
              <p>{{ benefit.description }}</p>
            </article>
          </div>
        </section>

        <section class="panel">
          <app-section-header
            title="Frequently Asked Questions"
            subtitle="Quick answers before you start buying or listing."
          ></app-section-header>
          <div class="faq-list">
            <article class="faq-item" *ngFor="let item of faqs; let i = index">
              <button type="button" class="faq-trigger" (click)="toggleFaq(i)">
                <span>{{ item.q }}</span>
                <span>{{ expandedFaq === i ? '-' : '+' }}</span>
              </button>
              <div class="faq-body" *ngIf="expandedFaq === i">
                <p>{{ item.a }}</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <app-footer></app-footer>
    </div>
  `,
  styleUrl: './home-landing.component.css'
})
export class HomeLandingComponent {
  vehicles: Vehicle[] = [];
  loading = false;
  errorMessage = '';
  activeTab: 'best' | 'new' = 'best';
  heroSearch = '';
  expandedFaq = 0;

  insights: InsightTile[] = [
    { label: 'Customer Rating', value: '4.8/5', caption: 'Based on verified buyer feedback' },
    { label: 'Referrals', value: '78%', caption: 'Repeat and referral traffic share' },
    { label: 'Listings Verified', value: '12,000+', caption: 'Quality checked two-wheelers' },
    { label: 'Fastest Delivery', value: '48 hrs', caption: 'For selected city inventory' },
  ];

  benefits: BenefitItem[] = [
    { icon: '🛡️', title: 'Verified Listings', description: 'Every listing is reviewed for profile quality, pricing signals, and clear ownership metadata.' },
    { icon: '⚙️', title: 'Transparent Process', description: 'Track every booking stage with clear statuses from request to confirmation and delivery readiness.' },
    { icon: '💬', title: 'Reliable Support', description: 'Integrated support flow through reviews and account channels keeps communication straightforward.' },
    { icon: '📈', title: 'Dealer Growth Tools', description: 'Dealer dashboard provides inventory visibility, booking actionability, and performance snapshots.' },
  ];

  faqs: FaqItem[] = [
    { q: 'How does MotoMint verify listings?', a: 'Listings are checked against mandatory profile details and availability metadata before they are shown to buyers.' },
    { q: 'Can I reserve a vehicle online?', a: 'Yes. Customers can create a booking request directly from listing pages and track status updates in My Bookings.' },
    { q: 'How do dealers manage stock?', a: 'Dealers can update inventory, set vehicle status, and handle bookings from the dealer dashboard.' },
    { q: 'What payment options are supported?', a: 'Payment status is tracked through the booking workflow; payment integration points are configurable by the backend.' },
    { q: 'Can I edit or delete my review?', a: 'Yes. Customer reviews support edit and delete actions from the Reviews page.' },
  ];

  constructor(private vehiclesApi: VehiclesApi, private router: Router) {
    this.loadVehicles();
  }

  get featuredVehicles(): Vehicle[] {
    const query = this.heroSearch.trim().toLowerCase();
    let rows = [...this.vehicles];
    if (query) {
      rows = rows.filter((v) => `${v.name} ${v.brand}`.toLowerCase().includes(query));
    }

    if (this.activeTab === 'new') {
      rows.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else {
      rows.sort((a, b) => a.price - b.price);
    }

    return rows.slice(0, 12);
  }

  loadVehicles() {
    this.loading = true;
    this.errorMessage = '';
    this.vehiclesApi.listAll().subscribe({
      next: (rows) => {
        this.vehicles = rows;
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Unable to load featured listings.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  applyHeroSearch() {
    if (!this.heroSearch.trim()) return;
    this.activeTab = 'best';
  }

  goLogin() {
    this.router.navigateByUrl('/login');
  }

  toggleFaq(index: number) {
    this.expandedFaq = this.expandedFaq === index ? -1 : index;
  }

  normalizeStatus(status?: string): string {
    return (status || 'AVAILABLE').toUpperCase();
  }
}
