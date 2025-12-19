
import React, { useState } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { formatCurrency } from '../utils/data';
import { CATEGORY_COLORS } from '../constants';
import { Edit2, Trash2, Search, Calendar as CalendarIcon, User, Baby } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  selectedYear: number | 'All';
  selectedMonth: number | 'All';
}

const TransactionList: React.FC<Props> = ({ 
  transactions, onEdit, onDelete, selectedYear, selectedMonth
}) => {
  const [selectedCat, setSelectedCat] = useState<Category | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    const yearMatch = selectedYear === 'All' || d.getFullYear() === selectedYear;
    const monthMatch = selectedMonth === 'All' || d.getMonth() === selectedMonth;
    const catMatch = selectedCat === 'All' || t.category === selectedCat;
    const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return yearMatch && monthMatch && catMatch && searchMatch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center shadow-sm transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Filtrer les opérations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
          />
        </div>
        
        <select 
          value={selectedCat} 
          onChange={e => setSelectedCat(e.target.value as Category | 'All')}
          className="w-full md:w-48 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white cursor-pointer transition-colors outline-none"
        >
          <option value="All" className="bg-white dark:bg-slate-900">Toutes catégories</option>
          {Object.values(Category).map(cat => <option key={cat} value={cat} className="bg-white dark:bg-slate-900">{cat}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0f172a]/80 text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4">Date & Catégorie</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4 text-right">Montant</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span 
                        className="text-[9px] font-black uppercase mt-1"
                        style={{ color: CATEGORY_COLORS[t.category] }}
                      >
                        {t.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.description}</p>
                    {t.booking && (
                      <div className="flex items-center gap-2 mt-1.5 opacity-60">
                         <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-400"><User className="w-2 h-2" /> {t.booking.adults}</span>
                         {t.booking.children > 0 && <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600 dark:text-slate-400"><Baby className="w-2 h-2" /> {t.booking.children}</span>}
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right font-black text-sm ${t.type === TransactionType.REVENUE ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {t.type === TransactionType.REVENUE ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => onEdit(t)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="p-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 text-center text-slate-400 dark:text-slate-600 italic">Aucune donnée trouvée.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
