import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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

        <form (ngSubmit)="submit(f)" #f="ngForm" novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="vehicle-name">Name</label>
              <input id="vehicle-name" [(ngModel)]="model.name" name="name" required />
            </div>

            <div class="field">
              <label for="vehicle-brand">Brand</label>
              <input id="vehicle-brand" [(ngModel)]="model.brand" name="brand" required />
            </div>

            <div class="field">
              <label for="vehicle-price">Price</label>
              <input id="vehicle-price" type="number" [(ngModel)]="model.price" name="price" required min="1" />
            </div>

            <div class="field">
              <label for="vehicle-fuel-type">Fuel Type</label>
              <select id="vehicle-fuel-type" [(ngModel)]="model.fuelType" name="fuelType" required>
                <option *ngFor="let fuel of fuelTypeOptions" [ngValue]="fuel">{{ fuel }}</option>
              </select>
            </div>

            <div class="field field-full">
              <label for="vehicle-dealer">Dealer</label>
              <select id="vehicle-dealer" [(ngModel)]="model.dealerId" name="dealerId" required>
                <option *ngFor="let d of dealers" [ngValue]="d.dealerId">
                  {{ d.dealerId }} - {{ d.dealerName }}
                </option>
              </select>
            </div>
          </div>

          <section class="form-section">
            <div class="section-heading">
              <h3>Recommendation Details</h3>
              <p>These fields help MotoMint recommend this vehicle to the right riders.</p>
            </div>

            <div class="form-grid">
              <div class="field">
                <label for="vehicle-mileage">Mileage (km/l)</label>
                <input
                  id="vehicle-mileage"
                  type="number"
                  [(ngModel)]="model.mileage"
                  name="mileage"
                  required
                  min="1"
                  #mileageModel="ngModel"
                />
                <small class="field-error" *ngIf="mileageModel.invalid && (mileageModel.touched || f.submitted)">
                  Mileage is required and must be at least 1.
                </small>
              </div>

              <div class="field">
                <label for="vehicle-ride-type">Ride Type</label>
                <select
                  id="vehicle-ride-type"
                  [(ngModel)]="model.rideType"
                  name="rideType"
                  required
                  #rideTypeModel="ngModel"
                >
                  <option *ngFor="let rideType of rideTypeOptions" [ngValue]="rideType">{{ rideType }}</option>
                </select>
                <small class="field-error" *ngIf="rideTypeModel.invalid && (rideTypeModel.touched || f.submitted)">
                  Ride type is required.
                </small>
              </div>

              <div class="field">
                <label for="vehicle-suitable-daily-km">Suitable Daily KM</label>
                <input
                  id="vehicle-suitable-daily-km"
                  type="number"
                  [(ngModel)]="model.suitableDailyKm"
                  name="suitableDailyKm"
                  required
                  min="1"
                  #suitableDailyKmModel="ngModel"
                />
                <small class="field-error" *ngIf="suitableDailyKmModel.invalid && (suitableDailyKmModel.touched || f.submitted)">
                  Suitable Daily KM is required and must be at least 1.
                </small>
              </div>

              <div class="field">
                <label for="vehicle-status">Availability</label>
                <select
                  id="vehicle-status"
                  [(ngModel)]="model.status"
                  name="status"
                  required
                  #statusModel="ngModel"
                >
                  <option *ngFor="let status of availabilityOptions" [ngValue]="status">{{ status }}</option>
                </select>
                <small class="field-error" *ngIf="statusModel.invalid && (statusModel.touched || f.submitted)">
                  Availability is required.
                </small>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading">
              <h3>Vehicle Image</h3>
              <p>Optional, but recommended for better visibility.</p>
            </div>

            <div class="field">
              <input type="file" accept="image/*" (change)="onFileChange($event)" />
              <small *ngIf="selectedFile">Selected: {{ selectedFile.name }}</small>
              <img *ngIf="previewUrl" [src]="previewUrl" alt="Image preview" width="160" class="file-preview" />
            </div>
          </section>

          <div class="form-actions">
            <button class="btn" type="submit" [disabled]="f.invalid || saving">{{ saving ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </article>
    </section>
  `
})
export class VehicleCreateComponent {
  model: Vehicle = {
    name: '',
    brand: '',
    price: 1,
    status: 'AVAILABLE',
    fuelType: 'PETROL',
    rideType: 'CITY',
    dealerId: 1
  };
  dealers: Dealer[] = [];
  saving = false;
  selectedFile?: File;
  previewUrl = '';
  readonly availabilityOptions: Array<'AVAILABLE' | 'OUT_OF_STOCK'> = ['AVAILABLE', 'OUT_OF_STOCK'];
  readonly fuelTypeOptions: Array<'PETROL' | 'ELECTRIC'> = ['PETROL', 'ELECTRIC'];
  readonly rideTypeOptions: Array<'CITY' | 'HIGHWAY'> = ['CITY', 'HIGHWAY'];

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

  submit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.model = { ...this.model, ...payload };
    this.saving = true;
    this.api.add(payload).subscribe({
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

  private normalizeRideType(rideType?: string): 'CITY' | 'HIGHWAY' {
    return (rideType || '').toUpperCase() === 'HIGHWAY' ? 'HIGHWAY' : 'CITY';
  }

  private normalizePositiveNumber(value?: number | null): number | undefined {
    const normalized = Number(value);
    return Number.isFinite(normalized) && normalized > 0 ? normalized : undefined;
  }

  private buildPayload(): Vehicle {
    return {
      ...this.model,
      status: this.normalizeStatus(this.model.status),
      fuelType: this.normalizeFuelType(this.model.fuelType),
      rideType: this.normalizeRideType(this.model.rideType),
      mileage: this.normalizePositiveNumber(this.model.mileage),
      suitableDailyKm: this.normalizePositiveNumber(this.model.suitableDailyKm),
    };
  }
}

