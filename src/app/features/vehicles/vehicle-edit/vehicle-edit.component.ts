import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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

        <form *ngIf="loaded" (ngSubmit)="save(f)" #f="ngForm" novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="vehicle-edit-name">Name</label>
              <input id="vehicle-edit-name" [(ngModel)]="model.name" name="name" required />
            </div>

            <div class="field">
              <label for="vehicle-edit-brand">Brand</label>
              <input id="vehicle-edit-brand" [(ngModel)]="model.brand" name="brand" required />
            </div>

            <div class="field">
              <label for="vehicle-edit-price">Price</label>
              <input id="vehicle-edit-price" type="number" [(ngModel)]="model.price" name="price" required min="1" />
            </div>

            <div class="field field-full">
              <label for="vehicle-edit-dealer">Dealer</label>
              <select id="vehicle-edit-dealer" [(ngModel)]="model.dealerId" name="dealerId" required>
                <option *ngFor="let d of dealers" [ngValue]="d.dealerId">
                  {{ d.dealerId }} - {{ d.dealerName }}
                </option>
              </select>
            </div>
          </div>

          <section class="form-section">
            <div class="section-heading">
              <h3>Recommendation Details</h3>
              <p>Keep these values accurate so customer recommendations stay relevant.</p>
            </div>

            <div class="form-grid">
              <div class="field">
                <label for="vehicle-edit-mileage">Mileage (km/l)</label>
                <input
                  id="vehicle-edit-mileage"
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
                <label for="vehicle-edit-ride-type">Ride Type</label>
                <select
                  id="vehicle-edit-ride-type"
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
                <label for="vehicle-edit-suitable-daily-km">Suitable Daily KM</label>
                <input
                  id="vehicle-edit-suitable-daily-km"
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
                <label for="vehicle-edit-status">Availability</label>
                <select
                  id="vehicle-edit-status"
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
              <h3>Images</h3>
              <p>Update the listing image without affecting the rest of the vehicle details.</p>
            </div>

            <div class="upload-actions">
              <input type="file" accept="image/*" (change)="onFile($event)" />
              <div class="table-actions">
                <button class="btn btn-ghost" type="button" (click)="upload()" [disabled]="!file">Upload</button>
                <button class="btn btn-danger" type="button" (click)="deleteImage()">Delete Image</button>
              </div>
            </div>

            <img *ngIf="model.imageUrl" [src]="model.imageUrl" width="150" class="file-preview" alt="Vehicle image" />
          </section>

          <div class="form-actions">
            <button class="btn" type="submit" [disabled]="f.invalid || saving">{{ saving ? 'Updating...' : 'Update' }}</button>
          </div>
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
  readonly rideTypeOptions: Array<'CITY' | 'HIGHWAY'> = ['CITY', 'HIGHWAY'];

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
      this.model = this.hydrateModel(v);
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

  save(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.model = { ...this.model, ...payload };
    this.saving = true;
    this.api.update(this.id, payload).subscribe({
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
        this.model = this.hydrateModel(v);
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
        this.model = this.hydrateModel(v);
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

  private normalizeRideType(rideType?: string): 'CITY' | 'HIGHWAY' {
    return (rideType || '').toUpperCase() === 'HIGHWAY' ? 'HIGHWAY' : 'CITY';
  }

  private normalizePositiveNumber(value?: number | null): number | undefined {
    const normalized = Number(value);
    return Number.isFinite(normalized) && normalized > 0 ? normalized : undefined;
  }

  private hydrateModel(vehicle: Vehicle): Vehicle {
    return {
      ...vehicle,
      status: this.normalizeStatus(vehicle.status),
      fuelType: this.normalizeFuelType(vehicle.fuelType),
      rideType: this.normalizeRideType(vehicle.rideType),
      mileage: this.normalizePositiveNumber(vehicle.mileage),
      suitableDailyKm: this.normalizePositiveNumber(vehicle.suitableDailyKm),
    };
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

