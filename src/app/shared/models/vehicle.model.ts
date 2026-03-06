export interface Vehicle {
  id?: number;
  name: string;
  brand: string;
  price: number;
  status?: string;
  fuelType?: 'PETROL' | 'ELECTRIC' | string;
  dealerId: number;
  imageUrl?: string; // backend returns full URL after mapping
}
