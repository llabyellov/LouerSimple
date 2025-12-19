
export enum TransactionType {
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  LOYER = 'Loyer',
  CHARGES = 'Charges',
  TAXES = 'Taxes',
  INVESTISSEMENT = 'Investissement',
  CONSOMMABLES = 'Consommables',
  ASSURANCE = 'Assurance',
  INTERNET = 'Box/Internet',
  IMPOT_FONCIER = 'Impôt Foncier',
  TAXE_HABITATION = 'Taxe Habitation'
}

export interface BookingDetails {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  nights: number;
  pricePerNight: number; // Prix Brut
  feesRate?: number;
  taxRate?: number;
  waterPerNight?: number;
  elecPerNight?: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: Category;
  type: TransactionType;
  amount: number; // Montant NET final enregistré
  booking?: BookingDetails;
}

export type ViewType = 'DASHBOARD' | 'LIST' | 'ANALYSIS' | 'CALENDAR';
