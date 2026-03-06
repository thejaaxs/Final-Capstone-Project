import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiclesApi } from '../../../api/vehicles.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { Vehicle } from '../../../shared/models/vehicle.model';
import { DealersApi } from '../../../api/dealers.service';
import { Dealer } from '../../../shared/models/dealer.model';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './vehicle-create.component.css',
  template: `
    <section class="page-card page-shell">
      <article class="card">
        <h2>Add Vehicle</h2>
        <p class="section-subtitle">Publish a vehicle listing for customers.</p>

        <form (ngSubmit)="submit()" #f="ngForm">
          <label>Name</label>
          <input [(ngModel)]="model.name" name="name" required />

          <label>Brand</label>
          <input [(ngModel)]="model.brand" name="brand" required />

          <label>Price</label>
          <input type="number" [(ngModel)]="model.price" name="price" required min="1" />

          <label>Status</label>
          <select [(ngModel)]="model.status" name="status" required>
            <option *ngFor="let status of availabilityOptions" [ngValue]="status">{{ status }}</option>
          </select>

          <label>Fuel Type</label>
          <select [(ngModel)]="model.fuelType" name="fuelType" required>
            <option *ngFor="let fuel of fuelTypeOptions" [ngValue]="fuel">{{ fuel }}</option>
          </select>

          <label>Dealer</label>
          <select [(ngModel)]="model.dealerId" name="dealerId" required>
            <option *ngFor="let d of dealers" [ngValue]="d.dealerId">
              {{ d.dealerId }} - {{ d.dealerName }}
            </option>
          </select>

          <label>Vehicle Image (optional)</label>
          <input type="file" accept="image/*" (change)="onFileChange($event)" />
          <small *ngIf="selectedFile">Selected: {{ selectedFile.name }}</small>
          <img *ngIf="previewUrl" [src]="previewUrl" alt="Image preview" width="160" class="file-preview" />

          <button class="btn" type="submit" [disabled]="f.invalid || saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </form>
      </article>
    </section>
  `
})
export class VehicleCreateComponent {
  model: Vehicle = { name: '', brand: '', price: 1, status: 'AVAILABLE', fuelType: 'PETROL', dealerId: 1 };
  dealers: Dealer[] = [];
  saving = false;
  selectedFile?: File;
  previewUrl = '';
  readonly availabilityOptions: Array<'AVAILABLE' | 'OUT_OF_STOCK'> = ['AVAILABLE', 'OUT_OF_STOCK'];
  readonly fuelTypeOptions: Array<'PETROL' | 'ELECTRIC'> = ['PETROL', 'ELECTRIC'];

  constructor(
    private api: VehiclesApi,
    private dealersApi: DealersApi,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.loadDealers();
  }

  private loadDealers() {
    this.dealersApi.list().subscribe({
      next: (res) => {
        this.dealers = res;
        const email = this.auth.getEmail();
        const matched = email ? this.dealers.find((d) => d.email?.toLowerCase() === email.toLowerCase()) : undefined;
        if (matched?.dealerId) this.model.dealerId = matched.dealerId;
        else if (this.dealers[0]?.dealerId) this.model.dealerId = this.dealers[0].dealerId;
      },
      error: () => this.toast.error('Failed to load dealers'),
    });
  }

  submit() {
    this.model.status = this.normalizeStatus(this.model.status);
    this.model.fuelType = this.normalizeFuelType(this.model.fuelType);
    this.saving = true;
    this.api.add(this.model).subscribe({
      next: (created) => {
        if (this.selectedFile && created.id) {
          this.uploadAfterCreate(created.id);
          return;
        }
        this.toast.success('Vehicle created');
        this.router.navigateByUrl('/dealer/vehicles');
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Vehicle creation failed');
        this.saving = false;
      },
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.selectedFile = undefined;
      this.previewUrl = '';
      return;
    }
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  private uploadAfterCreate(vehicleId: number) {
    if (!this.selectedFile) {
      this.saving = false;
      return;
    }

    this.api.uploadImage(vehicleId, this.selectedFile).subscribe({
      next: () => {
        this.toast.success('Vehicle and image added successfully');
        this.router.navigateByUrl('/dealer/vehicles');
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error : err.error?.message;
        this.toast.error(backendMessage || 'Vehicle created, but image upload failed');
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  private normalizeStatus(status?: string): 'AVAILABLE' | 'OUT_OF_STOCK' {
    return (status || '').toUpperCase() === 'OUT_OF_STOCK' ? 'OUT_OF_STOCK' : 'AVAILABLE';
  }

  private normalizeFuelType(fuelType?: string): 'PETROL' | 'ELECTRIC' {
    return (fuelType || '').toUpperCase() === 'ELECTRIC' ? 'ELECTRIC' : 'PETROL';
  }
}

