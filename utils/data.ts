
import { Transaction } from '../types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const exportToCSV = (transactions: Transaction[]) => {
  // En-têtes adaptés pour un usage Excel/Sheets en français
  const headers = ['Date', 'Description', 'Catégorie', 'Type', 'Montant Net (€)', 'Adultes', 'Enfants', 'Nuits', 'Prix Brut/Nuit (€)'];
  
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('fr-FR'), // Date au format FR
    t.description.replace(/;/g, ','), // Éviter de casser les colonnes si la description contient un point-virgule
    t.category,
    t.type,
    t.amount.toString().replace('.', ','), // Virgule pour les décimales (Excel FR)
    t.booking?.adults?.toString() || '0',
    t.booking?.children?.toString() || '0',
    t.booking?.nights?.toString() || '0',
    t.booking?.pricePerNight?.toString().replace('.', ',') || '0'
  ]);

  // BOM UTF-8 (\uFEFF) pour forcer Excel à reconnaître l'encodage et afficher les accents correctement
  const csvContent = "\uFEFF" + [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `louersimple_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadJSON = (data: Transaction[]) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `louersimple_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
