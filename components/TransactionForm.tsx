
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { MONTHS } from '../constants';

interface Props {
  onClose: () => void;
  onSave: (transaction: Transaction, repetition: number) => void;
  initialData?: Transaction;
  prefilledDate?: string;
  existingTransactions: Transaction[];
  defaultType?: TransactionType;
  defaultCategory?: Category;
}

const TransactionForm: React.FC<Props> = ({ 
  onClose, onSave, initialData, prefilledDate, existingTransactions,
  defaultType, defaultCategory
}) => {
  const isDark = document.documentElement.classList.contains('dark');
  const [type, setType] = useState<TransactionType>(initialData?.type || defaultType || TransactionType.REVENUE);
  const [category, setCategory] = useState<Category>(initialData?.category || defaultCategory || Category.LOYER);
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || 0);
  const [date, setDate] = useState(initialData?.date || prefilledDate || new Date().toISOString().split('T')[0]);
  
  const [startDate, setStartDate] = useState(initialData?.booking?.startDate || prefilledDate || '');
  const [endDate, setEndDate] = useState(initialData?.booking?.endDate || '');
  const [adults, setAdults] = useState(initialData?.booking?.adults || 2);
  const [children, setChildren] = useState(initialData?.booking?.children || 0);
  const [repetition, setRepetition] = useState(1);

  // Nouveaux états pour le calcul avancé
  const [grossPricePerNight, setGrossPricePerNight] = useState(initialData?.booking?.pricePerNight || 120);
  const [feesRate, setFeesRate] = useState(initialData?.booking?.feesRate || 3);
  const [taxRate, setTaxRate] = useState(initialData?.booking?.taxRate || 17.2);
  const [waterPerNight, setWaterPerNight] = useState(initialData?.booking?.waterPerNight || 2);
  const [elecPerNight, setElecPerNight] = useState(initialData?.booking?.elecPerNight || 3.5);

  const [calDate, setCalDate] = useState(new Date(startDate || date || new Date()));
  const isBookingMode = category === Category.LOYER;

  useEffect(() => {
    if (category === Category.LOYER) {
      setType(TransactionType.REVENUE);
    }
  }, [category]);

  useEffect(() => {
    if (adults + children > 4) {
      setChildren(Math.max(0, 4 - adults));
    }
  }, [adults]);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = e.getTime() - s.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }, [startDate, endDate]);

  // Logique de calcul avancée
  const calculations = useMemo(() => {
    const totalBrut = nights * grossPricePerNight;
    const totalFrais = totalBrut * (feesRate / 100);
    const totalImpots = (totalBrut * 0.5) * (taxRate / 100); // Base 50% Micro-BIC
    const totalEau = nights * waterPerNight;
    const totalElec = nights * elecPerNight;
    
    const netSejour = totalBrut - (totalFrais + totalImpots + totalEau + totalElec);
    const netPerNight = nights > 0 ? netSejour / nights : 0;

    return { totalBrut, totalFrais, totalImpots, totalEau, totalElec, netSejour, netPerNight };
  }, [nights, grossPricePerNight, feesRate, taxRate, waterPerNight, elecPerNight]);

  // Mettre à jour le montant final
  useEffect(() => {
    if (isBookingMode) {
      setAmount(calculations.netSejour);
    }
  }, [calculations.netSejour, isBookingMode]);

  const isDayOccupied = (d: Date) => {
    return existingTransactions.some(t => {
      if (t.id === initialData?.id || !t.booking) return false;
      const s = new Date(t.booking.startDate);
      const e = new Date(t.booking.endDate);
      const check = new Date(d);
      check.setHours(12, 0, 0, 0);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return check >= s && check < e;
    });
  };

  const isDayInSelection = (d: Date) => {
    if (isBookingMode) {
      if (!startDate) return false;
      if (!endDate) return startDate === d.toLocaleDateString('en-CA');
      const s = new Date(startDate);
      const e = new Date(endDate);
      const check = new Date(d);
      check.setHours(12, 0, 0, 0);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return check >= s && check <= e;
    } else {
      return date === d.toLocaleDateString('en-CA');
    }
  };

  const handleDaySelect = (d: Date) => {
    const dStr = d.toLocaleDateString('en-CA');
    if (isBookingMode) {
      if (!startDate || (startDate && endDate)) {
        setStartDate(dStr);
        setEndDate('');
      } else {
        const start = new Date(startDate);
        if (d < start) {
          setEndDate(startDate);
          setStartDate(dStr);
        } else {
          setEndDate(dStr);
        }
      }
    } else {
      setDate(dStr);
    }
  };

  const quickChips = ["Eau", "Électricité", "Assurance", "Box"];

  const renderMiniCalendar = () => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const adjFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    return (
      <div className="bg-slate-50 dark:bg-[#0f172a] rounded-xl p-4 border border-slate-200 dark:border-slate-800 mt-2 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={() => setCalDate(new Date(year, month - 1))} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 transition-colors"><ChevronLeft className="w-4 h-4"/></button>
          <span className="text-xs font-black uppercase text-slate-900 dark:text-white">{MONTHS[month]} {year}</span>
          <button type="button" onClick={() => setCalDate(new Date(year, month + 1))} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 transition-colors"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['L','M','M','J','V','S','D'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-400 dark:text-slate-600 mb-2">{d}</div>)}
          {Array.from({length: adjFirstDay}).map((_, i) => <div key={`pad-${i}`}/>)}
          {Array.from({length: daysInMonth}).map((_, i) => {
            const d = new Date(year, month, i + 1);
            const occupied = isBookingMode && isDayOccupied(d);
            const selected = isDayInSelection(d);
            return (
              <button 
                key={i} 
                type="button"
                onClick={() => handleDaySelect(d)}
                className={`aspect-square rounded-md text-[10px] font-bold flex items-center justify-center transition-all ${
                  selected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                  occupied ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-500/30' : 
                  'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/95 backdrop-blur-md dark:backdrop-blur-xl flex items-center justify-center z-[100] p-4 overflow-y-auto transition-all">
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]/50 transition-colors">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{initialData ? 'Modifier' : 'Ajouter'} <span className="text-pink-600 dark:text-pink-500">Transaction</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave({
          id: initialData?.id || Math.random().toString(36).substring(2, 9),
          type, category, amount, date: isBookingMode ? startDate : date,
          description: isBookingMode ? (description || `Location ${nights} nuits`) : description,
          booking: isBookingMode ? { 
            startDate, endDate, adults, children, nights, 
            pricePerNight: grossPricePerNight, 
            feesRate, taxRate, waterPerNight, elecPerNight 
          } : undefined
        }, repetition)}} className="p-6 space-y-5 overflow-y-auto">
          
          {/* Onglets Revenu/Dépense */}
          <div className="flex bg-slate-100 dark:bg-[#0f172a] rounded-xl p-1 border border-slate-200 dark:border-slate-800 transition-colors">
            <button 
              type="button"
              onClick={() => { setType(TransactionType.REVENUE); setCategory(Category.LOYER); }}
              className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${type === TransactionType.REVENUE ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 dark:text-slate-500'}`}
            >
              Revenu
            </button>
            <button 
              type="button"
              onClick={() => { setType(TransactionType.EXPENSE); if(category === Category.LOYER) setCategory(Category.CHARGES); }}
              className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-500'}`}
            >
              Dépense
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Catégorie</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value as Category)} 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none appearance-none transition-colors"
            >
              {Object.values(Category).map(cat => (
                <option key={cat} value={cat} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{cat}</option>
              ))}
            </select>
          </div>

          {isBookingMode ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Montant Brut Nuitée (€)</label>
                <input 
                  type="number" 
                  value={grossPricePerNight} 
                  onChange={(e) => setGrossPricePerNight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                />
                <div className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-400 text-[10px] font-black transition-colors">
                  Soit {(grossPricePerNight * 7).toFixed(2)} € / semaine
                </div>
              </div>

              {/* Module de calcul détaillé */}
              <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 space-y-4 shadow-inner transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Total Brut Séjour ({nights} nuits):</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{calculations.totalBrut.toFixed(2)} €</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 transition-colors">Taux Frais (%)</label>
                    <input type="number" step="0.1" value={feesRate} onChange={e => setFeesRate(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 transition-colors">Taux Impôt (%)</label>
                    <input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs outline-none transition-colors" />
                    <p className="text-[8px] text-slate-500 italic">sur 50% du brut</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 transition-colors">Coût Eau/Nuit (€)</label>
                    <input type="number" step="0.1" value={waterPerNight} onChange={e => setWaterPerNight(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 transition-colors">Coût Elec/Nuit (€)</label>
                    <input type="number" step="0.1" value={elecPerNight} onChange={e => setElecPerNight(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs outline-none transition-colors" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 transition-colors">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-rose-600 dark:text-rose-400">- Total Frais:</span>
                    <span className="text-rose-600 dark:text-rose-400">{calculations.totalFrais.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-rose-600 dark:text-rose-400">- Total Impôts:</span>
                    <span className="text-rose-600 dark:text-rose-400">{calculations.totalImpots.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-rose-600 dark:text-rose-400">- Total Eau ({nights}n):</span>
                    <span className="text-rose-600 dark:text-rose-400">{calculations.totalEau.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-rose-600 dark:text-rose-400">- Total Elec ({nights}n):</span>
                    <span className="text-rose-600 dark:text-rose-400">{calculations.totalElec.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center transition-colors">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">Montant Net par Nuit:</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">{calculations.netPerNight.toFixed(2)} €</span>
                </div>

                <div className="pt-2 flex justify-between items-center transition-colors">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">Net Séjour à Enregistrer:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{calculations.netSejour.toFixed(2)} €</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Date</label>
                <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm transition-colors">
                  {startDate ? `Du ${new Date(startDate).toLocaleDateString()} au ${endDate ? new Date(endDate).toLocaleDateString() : '...'}` : 'Choisir sur calendrier'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-inner transition-colors">
                 <h3 className="text-pink-600 dark:text-pink-500 font-black text-[10px] uppercase tracking-wider">Détails de la réservation</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1 tracking-widest uppercase">Adultes (1-4)</label>
                      <select value={adults} onChange={(e) => setAdults(parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-sm outline-none transition-colors">
                        {[1, 2, 3, 4].map(n => <option key={n} value={n} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1 tracking-widest uppercase">Enfants (Max {4-adults})</label>
                      <select value={children} onChange={(e) => setChildren(parseInt(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-sm outline-none transition-colors">
                        {Array.from({length: (4 - adults) + 1}, (_, i) => (
                          <option key={i} value={i} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{i}</option>
                        ))}
                      </select>
                    </div>
                 </div>
                 {renderMiniCalendar()}
              </div>
            </div>
          ) : (
            /* Mode Dépense classique */
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Montant (€)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Description</label>
                <div className="flex flex-wrap gap-2">
                  {quickChips.map(chip => (
                    <button key={chip} type="button" onClick={() => setDescription(chip)} className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${description === chip ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-500'}`}>{chip}</button>
                  ))}
                </div>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Autre charge..." className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none transition-colors" />
              </div>
              {renderMiniCalendar()}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-[#0f172a]/50 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 shadow-inner transition-colors">
             <label className="block text-[10px] font-black text-blue-700 dark:text-blue-400 mb-2 tracking-widest uppercase transition-colors">Répétition</label>
             <div className="flex items-center gap-3">
               <input type="number" min="1" max="24" value={repetition} onChange={(e) => setRepetition(parseInt(e.target.value) || 1)} className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-bold outline-none transition-colors" />
               <span className="text-xs text-slate-500 font-bold transition-colors">mois</span>
             </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-black rounded-2xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm">Annuler</button>
            <button type="submit" disabled={(isBookingMode && nights === 0) || (adults+children > 4)} className={`flex-[1.5] py-4 font-black rounded-2xl shadow-xl transition-all ${(isBookingMode && nights === 0) || (adults+children > 4) ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/20 active:scale-95'}`}>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
