
import React, { useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { formatCurrency } from '../utils/data';
import { CATEGORY_COLORS, MONTHS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calculator, Key, Wallet } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  selectedYear: number | 'All';
  selectedMonth: number | 'All';
  setMonth: (m: number | 'All') => void;
  onAdd: (type?: TransactionType, category?: Category) => void;
}

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-xl border shadow-xl ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-200'}`}>
        <p className={`text-xs font-black uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const isLoyer = entry.name.startsWith('Loyer_');
            const color = isLoyer ? CATEGORY_COLORS[Category.LOYER] : CATEGORY_COLORS[entry.name as Category];
            const displayName = isLoyer ? 'Location' : entry.name;
            return (
              <div key={index} className="flex justify-between items-center gap-4">
                <span className="text-[11px] font-bold" style={{ color: color }}>{displayName}:</span>
                <span className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<Props> = ({ transactions, selectedYear, selectedMonth, setMonth, onAdd }) => {
  const isDark = document.documentElement.classList.contains('dark');

  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    const yearMatch = selectedYear === 'All' || d.getFullYear() === selectedYear;
    const monthMatch = selectedMonth === 'All' || d.getMonth() === selectedMonth;
    return yearMatch && monthMatch;
  });

  const totalRevenue = filtered
    .filter(t => t.type === TransactionType.REVENUE)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = filtered
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netProfit = totalRevenue - totalExpense;

  // Calcul pour segmenter les loyers
  const { chartData, maxLoyerSegments } = useMemo(() => {
    let maxSegments = 0;
    const data = MONTHS.map((name, index) => {
      const monthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        const yearMatch = selectedYear === 'All' || d.getFullYear() === selectedYear;
        return d.getMonth() === index && yearMatch;
      });

      const entry: any = { name };
      
      // Séparer les loyers des autres catégories
      const loyers = monthTransactions.filter(t => t.category === Category.LOYER);
      const others = monthTransactions.filter(t => t.category !== Category.LOYER);

      // Agréger les autres catégories normalement
      others.forEach(t => {
        entry[t.category] = (entry[t.category] || 0) + (Number(t.amount) || 0);
      });

      // Segmenter chaque loyer individuellement
      loyers.forEach((t, i) => {
        const key = `Loyer_${i}`;
        entry[key] = Number(t.amount) || 0;
        entry[`Loyer_${i}_Price`] = t.booking?.pricePerNight || 0;
      });

      if (loyers.length > maxSegments) maxSegments = loyers.length;

      return entry;
    });

    return { chartData: data, maxLoyerSegments: maxSegments };
  }, [transactions, selectedYear]);

  // Catégories de charges (tout sauf Loyer)
  const chargeCategories = Object.keys(CATEGORY_COLORS).filter(c => c !== Category.LOYER) as Category[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-sm transition-colors">
          <div className="absolute -right-2 -top-2 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-emerald-600 dark:text-emerald-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Revenus ({selectedYear === 'All' ? 'Total' : selectedYear})</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{formatCurrency(totalRevenue)}</p>
        </div>
        
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-rose-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-sm transition-colors">
          <div className="absolute -right-2 -top-2 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-24 h-24 text-rose-600 dark:text-rose-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Dépenses ({selectedYear === 'All' ? 'Total' : selectedYear})</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group shadow-sm transition-colors">
          <div className="absolute -right-2 -top-2 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
            <Calculator className="w-24 h-24 text-blue-600 dark:text-blue-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Solde Net</p>
          <p className={`text-3xl font-black mt-2 ${netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(netProfit)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Flux de Trésorerie Mensuel</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Segments de loyers nets délimités.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => onAdd(TransactionType.REVENUE, Category.LOYER)} 
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Key className="w-4 h-4" /> Nouvelle Location
            </button>
            <button 
              onClick={() => onAdd(TransactionType.EXPENSE, Category.CHARGES)} 
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center gap-2 text-xs font-black rounded-xl shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <Wallet className="w-4 h-4" /> Nouvelle Dépense
            </button>
          </div>
        </div>

        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${val}€`} />
              <Tooltip 
                cursor={{ fill: isDark ? '#334155' : '#f8fafc', opacity: isDark ? 0.1 : 0.5 }} 
                content={<CustomTooltip isDark={isDark} />}
              />
              
              {chargeCategories.map((cat) => (
                <Bar 
                  key={cat} 
                  dataKey={cat} 
                  stackId="a" 
                  fill={CATEGORY_COLORS[cat]} 
                  radius={[0, 0, 0, 0]}
                />
              ))}

              {Array.from({ length: maxLoyerSegments }).map((_, i) => (
                <Bar 
                  key={`Loyer_${i}`} 
                  dataKey={`Loyer_${i}`} 
                  stackId="a" 
                  fill={CATEGORY_COLORS[Category.LOYER]} 
                  stroke={isDark ? "#1e293b" : "#ffffff"}
                  strokeWidth={1.5}
                  radius={i === maxLoyerSegments - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
        {MONTHS.map((m, idx) => (
          <button 
            key={idx}
            type="button"
            onClick={() => setMonth(idx)}
            className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
              selectedMonth === idx 
                ? 'bg-pink-600 border-pink-600 dark:border-pink-500 text-white shadow-lg shadow-pink-600/20' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
