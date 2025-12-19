
import React, { useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { formatCurrency } from '../utils/data';
import { CATEGORY_COLORS, MONTHS } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  transactions: Transaction[];
  selectedYear: number | 'All';
  selectedMonth: number | 'All';
}

const Analysis: React.FC<Props> = ({ transactions, selectedYear, selectedMonth }) => {
  const isDark = document.documentElement.classList.contains('dark');

  const filtered = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    const yearMatch = selectedYear === 'All' || d.getFullYear() === selectedYear;
    const monthMatch = selectedMonth === 'All' || d.getMonth() === selectedMonth;
    return yearMatch && monthMatch;
  }), [transactions, selectedYear, selectedMonth]);

  const totalVolume = filtered.reduce((sum, t) => sum + t.amount, 0);
  const totalRev = filtered.filter(t => t.type === TransactionType.REVENUE).reduce((sum, t) => sum + t.amount, 0);
  const totalExp = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

  const pieData = useMemo(() => Object.values(Category).map(cat => ({
    name: cat,
    value: filtered.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
  })).filter(d => d.value > 0), [filtered]);

  const periodLabel = useMemo(() => {
    if (selectedYear === 'All' && selectedMonth === 'All') return 'Tout historique';
    if (selectedYear !== 'All' && selectedMonth === 'All') return `Année ${selectedYear}`;
    if (selectedYear === 'All' && selectedMonth !== 'All') return `Tous les ${MONTHS[selectedMonth as number]}`;
    return `${MONTHS[selectedMonth as number]} ${selectedYear}`;
  }, [selectedYear, selectedMonth]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 transition-colors">
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl p-8 sm:p-12 flex flex-col items-center relative overflow-hidden shadow-sm transition-colors">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-violet-500 opacity-50"></div>
        
        <div className="text-center mb-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Répartition des flux par catégorie</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Période : {periodLabel}</p>
        </div>
        
        <div className="w-full h-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={110}
                outerRadius={150}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '12px' }}
                itemStyle={{ color: isDark ? '#fff' : '#0f172a', fontSize: '12px', fontWeight: 'bold' }}
                formatter={(val: number) => formatCurrency(val)}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', color: isDark ? '#94a3b8' : '#64748b' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-center pointer-events-none">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">Volume Total</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(totalVolume).split(',')[0]}€</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenus', value: totalRev, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Dépenses', value: totalExp, color: 'text-rose-600 dark:text-rose-400' },
          { label: 'Résultat Net', value: totalRev - totalExp, color: 'text-blue-600 dark:text-blue-400' }
        ].map((stat, i) => (stat.value !== 0 || i === 2) && (
          <div key={stat.label} className="bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-700/50 p-6 rounded-2xl text-center shadow-sm transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-xl font-black ${stat.color}`}>{formatCurrency(stat.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analysis;
