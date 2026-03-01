import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  User,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { Customer } from '../types';

export default function Fiado() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'customers'), where('debt', '>', 0));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      // Update customer debt
      await updateDoc(doc(db, 'customers', selectedCustomer.id!), {
        debt: increment(-amount)
      });

      // Register transaction in finance
      await addDoc(collection(db, 'finance'), {
        type: 'income',
        category: 'Pagamento de Fiado',
        amount: amount,
        description: `Recebimento de fiado: ${selectedCustomer.name}`,
        date: serverTimestamp(),
        customerId: selectedCustomer.id
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedCustomer(null);
      alert('Pagamento registrado com sucesso!');
    } catch (error) {
      console.error(error);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebt = customers.reduce((acc, c) => acc + (c.debt || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fiado (Crédito)</h1>
          <p className="text-white/40">Controle de contas a receber de clientes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-rose-500/20">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Total a Receber</p>
          <h3 className="text-3xl font-bold text-rose-500">R$ {totalDebt.toFixed(2)}</h3>
          <div className="flex items-center gap-1 text-xs text-rose-500/60 mt-2">
            <ArrowUpRight size={14} />
            <span>{customers.length} clientes com débito</span>
          </div>
        </div>
        <div className="glass-card p-6">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Limite Médio</p>
          <h3 className="text-3xl font-bold">R$ 500,00</h3>
          <p className="text-xs text-white/40 mt-2">Configurado por cliente</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Risco de Inadimplência</p>
          <h3 className="text-3xl font-bold text-amber-500">Baixo</h3>
          <p className="text-xs text-white/40 mt-2">Baseado no histórico recente</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card-bg border border-border-subtle rounded-xl pl-12 pr-4 py-3 outline-none focus:border-neon-blue transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-neon-blue mx-auto mb-4" size={48} />
          <p className="text-white/40 font-bold uppercase tracking-widest">Carregando devedores...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-20 text-center glass-card">
          <CheckCircle2 className="mx-auto mb-4 text-emerald-500 opacity-20" size={64} />
          <p className="text-white/40 font-bold uppercase tracking-widest">Nenhum cliente com débito pendente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <motion.div 
              key={customer.id}
              whileHover={{ y: -5 }}
              className="glass-card p-6 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-neon-blue">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">{customer.name}</h4>
                    <p className="text-xs text-white/40 flex items-center gap-1">
                      <Calendar size={12} /> {customer.phone || 'Sem telefone'}
                    </p>
                  </div>
                </div>
                <span className="text-rose-500 font-bold">R$ {(customer.debt || 0).toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40 uppercase font-bold tracking-widest">Limite de Crédito</span>
                  <span className="text-white/60">R$ {(customer.creditLimit || 0).toFixed(2)}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.min(((customer.debt || 0) / (customer.creditLimit || 1)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/40 text-right">
                  {(((customer.debt || 0) / (customer.creditLimit || 1)) * 100).toFixed(1)}% utilizado
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 py-2.5 bg-emerald-500 text-black font-bold rounded-xl text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <DollarSign size={14} /> Receber
                </button>
                <button className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl text-xs hover:bg-white/10 transition-all">
                  Ver Detalhes
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card-bg border border-white/10 rounded-2xl p-8 w-full max-w-md space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Receber Pagamento</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/40 hover:text-white">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-4 bg-white/5 rounded-xl space-y-1">
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Cliente</p>
              <p className="font-bold text-lg">{selectedCustomer.name}</p>
              <p className="text-rose-500 font-bold">Débito Total: R$ {(selectedCustomer.debt || 0).toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Valor do Pagamento</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">R$</span>
                <input 
                  type="number"
                  step="0.01"
                  autoFocus
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-2xl font-bold outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={handlePayment}
                className="flex-1 py-4 bg-emerald-500 text-black font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
              >
                CONFIRMAR
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
