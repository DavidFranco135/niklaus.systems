import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight,
  ArrowDownRight, Plus, Search, Filter, Download, Loader2, X,
  ChevronDown, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { Transaction } from '../types';
import * as XLSX from 'xlsx';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const INCOME_CATS = ['Vendas','Serviços','Outros Recebimentos'];
const EXPENSE_CATS = ['Fornecedor','Aluguel','Salário','Energia','Água','Telefone','Marketing','Equipamentos','Impostos','Outros'];

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ type:'expense' as 'income'|'expense', category:'', amount:0, description:'' });

  // Filtros
  const now = new Date();
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const years = Array.from({length:4}, (_,i) => now.getFullYear()-i);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'transactions'), orderBy('date', 'desc')));
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), { ...formData, date: serverTimestamp() });
      setIsModalOpen(false);
      setFormData({ type:'expense', category:'', amount:0, description:'' });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Filtrar por mês/ano e tipo
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      let dt: Date;
      try { dt = t.date?.toDate(); } catch { return true; }
      const matchPeriod = dt.getMonth() === filterMonth && dt.getFullYear() === filterYear;
      const matchType = filterType === 'all' || t.type === filterType;
      const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.toLowerCase().includes(search.toLowerCase());
      return matchPeriod && matchType && matchSearch;
    });
  }, [transactions, filterMonth, filterYear, filterType, search]);

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((a,t) => a+t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((a,t) => a+t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Exportar Excel com filtro de período
  const exportExcel = () => {
    const data = filtered.map(t => ({
      Data: (() => { try { return t.date?.toDate().toLocaleString('pt-BR'); } catch { return '—'; }})(),
      Tipo: t.type === 'income' ? 'Entrada' : 'Saída',
      Categoria: t.category ?? '—',
      Descrição: t.description ?? '—',
      Valor: `R$ ${t.amount.toFixed(2)}`,
    }));
    const summary = [
      { Data:'RESUMO', Tipo:'', Categoria:'', Descrição:'Total Entradas', Valor: `R$ ${totalIncome.toFixed(2)}` },
      { Data:'', Tipo:'', Categoria:'', Descrição:'Total Saídas', Valor: `R$ ${totalExpense.toFixed(2)}` },
      { Data:'', Tipo:'', Categoria:'', Descrição:'Saldo', Valor: `R$ ${balance.toFixed(2)}` },
      { Data:'', Tipo:'', Categoria:'', Descrição:'', Valor:'' },
      ...data,
    ];
    if (!data.length) { alert('Nenhuma transação no período selecionado.'); return; }
    const ws = XLSX.utils.json_to_sheet(summary);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
    XLSX.writeFile(wb, `financeiro_${MONTHS[filterMonth]}${filterYear}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-white/40">Controle seu fluxo de caixa e finanças.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Filtro de mês e ano */}
          <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm">
            {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportExcel}
            className="flex items-center gap-2 bg-white/5 border border-white/10 font-bold px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-sm">
            <Download size={18}/> Exportar
          </button>
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-neon-blue text-black font-bold px-5 py-3 rounded-xl hover:brightness-110 transition-all text-sm">
            <Plus size={18}/> Nova Transação
          </button>
        </div>
      </header>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <TrendingUp size={80} className="text-emerald-500"/>
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Entradas — {MONTHS[filterMonth]}/{filterYear}</p>
          <h3 className="text-3xl font-black text-emerald-500">R$ {totalIncome.toFixed(2)}</h3>
          <p className="text-xs text-emerald-500/60 mt-2 flex items-center gap-1"><ArrowUpRight size={12}/>{filtered.filter(t=>t.type==='income').length} transações</p>
        </div>
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <TrendingDown size={80} className="text-rose-500"/>
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Saídas — {MONTHS[filterMonth]}/{filterYear}</p>
          <h3 className="text-3xl font-black text-rose-500">R$ {totalExpense.toFixed(2)}</h3>
          <p className="text-xs text-rose-500/60 mt-2 flex items-center gap-1"><ArrowDownRight size={12}/>{filtered.filter(t=>t.type==='expense').length} transações</p>
        </div>
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <DollarSign size={80} className="text-neon-blue"/>
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Saldo do Mês</p>
          <h3 className={`text-3xl font-black ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {balance.toFixed(2)}</h3>
          <p className="text-xs text-white/40 mt-2 flex items-center gap-1"><Calendar size={12}/>{filtered.length} total transações</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-wrap items-center gap-3 bg-white/5">
          <h3 className="font-bold text-lg flex-shrink-0">Transações — {MONTHS[filterMonth]}/{filterYear}</h3>
          <div className="flex gap-3 flex-1 flex-wrap justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={15}/>
              <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-neon-blue w-44"/>
            </div>
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
              {[['all','Todos'],['income','Entradas'],['expense','Saídas']].map(([v,l]) => (
                <button key={v} onClick={() => setFilterType(v)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${filterType===v ? 'bg-neon-blue text-black' : 'text-white/40 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
            <span className="text-white/30 text-sm self-center">{filtered.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3 text-center">Tipo</th>
                <th className="px-5 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center text-white/20">
                  <Loader2 size={32} className="animate-spin mx-auto mb-2"/>Carregando...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-white/20">
                  <DollarSign size={40} className="mx-auto mb-2 opacity-20"/>Nenhuma transação no período
                </td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5 text-white/40 text-xs whitespace-nowrap">
                    {(() => { try { return t.date?.toDate().toLocaleString('pt-BR'); } catch { return '—'; }})()}
                  </td>
                  <td className="px-5 py-3.5 font-medium max-w-[200px] truncate">{t.description || '—'}</td>
                  <td className="px-5 py-3.5 text-white/40">{t.category || '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
                      t.type==='income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.type==='income' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-right font-bold ${t.type==='income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {t.type==='income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nova transação */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}/>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="relative w-full max-w-md glass-card p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Nova Transação</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white">
                  <X size={18}/>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl">
                  <button type="button" onClick={() => setFormData(f => ({...f, type:'income', category:''}))}
                    className={`py-3 rounded-lg text-sm font-bold transition-all ${formData.type==='income' ? 'bg-emerald-500 text-black' : 'text-white/40'}`}>
                    + Entrada
                  </button>
                  <button type="button" onClick={() => setFormData(f => ({...f, type:'expense', category:''}))}
                    className={`py-3 rounded-lg text-sm font-bold transition-all ${formData.type==='expense' ? 'bg-rose-500 text-white' : 'text-white/40'}`}>
                    − Saída
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Categoria</label>
                  <select required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"
                    value={formData.category} onChange={e => setFormData(f => ({...f, category:e.target.value}))}>
                    <option value="">Selecionar categoria...</option>
                    {(formData.type==='income' ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Valor (R$)</label>
                  <input type="number" required min="0.01" step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"
                    value={formData.amount||''} onChange={e => setFormData(f => ({...f, amount:parseFloat(e.target.value)||0}))}/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Descrição</label>
                  <input type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"
                    placeholder="Ex: Compra de estoque, pagamento de aluguel..."
                    value={formData.description} onChange={e => setFormData(f => ({...f, description:e.target.value}))}/>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-neon-blue text-black font-bold py-3.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <Loader2 size={18} className="animate-spin"/>} Salvar Transação
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
