import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, limit, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { Transaction } from '../types';

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: 0,
    description: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(items);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        ...formData,
        date: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ type: 'expense', category: '', amount: 0, description: '' });
      fetchTransactions();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-white/40">Controle seu fluxo de caixa e lucros.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
            <Download size={20} />
            Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-neon-blue text-black font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all"
          >
            <Plus size={20} />
            Nova Transação
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} className="text-emerald-500" />
          </div>
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-1">Entradas</p>
          <h3 className="text-3xl font-black text-emerald-500">R$ {totalIncome.toFixed(2)}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500 font-bold">
            <ArrowUpRight size={14} />
            <span>+12.5% vs mês anterior</span>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={80} className="text-rose-500" />
          </div>
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-1">Saídas</p>
          <h3 className="text-3xl font-black text-rose-500">R$ {totalExpense.toFixed(2)}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-500 font-bold">
            <ArrowDownRight size={14} />
            <span>+4.2% vs mês anterior</span>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={80} className="text-neon-blue" />
          </div>
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest mb-1">Saldo em Caixa</p>
          <h3 className="text-3xl font-black text-neon-blue">R$ {balance.toFixed(2)}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/40 font-bold">
            <Calendar size={14} />
            <span>Atualizado agora</span>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-white/5">
          <h3 className="font-bold text-lg">Últimas Transações</h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input 
                type="text"
                placeholder="Buscar..."
                className="bg-card-bg border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-neon-blue"
              />
            </div>
            <button className="p-2 bg-card-bg border border-border-subtle rounded-lg text-white/40 hover:text-white transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-white/40 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/20">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                    Carregando transações...
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-sm text-white/60">
                      {t.date?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{t.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold uppercase tracking-wider text-white/40">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for New Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md glass-card p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Nova Transação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-black' : 'text-white/40'}`}
                >
                  ENTRADA
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${formData.type === 'expense' ? 'bg-rose-500 text-black' : 'text-white/40'}`}
                >
                  SAÍDA
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Descrição</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Categoria</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="" className="bg-dark-bg">Selecionar...</option>
                  <option value="Venda" className="bg-dark-bg">Venda</option>
                  <option value="Fornecedor" className="bg-dark-bg">Fornecedor</option>
                  <option value="Aluguel" className="bg-dark-bg">Aluguel</option>
                  <option value="Salários" className="bg-dark-bg">Salários</option>
                  <option value="Marketing" className="bg-dark-bg">Marketing</option>
                  <option value="Outros" className="bg-dark-bg">Outros</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-neon-blue text-black font-bold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                Salvar Transação
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
