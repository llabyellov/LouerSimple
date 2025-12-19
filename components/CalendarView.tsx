
import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { MONTHS, YEARS } from '../constants';
import { ChevronLeft, ChevronRight, Users, Plus, Calendar as CalendarIcon, Lock, Baby } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onSelectDate: (date: string) => void;
  selectedYear: number | 'All';
  selectedMonth: number | 'All';
}

const CalendarView: React.FC<Props> = ({ transactions, onSelectDate, selectedYear, selectedMonth }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const isDark = document.documentElement.classList.contains('dark');
  
  // Synchroniser avec les filtres globaux si un mois/année spécifique est choisi
  useEffect(() => {
    const newDate = new Date(currentDate);
    let changed = false;
    
    if (selectedYear !== 'All' && selectedYear !== currentDate.getFullYear()) {
      newDate.setFullYear(selectedYear as number);
      changed = true;
    }
    
    if (selectedMonth !== 'All' && selectedMonth !== currentDate.getMonth()) {
      newDate.setMonth(selectedMonth as number);
      changed = true;
    }

    if (changed) {
      setCurrentDate(newDate);
    }
  }, [selectedYear, selectedMonth]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Start at Monday

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleYearChange = (y: number) => setCurrentDate(new Date(y, month, 1));
  const handleMonthChange = (m: number) => setCurrentDate(new Date(year, m, 1));

  const bookings = transactions.filter(t => t.category === Category.LOYER && t.booking);

  const getDayStatus = (d: Date) => {
    const dateStr = d.toLocaleDateString('en-CA');
    const bookingEnding = bookings.find(b => b.booking!.endDate === dateStr);
    const bookingStarting = bookings.find(b => b.booking!.startDate === dateStr);
    const bookingOngoing = bookings.find(b => b.booking!.startDate < dateStr && b.booking!.endDate > dateStr);

    return {
      isEnding: !!bookingEnding,
      isStarting: !!bookingStarting,
      isOngoing: !!bookingOngoing,
      mainBooking: bookingOngoing || bookingStarting || bookingEnding
    };
  };

  const handleDayClick = (day: number) => {
    const d = new Date(year, month, day);
    const { isOngoing } = getDayStatus(d);
    const isSaturday = d.getDay() === 6;

    // Si mid-stay et pas samedi, on bloque
    if (isOngoing && !isSaturday) {
      return;
    }

    const dateStr = d.toLocaleDateString('en-CA');
    onSelectDate(dateStr);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: adjustedFirstDay }, (_, i) => null);

  return (
    <div className="space-y-6 transition-colors">
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 items-center gap-2 transition-colors">
              <select 
                value={month} 
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase text-sm outline-none cursor-pointer"
              >
                {MONTHS.map((m, i) => <option key={m} value={i} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{m}</option>)}
              </select>
              <select 
                value={year} 
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-sm outline-none cursor-pointer"
              >
                {YEARS.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{y}</option>)}
              </select>
            </div>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 dark:text-slate-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 dark:text-slate-400">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 text-[10px] font-black uppercase tracking-wider">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-400 transition-colors"></div>
               <span className="text-emerald-600 dark:text-emerald-500 font-bold transition-colors">Libre</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500 transition-colors"></div>
               <span className="text-rose-600 dark:text-rose-500 font-bold transition-colors">Réservé</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(dayName => (
            <div key={dayName} className="text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest py-2 transition-colors">
              {dayName}
            </div>
          ))}
          
          {padding.map((_, i) => <div key={`pad-${i}`} className="aspect-square"></div>)}
          
          {days.map(day => {
            const d = new Date(year, month, day);
            const { isEnding, isStarting, isOngoing, mainBooking } = getDayStatus(d);
            const isToday = new Date().toDateString() === d.toDateString();
            const isSaturday = d.getDay() === 6;
            
            // Logic pour le samedi avec division diagonale
            const isReservedTop = isOngoing || isEnding;
            const isReservedBottom = isOngoing || isStarting;
            const isFullyReserved = !isSaturday && (isReservedTop || isReservedBottom);

            const topColorClass = isReservedTop ? 'fill-rose-500/20 dark:fill-rose-500/30' : (isDark ? 'fill-emerald-500/10' : 'fill-emerald-500/5');
            const bottomColorClass = isReservedBottom ? 'fill-rose-500/20 dark:fill-rose-500/30' : (isDark ? 'fill-emerald-500/10' : 'fill-emerald-500/5');

            return (
              <button 
                key={day} 
                onClick={() => handleDayClick(day)}
                disabled={isFullyReserved && !isSaturday}
                className={`group aspect-square rounded-2xl border transition-all flex flex-col justify-between text-left relative overflow-hidden ${
                  isFullyReserved 
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 cursor-not-allowed' 
                    : isSaturday 
                      ? 'bg-white dark:bg-transparent border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white' 
                      : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500/60 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-500/10'
                } ${isToday ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1e293b]' : ''}`}
              >
                {/* Background pour samedi: split diagonal */}
                {isSaturday && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polygon points="0,0 100,0 0,100" className={topColorClass} />
                    <polygon points="100,0 100,100 0,100" className={bottomColorClass} />
                    <line x1="100" y1="0" x2="0" y2="100" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" />
                  </svg>
                )}

                <div className="flex justify-between items-start z-10 w-full p-2">
                  <span className={`text-sm font-black ${isToday ? 'text-pink-600 dark:text-pink-500' : (isFullyReserved ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200')}`}>{day}</span>
                  {isFullyReserved && <Lock className="w-2.5 h-2.5 text-rose-500/50 transition-colors" />}
                </div>
                
                {!isFullyReserved && !mainBooking && (
                  <Plus className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 text-emerald-600 dark:text-emerald-500 transition-opacity z-10" />
                )}

                {mainBooking && (
                  <div className="flex flex-col gap-0.5 z-10 px-2 pb-2">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <div className="flex items-center gap-0.5">
                        <Users className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-slate-500 dark:text-slate-400 transition-colors" />
                        <span className="text-[8px] sm:text-[10px] font-black text-slate-700 dark:text-slate-200">{mainBooking.booking?.adults}</span>
                      </div>
                      {mainBooking.booking?.children > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Baby className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-slate-500 dark:text-slate-400 transition-colors" />
                          <span className="text-[8px] sm:text-[10px] font-black text-slate-700 dark:text-slate-200">{mainBooking.booking?.children}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-500 truncate mt-0.5 transition-colors">
                      {mainBooking.booking?.pricePerNight}€/n
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500 transition-colors">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white transition-colors">Gestion de l'Agenda</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Haut-gauche : Matin (Départ). Bas-droite : Après-midi (Arrivée). Prix et voyageurs affichés.</p>
          </div>
        </div>
        <button onClick={() => onSelectDate(new Date().toLocaleDateString('en-CA'))} className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-xl shadow-lg shadow-pink-600/20 transition-all flex items-center gap-2 active:scale-95">
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </div>
    </div>
  );
};

export default CalendarView;
