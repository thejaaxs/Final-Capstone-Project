import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesApi } from '../../../api/favorites.service';
import { Favorite } from '../../../shared/models/favorite.model';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SectionHeaderComponent } from '../../../shared/ui/section-header.component';
import { SkeletonLoaderComponent } from '../../../shared/ui/skeleton-loader.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SectionHeaderComponent, SkeletonLoaderComponent],
  styleUrl: './favorites-list.component.css',
  template: `
    <section class="page-card page-shell">
      <app-section-header
        title="Favorites"
        subtitle="Your saved dealers and products."
      ></app-section-header>

      <div class="toolbar">
        <div>
          <label>Search Dealer</label>
          <input [(ngModel)]="searchName" placeholder="Dealer name" />
        </div>
        <div>
          <label>Reason</label>
          <input [(ngModel)]="searchReason" placeholder="Reason" />
        </div>
        <div>
          <label>Product</label>
          <input [(ngModel)]="searchProduct" placeholder="Product" />
        </div>

        <button class="btn btn-ghost" type="button" (click)="applyFilters()">Filter</button>
        <button class="btn btn-secondary" type="button" (click)="reset()">Reset</button>

        <span class="grow"></span>
        <a routerLink="/customer/favorites/create"><button class="btn" type="button">Create Favorite</button></a>
      </div>

      <div class="panel" *ngIf="loading">
        <app-skeleton-loader variant="row" [count]="6"></app-skeleton-loader>
      </div>

      <div class="state-card error" *ngIf="!loading && errorMessage">
        <p>{{ errorMessage }}</p>
        <button class="btn btn-ghost" type="button" (click)="load()">Retry</button>
      </div>

      <div class="empty" *ngIf="!loading && !errorMessage && view.length === 0">
        No favorites yet.
      </div>

      <table *ngIf="!loading && !errorMessage && view.length > 0">
        <thead>
          <tr>
            <th (click)="sortBy('dealerName')">Dealer Name</th>
            <th (click)="sortBy('address')">Address</th>
            <th (click)="sortBy('productName')">Product</th>
            <th (click)="sortBy('reason')">Reason</th>
            <th>CustomerId</th>
            <th>DealerId</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr *ngFor="let f of view">
            <td>{{ f.dealerName }}</td>
            <td>{{ f.address }}</td>
            <td>{{ f.productName }}</td>
            <td>{{ f.reason }}</td>
            <td>{{ f.customerId }}</td>
            <td>{{ f.dealerId }}</td>
            <td>
              <div class="table-actions">
                <a [routerLink]="['/customer/favorites/edit', f.dealerName]"><button class="btn btn-ghost" type="button">Edit</button></a>
                <button class="btn btn-danger" type="button" (click)="delByName(f.dealerName)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="panel bulk-delete-panel">
        <h4>Bulk Delete By Product</h4>
        <div class="bulk-actions">
          <input [(ngModel)]="bulkProduct" placeholder="Product name" />
          <button class="btn btn-danger" type="button" (click)="delByProduct()">Delete All</button>
        </div>
      </div>
    </section>
  `
})
export class FavoritesListComponent implements OnInit {
  all: Favorite[] = [];
  view: Favorite[] = [];
  loading = false;
  errorMessage = '';
  skeletonRows = [1, 2, 3, 4, 5];

  searchName = '';
  searchReason = '';
  searchProduct = '';
  bulkProduct = '';

  sortKey: keyof Favorite = 'dealerName';
  sortAsc = true;

  constructor(private api: FavoritesApi, private toast: ToastService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.errorMessage = '';
    this.api.list().subscribe({
      next: (res) => {
        this.all = res;
        this.view = [...this.all];
        this.applySorting();
      },
      error: (err: HttpErrorResponse) => {
        const msg = typeof err.error === 'string' ? err.error : err.error?.message;
        this.errorMessage = msg || 'Could not load favorites.';
      },
      complete: () => (this.loading = false),
    });
  }

  applyFilters() {
    const name = this.searchName.trim().toLowerCase();
    const reason = this.searchReason.trim().toLowerCase();
    const product = this.searchProduct.trim().toLowerCase();

    this.view = this.all.filter(f => {
      const okName = !name || f.dealerName?.toLowerCase().includes(name);
      const okReason = !reason || (f.reason ?? '').toLowerCase().includes(reason);
      const okProduct = !product || (f.productName ?? '').toLowerCase().includes(product);
      return okName && okReason && okProduct;
    });

    this.applySorting();
  }

  reset() {
    this.searchName = '';
    this.searchReason = '';
    this.searchProduct = '';
    this.view = [...this.all];
    this.applySorting();
  }

  sortBy(key: keyof Favorite) {
    this.sortKey = key;
    this.sortAsc = !this.sortAsc;
    this.applySorting();
  }

  applySorting() {
    const k = this.sortKey;
    const asc = this.sortAsc;
    this.view.sort((a: any, b: any) => {
      const av = (a?.[k] ?? '').toString().toLowerCase();
      const bv = (b?.[k] ?? '').toString().toLowerCase();
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  delByName(name: string) {
    if (!confirm(`Delete dealer '${name}' from favorites?`)) return;
    this.api.deleteByName(name).subscribe(() => {
      this.toast.success('Deleted');
      this.load();
    }, (err: HttpErrorResponse) => {
      const msg = typeof err.error === 'string' ? err.error : err.error?.message;
      this.toast.error(msg || 'Delete failed');
    });
  }

  delByProduct() {
    const p = this.bulkProduct.trim();
    if (!p) {
      this.toast.error('Enter product name');
      return;
    }
    if (!confirm(`Delete all favorites for product '${p}'?`)) return;
    this.api.deleteByProductName(p).subscribe(() => {
      this.toast.success('Deleted by product');
      this.load();
    }, (err: HttpErrorResponse) => {
      const msg = typeof err.error === 'string' ? err.error : err.error?.message;
      this.toast.error(msg || 'Delete by product failed');
    });
  }
}

