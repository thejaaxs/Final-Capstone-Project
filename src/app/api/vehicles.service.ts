import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Vehicle } from '../shared/models/vehicle.model';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VehiclesApi {
  private base = `${environment.apiBaseUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  listAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.base}`).pipe(
      map((list) => list.map((v) => this.normalizeVehicle(v)))
    );
  }

  getById(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.base}/${id}`).pipe(
      map((v) => this.normalizeVehicle(v))
    );
  }

  listByDealer(dealerId: number): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.base}/dealer/${dealerId}`).pipe(
      map((list) => list.map((v) => this.normalizeVehicle(v)))
    );
  }

  add(v: Vehicle): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.base}`, v).pipe(
      map((created) => this.normalizeVehicle(created))
    );
  }

  update(id: number, v: Vehicle): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.base}/${id}`, v).pipe(
      map((updated) => this.normalizeVehicle(updated))
    );
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }

  uploadImage(id: number, file: File): Observable<Vehicle> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Vehicle>(`${this.base}/${id}/upload-image`, form).pipe(
      map((v) => this.normalizeVehicle(v))
    );
  }

  deleteImage(id: number): Observable<Vehicle> {
    return this.http.delete<Vehicle>(`${this.base}/${id}/delete-image`).pipe(
      map((v) => this.normalizeVehicle(v))
    );
  }

  private normalizeVehicle(v: Vehicle): Vehicle {
    const fuelType = (v?.fuelType || '').toUpperCase() === 'ELECTRIC' ? 'ELECTRIC' : 'PETROL';
    if (!v?.imageUrl) return { ...v, fuelType };
    if (v.imageUrl.startsWith('http://') || v.imageUrl.startsWith('https://') || v.imageUrl.startsWith('/api')) {
      return { ...v, fuelType };
    }
    const prefix = v.imageUrl.startsWith('/') ? '' : '/';
    return { ...v, fuelType, imageUrl: `${environment.apiBaseUrl}${prefix}${v.imageUrl}` };
  }
}
