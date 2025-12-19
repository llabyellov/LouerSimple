
import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.LOYER]: '#2dd4bf', // Teal
  [Category.CHARGES]: '#3b82f6', // Blue
  [Category.TAXES]: '#a855f7', // Purple
  [Category.INVESTISSEMENT]: '#06b6d4', // Cyan
  [Category.CONSOMMABLES]: '#f59e0b', // Amber
  [Category.ASSURANCE]: '#6366f1', // Indigo
  [Category.INTERNET]: '#ec4899', // Pink
  [Category.IMPOT_FONCIER]: '#8b5cf6', // Violet
  [Category.TAXE_HABITATION]: '#d946ef', // Fuchsia
};

export const MONTHS = [
  'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
];

export const YEARS = [2024, 2025, 2026, 2027, 2028, 2029];
