export type FilamentMaterial = 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'Nylon' | 'Resin' | 'Other';

export interface Filament {
  id: string;
  brand: string;
  colour: string;
  colourHex: string;
  material: FilamentMaterial | string;
  totalWeightG: number;
  remainingWeightG: number;
  costPerGram: number;
  createdAt: Date;
}

export interface OrderFilamentUsage {
  id: string;
  gramsUsed: number;
  filamentId: string;
  brand: string;
  colour: string;
  colourHex: string;
  material: string;
  costPerGram: number;
  totalCost: number;
}
