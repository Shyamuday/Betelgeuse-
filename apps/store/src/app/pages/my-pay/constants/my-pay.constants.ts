export function formatPaise(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  RENT: 'Rent',
  ELECTRICITY: 'Electricity',
  WATER: 'Water',
  INTERNET: 'Internet',
  TELEPHONE: 'Telephone',
  EQUIPMENT: 'Equipment',
  SOFTWARE: 'Software',
  FURNITURE: 'Furniture',
  VEHICLE: 'Vehicle',
  STATIONERY: 'Stationery',
  OFFICE_SUPPLIES: 'Office Supplies',
  PACKAGING: 'Packaging',
  CLEANING_SUPPLIES: 'Cleaning Supplies',
  MEDICAL_SUPPLIES: 'Medical Supplies',
  SALARY: 'Salary',
  TRAINING: 'Training',
  INSURANCE: 'Insurance',
  LEGAL: 'Legal',
  SECURITY: 'Security',
  MARKETING: 'Marketing',
  MAINTENANCE: 'Maintenance',
  LOGISTICS: 'Logistics',
  BANK_CHARGES: 'Bank Charges',
  MISC: 'Misc'
};

export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS);
