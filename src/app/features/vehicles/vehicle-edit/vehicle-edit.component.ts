import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiclesApi } from '../../../api/vehicles.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { Vehicle } from '../../../shared/models/vehicle.model';
import { DealersApi } from '../../../api/dealers.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './vehicle-edit.component.css',
  template: `
    <section class="page-card page-shell">
      <article class="card">
        <h2>Edit Vehicle</h2>

        <div class="state-card" *ngIf="!loaded">
          <div class="spinner"></div>
          <p>Loading vehicle...</p>
        </div>

        <form *ngIf="loaded" (ngSubmit)="save()" #f="ngForm">
          <label>Name</label>
          <input [(ngModel)]="model.name" name="name" required />

          <label>Brand</label>
          <input [(ngModel)]="model.brand" name="brand" required />

          <label>Price</label>
          <input type="number" [(ngModel)]="model.price" name="price" required />

          <label>Status</label>
          <select [(ngModel)]="model.status" name="status" required>
            <option *ngFor="let status of availabilityOptions" [ngValue]="status">{{ status }}</option>
          </select>

          <label>Dealer</label>
          <select [(ngModel)]="model.dealerId" name="dealerId" required>
            <option *ngFor="let d of dealers" [ngValue]="d.dealerId">
              {{ d.dealerId }} - {{ d.dealerName }}
            </option>
          </select>

          <div class="upload-actions">
            <label>Upload Image</label>
            <input type="file" (change)="onFile($event)" />
            <div class="table-actions">
              <button class="btn btn-ghost" type="button" (click)="upload()" [disabled]="!file">Upload</button>
              <button class="btn btn-danger" type="button" (click)="deleteImage()">Delete Image</button>
            </div>
          </div>

          <img *ngIf="model.imageUrl" [src]="model.imageUrl" width="150" class="file-preview" alt="Vehicle image" />

          <button class="btn" type="submit" [disabled]="f.invalid || saving">{{ saving ? 'Updating...' : 'Update' }}</button>
        </form>
      </article>
    </section>
  `
})
export class VehicleEditComponent implements OnInit {
  id!: number;
  model!: Vehicle;
  loaded = false;
  saving = false;
  file?: File;
  dealers: Dealer[] = [];
  readonly availabilityOptions: Array<'AVAILABLE' | 'OUT_OF_STOCK'> = ['AVAILABLE', 'OUT_OF_STOCK'];

  constructor(
    private api: VehiclesApi,
    private dealersApi: DealersApi,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadDealers();
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(this.id).subscribe(v => {
      this.model = {
        ...v,
        status: this.normalizeStatus(v.status),
        fuelType: this.normalizeFuelType(v.fuelType)
      };
      this.loaded = true;
    });
  }

  private loadDealers() {
    this.dealersApi.list().subscribe({
      next: (res) => {
        this.dealers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.dealers.find((d) => d.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.dealerId && this.model) {
          this.model.dealerId = matched.dealerId;
        }
      },
      error: () => this.toast.error('Failed to load dealers'),
    });
  }

  save() {
    this.model.status = this.normalizeStatus(this.model.status);
    this.model.fuelType = this.normalizeFuelType(this.model.fuelType);
    this.saving = true;
    this.api.update(this.id, this.model).subscribe({
      next: () => {
        this.toast.success('Updated');
        this.router.navigateByUrl('/dealer/vehicles');
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Vehicle update failed');
      },
      complete: () => {
        this.saving = false;
      },
    });
  }

  onFile(e: any) {
    this.file = e.target.files?.[0];
  }

  upload() {
    if (!this.file) return;
    this.api.uploadImage(this.id, this.file).subscribe({
      next: (v) => {
        this.model = {
          ...v,
          status: this.normalizeStatus(v.status),
          fuelType: this.normalizeFuelType(v.fuelType)
        };
        this.toast.success('Image uploaded');
        this.file = undefined;
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Image upload failed');
      },
    });
  }

  deleteImage() {
    this.api.deleteImage(this.id).subscribe({
      next: (v) => {
        this.model = {
          ...v,
          status: this.normalizeStatus(v.status),
          fuelType: this.normalizeFuelType(v.fuelType)
        };
        this.toast.success('Image removed');
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Image delete failed');
      },
    });
  }

  private normalizeStatus(status?: string): 'AVAILABLE' | 'OUT_OF_STOCK' {
    return (status || '').toUpperCase() === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'AVAILABLE';
  }

  private normalizeFuelType(fuelType?: string): 'PETROL' | 'ELECTRIC' {
    return (fuelType || '').toUpperCase() === 'ELECTRIC' ? 'ELECTRIC' : 'PETROL';
  }
}

