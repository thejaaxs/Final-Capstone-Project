import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReviewsApi } from '../../../api/reviews.service';
import { Review } from '../../../shared/models/review.model';
import { ToastService } from '../../../core/services/toast.service';
import { CustomersApi } from '../../../api/customers.service';
import { Customer } from '../../../shared/models/customer.model';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { SectionHeaderComponent } from '../../../shared/ui/section-header.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BadgeComponent, SectionHeaderComponent, SkeletonLoaderComponent],
  styleUrl: './reviews-list.component.css',
  template: `
    <section class="page-card page-shell">
      <app-section-header
        title="Reviews"
        subtitle="Manage ratings and comments for your booked vehicles."
      ></app-section-header>

      <div class="toolbar">
        <div>
          <label>Customer</label>
          <select [(ngModel)]="customerId">
            <option *ngFor="let c of customers" [ngValue]="c.customerId">
              {{ c.customerId }} - {{ c.customerName }}
            </option>
          </select>
        </div>
        <div>
          <label>Product Name</label>
          <input [(ngModel)]="productName" placeholder="Search product" />
        </div>

        <button class="btn btn-ghost" type="button" (click)="load()">Load</button>
        <button class="btn btn-secondary" type="button" (click)="loadByProduct()">Search</button>

        <span class="grow"></span>
        <a routerLink="/customer/reviews/create"><button class="btn" type="button">Create Review</button></a>
      </div>

      <div class="panel" *ngIf="loading">
        <app-skeleton-loader variant="row" [count]="6"></app-skeleton-loader>
      </div>

      <div class="state-card error" *ngIf="!loading && errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="btn btn-ghost" type="button" (click)="load()">Retry</button>
      </div>

      <div class="empty" *ngIf="!loading && !errorMessage && listData.length === 0">
        No reviews yet.
      </div>

      <table class="reviews-table" *ngIf="!loading && !errorMessage && listData.length > 0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Rating</th>
            <th>Title</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of listData">
            <td class="col-product" [title]="r.productName">{{ r.productName }}</td>
            <td><app-badge value="INFO" [text]="r.rating + ' / 10'"></app-badge></td>
            <td class="col-title" [title]="r.title || '-'">{{ r.title || '-' }}</td>
            <td class="col-date">
              {{ r.createdAt ? (r.createdAt | date:'dd MMM yyyy') : '-' }}
              <span class="edited-tag" *ngIf="isEdited(r)">Edited</span>
            </td>
            <td class="col-actions">
              <div class="table-actions">
                <a [routerLink]="['/customer/reviews/edit', r.id]"><button class="btn btn-ghost" type="button">Edit</button></a>
                <button class="btn btn-danger" type="button" (click)="del(r.id!)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  `
})
export class ReviewsListComponent implements OnInit {
  customerId?: number = 0;
  customers: Customer[] = [];
  productName = '';
  allReviews: Review[] = [];
  listData: Review[] = [];
  loading = false;
  errorMessage = '';
  skeletonRows = [1, 2, 3, 4, 5];

  constructor(
    private api: ReviewsApi,
    private customersApi: CustomersApi,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
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
        } else if (this.customers[0]?.customerId) {
          this.customerId = this.customers[0].customerId;
        }
        this.load();
      },
      error: () => {
        this.toast.error('Failed to load customers');
        this.load();
      },
    });
  }

  load() {
    if (this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.api.list(this.customerId).subscribe({
      next: (res) => {
        this.allReviews = this.ensureArray(res);
        if (this.allReviews.length > 0) {
          this.applyCustomerFilter();
          return;
        }
        this.loadAllReviewsFallback();
      },
      error: () => {
        this.loadAllReviewsFallback();
      }
    });
  }

  loadByProduct() {
    const p = this.productName.trim();
    if (!p) {
      this.toast.error('Enter product name');
      return;
    }
    if (this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.api.byProductName(p).subscribe({
      next: (res) => (this.listData = res),
      error: (err: HttpErrorResponse) => {
        if (err.status === 503) {
          this.errorMessage = 'Reviews service is temporarily unavailable. Please retry in a moment.';
          return;
        }
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = backendMessage || 'Could not load product reviews.';
      },
      complete: () => (this.loading = false),
    });
  }

  del(id: number) {
    if (!confirm(`Delete review #${id}?`)) return;
    this.api.delete(id).subscribe({
      next: () => {
        this.toast.success('Deleted');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.toast.error('Review no longer exists. Refreshing list.');
          this.load();
          return;
        }
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Delete failed');
      },
    });
  }

  isEdited(review: Review): boolean {
    return !!review.updatedAt && !!review.createdAt && review.updatedAt !== review.createdAt;
  }

  private loadAllReviewsFallback() {
    this.api.list().subscribe({
      next: (res) => {
        this.allReviews = this.ensureArray(res);
        this.applyCustomerFilter();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 503) {
          this.errorMessage = 'Reviews service is temporarily unavailable. Please retry in a moment.';
          return;
        }
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = backendMessage || 'Could not load reviews.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private applyCustomerFilter() {
    const selectedId = this.customerId ?? 0;
    if (!selectedId || selectedId <= 0) {
      this.listData = [...this.allReviews];
      return;
    }

    const byCustomer = this.allReviews.filter((r) => Number(r.customerId) === Number(selectedId));
    this.listData = byCustomer.length ? byCustomer : [...this.allReviews];
  }

  private ensureArray(value: unknown): Review[] {
    if (!Array.isArray(value)) return [];
    return value as Review[];
  }
}

