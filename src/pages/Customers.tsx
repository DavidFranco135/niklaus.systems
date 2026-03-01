import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  History,
  X,
  Loader2,
  Users,
  CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Customer } from '../types';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    observations: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(items);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'customers'), {
          ...formData,
          debt: 0,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '', creditLimit: 0, observations: '' });
      fetchCustomers();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      creditLimit: customer.creditLimit,
      observations: customer.observations || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteDoc(doc(db, 'customers', id));
        fetchCustomers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-white/40">Gerencie sua base de clientes e fiados.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', email: '', address: '', creditLimit: 0, observations: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-neon-blue text-black font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-neon-blue/10 rounded-xl text-neon-blue">
            <Users size={24} />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Total de Clientes</p>
            <h3 className="text-2xl font-bold">{customers.length}</h3>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Total a Receber</p>
            <h3 className="text-2xl font-bold text-rose-500">R$ {customers.reduce((acc, c) => acc + (c.debt || 0), 0).toFixed(2)}</h3>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <History size={24} />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Limite Disponível</p>
            <h3 className="text-2xl font-bold text-emerald-500">R$ {customers.reduce((acc, c) => acc + (c.creditLimit - (c.debt || 0)), 0).toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          className="w-full bg-card-bg border border-border-subtle rounded-xl pl-12 pr-4 py-3 outline-none focus:border-neon-blue transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && customers.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-white/20">
            <Loader2 size={48} className="animate-spin text-neon-blue" />
            <p className="font-medium">Carregando clientes...</p>
          </div>
        ) : (
          customers.map((customer) => (
            <motion.div 
              key={customer.id}
              layout
              className="glass-card p-6 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neon-blue/10 rounded-2xl flex items-center justify-center text-neon-blue">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{customer.name}</h3>
                    <p className="text-xs text-white/40">Cliente desde {customer.createdAt?.toDate().toLocaleDateString() || 'Recente'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(customer)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-white/40 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <Phone size={16} className="text-white/20" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <Mail size={16} className="text-white/20" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-white/60">
                  <MapPin size={16} className="text-white/20" />
                  <span className="line-clamp-1">{customer.address}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Dívida Atual</p>
                  <p className={`text-lg font-black ${customer.debt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    R$ {customer.debt.toFixed(2)}
                  </p>
                </div>
                <button className="flex items-center gap-2 text-xs font-bold text-neon-blue hover:underline">
                  <History size={14} />
                  Histórico
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal for New/Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg glass-card p-8 my-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Telefone</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Email</label>
                  <input 
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Endereço</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Limite de Crédito (Fiado)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Observações</label>
                <textarea 
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue resize-none"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-neon-blue text-black rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={20} className="animate-spin" />}
                  {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
