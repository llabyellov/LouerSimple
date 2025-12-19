import React, { useState, useEffect } from 'react';
import { Transaction, ViewType, Category, TransactionType } from './types';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Analysis from './components/Analysis';
import CalendarView from './components/CalendarView';
import TransactionForm from './components/TransactionForm';
import { downloadJSON, exportToCSV } from './utils/data';
import { YEARS, MONTHS } from './constants';
import { 
  LayoutDashboard, List, PieChart, Save, 
  Upload, Trash2, Calendar as CalendarIcon, 
  Filter, RotateCcw, AlertCircle, Plus,
  FileSpreadsheet, Moon, Sun
} from 'lucide-react';

// CONNEXION SUPABASE
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const THEME_KEY = 'louersimple_theme_preference';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>();
  const [defaultType, setDefaultType] = useState<TransactionType>(TransactionType.REVENUE);
  const [defaultCategory, setDefaultCategory] = useState<Category>(Category.LOYER);
  
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger: boolean;
  }>({ show: false, title: '', message: '', onConfirm: () => {}, isDanger: false });

  const [selectedYear, setSelectedYear] = useState<number | 'All'>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'All'>('All');

  // 1. CHARGEMENT INITIAL DEPUIS LA BASE DE DONNÉES
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('interactions')
      .select('contenu')
      .order('id', { ascending: false });

    if (!error && data) {
      // On transforme le texte JSON stocké en objets Transactions
      const loaded = data.map(item => JSON.parse(item.contenu));
      setTransactions(loaded);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // 2. ÉCOUTE DU TEMPS RÉEL (Si quelqu'un d'autre ajoute une ligne)
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interactions' }, () => {
        fetchTransactions(); // On recharge tout quand un changement survient
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, String(isDark));
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // 3. SAUVEGARDE VERS LA BASE DE DONNÉES
  const handleSaveTransaction = async (transaction: Transaction, repetition: number = 1) => {
    // Note: Pour simplifier au maximum, on envoie la nouvelle transaction
    // Dans ta table Supabase colonne 'contenu' au format JSON texte.
    const { error } = await supabase
      .from('interactions')
      .insert([{ contenu: JSON.stringify(transaction) }]);

    if (error) alert("Erreur de sauvegarde : " + error.message);
    setIsFormOpen(false);
  };

  const requestDelete = (id: string) => {
    setConfirmAction({
      show: true,
      title: "Supprimer l'opération",
      message: "Note : La suppression est locale pour cet exemple. Pour la supprimer partout, il faut vider la table Supabase.",
      isDanger: true,
      onConfirm: () => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setConfirmAction(prev => ({ ...prev, show: false }));
      }
    });
  };

  const requestClearAll = () => {
    setConfirmAction({
      show: true,
      title: "Réinitialisation Totale",
      message: "Voulez-vous vider l'affichage ? (Les données restent sur Supabase)",
      isDanger: true,
      onConfirm: () => {
        setTransactions([]);
        setConfirmAction(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        try {
          const data = JSON.parse(event.target.result);
          if (Array.isArray(data)) {
            // Optionnel : Envoyer tout le fichier vers Supabase
            for(const t of data) {
               await supabase.from('interactions').insert([{ contenu: JSON.stringify(t) }]);
            }
          }
        } catch (err) { alert('Format invalide'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const openFormWithDate = (date: string) => {
    setPrefilledDate(date);
    setEditingTransaction(undefined);
    setDefaultType(TransactionType.REVENUE);
    setDefaultCategory(Category.LOYER);
    setIsFormOpen(true);
  };

  const handleAddNew = (type: TransactionType = TransactionType.REVENUE, cat: Category = Category.LOYER) => {
    setEditingTransaction(undefined);
    setPrefilledDate(undefined);
    setDefaultType(type);
    setDefaultCategory(cat);
    setIsFormOpen(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setPrefilledDate(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-200 transition-colors">
      {confirmAction.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-md">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-500">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-xl font-black">{confirmAction.title}</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(prev => ({ ...prev, show: false }))} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-colors">Annuler</button>
              <button onClick={confirmAction.onConfirm} className={`flex-1 py-3 font-bold rounded-xl text-white transition-colors ${confirmAction.isDanger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'}`}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('DASHBOARD')}>
              <div className="w-9 h-9 bg-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/20">
                <span className="text-white font-black text-lg">L</span>
              </div>
              <h1 className="text-xl font-black bg-gradient-to-r from-pink-600 to-violet-600 dark:from-pink-500 dark:to-violet-500 bg-clip-text text-transparent hidden sm:block">LouerSimple</h1>
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {[
              { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Bord' },
              { id: 'CALENDAR', icon: CalendarIcon, label: 'Agenda' },
              { id: 'LIST', icon: List, label: 'Journal' },
              { id: 'ANALYSIS', icon: PieChart, label: 'Analyse' }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setView(tab.id as ViewType)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
                <tab.icon className={`w-4 h-4 ${view === tab.id ? 'text-pink-600 dark:text-pink-400' : ''}`} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => downloadJSON(transactions)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Sauvegarder JSON"><Save className="w-5 h-5" /></button>
            <button onClick={handleRestore} className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Restaurer JSON"><Upload className="w-5 h-5" /></button>
            <button onClick={() => exportToCSV(transactions)} className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="Exporter Excel/CSV"><FileSpreadsheet className="w-5 h-5" /></button>
            <button onClick={requestClearAll} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 transition-colors" title="Vider tout"><Trash2 className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <div className="fixed top-16 left-0 right-0 z-40 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/50 py-3 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <Filter className="w-3.5 h-3.5 text-pink-600 dark:text-pink-500" />
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value))} 
                className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="All" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Toutes les années</option>
                {YEARS.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <CalendarIcon className="w-3.5 h-3.5 text-pink-600 dark:text-pink-500" />
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value === 'All' ? 'All' : parseInt(e.target.value))} 
                className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="All" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Tous les mois</option>
                {MONTHS.map((m, i) => <option key={m} value={i} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{m}</option>)}
              </select>
            </div>
            {(selectedYear !== 'All' || selectedMonth !== 'All') && (
              <button onClick={() => { setSelectedYear('All'); setSelectedMonth('All'); }} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          {view === 'DASHBOARD' && (
            <button onClick={() => handleAddNew()} className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-lg border border-pink-600 dark:border-pink-500 flex items-center gap-2 shadow-lg shadow-pink-600/20 active:scale-95 transition-all">
              <Plus className="w-3.5 h-3.5" /> Nouveau
            </button>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-36 pb-12 transition-all duration-300">
        {view === 'DASHBOARD' && (
          <Dashboard transactions={transactions} selectedYear={selectedYear} selectedMonth={selectedMonth} setMonth={setSelectedMonth} onAdd={handleAddNew} />
        )}
        {view === 'CALENDAR' && (
          <CalendarView transactions={transactions} onSelectDate={openFormWithDate} selectedYear={selectedYear} selectedMonth={selectedMonth} />
        )}
        {view === 'LIST' && (
          <TransactionList transactions={transactions} onEdit={handleEdit} onDelete={requestDelete} selectedYear={selectedYear} selectedMonth={selectedMonth} />
        )}
        {view === 'ANALYSIS' && (
          <Analysis transactions={transactions} selectedYear={selectedYear} selectedMonth={selectedMonth} />
        )}
      </main>

      {isFormOpen && (
        <TransactionForm 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleSaveTransaction} 
          initialData={editingTransaction} 
          prefilledDate={prefilledDate} 
          existingTransactions={transactions}
          defaultType={defaultType}
          defaultCategory={defaultCategory}
        />
      )}
    </div>
  );
};

export default App;
