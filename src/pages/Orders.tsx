import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ExternalLink,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, limit, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Sale } from '../types';

export default function Orders() {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Real-time listener for online orders
    const q = query(
      collection(db, 'sales'), 
      where('type', '==', 'online'),
      orderBy('date', 'desc'), 
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setOrders(items);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'sales', orderId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  const stats = {
    pending: orders.filter(o => o.status === 'Pendente').length,
    preparing: orders.filter(o => o.status === 'Preparando').length,
    shipped: orders.filter(o => o.status === 'Enviado').length,
    completed: orders.filter(o => o.status === 'Concluído').length,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos Online</h1>
          <p className="text-white/40">Gerencie vendas do seu catálogo digital.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
            <ExternalLink size={20} />
            Ver Catálogo
          </button>
          <button className="flex items-center gap-2 bg-neon-blue text-black font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all">
            Configurar Loja
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`glass-card p-6 flex flex-col gap-4 transition-all cursor-pointer ${filter === 'Pendente' ? 'border-neon-blue ring-1 ring-neon-blue' : ''}`} onClick={() => setFilter('Pendente')}>
          <div className="flex items-center justify-between">
            <div className="p-3 bg-neon-blue/10 rounded-xl text-neon-blue">
              <Clock size={24} />
            </div>
            <span className="text-2xl font-bold">{stats.pending}</span>
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Pendentes</p>
        </div>
        <div className={`glass-card p-6 flex flex-col gap-4 transition-all cursor-pointer ${filter === 'Preparando' ? 'border-amber-500 ring-1 ring-amber-500' : ''}`} onClick={() => setFilter('Preparando')}>
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <ShoppingBag size={24} />
            </div>
            <span className="text-2xl font-bold">{stats.preparing}</span>
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Em Preparo</p>
        </div>
        <div className={`glass-card p-6 flex flex-col gap-4 transition-all cursor-pointer ${filter === 'Enviado' ? 'border-violet-500 ring-1 ring-violet-500' : ''}`} onClick={() => setFilter('Enviado')}>
          <div className="flex items-center justify-between">
            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
              <Truck size={24} />
            </div>
            <span className="text-2xl font-bold">{stats.shipped}</span>
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Em Rota</p>
        </div>
        <div className={`glass-card p-6 flex flex-col gap-4 transition-all cursor-pointer ${filter === 'Concluído' ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}`} onClick={() => setFilter('Concluído')}>
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-2xl font-bold">{stats.completed}</span>
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Concluídos</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Buscar por cliente ou número do pedido..."
            className="w-full bg-card-bg border border-border-subtle rounded-xl pl-12 pr-4 py-3 outline-none focus:border-neon-blue transition-colors"
          />
        </div>
        <button 
          onClick={() => setFilter('all')}
          className={`flex items-center gap-2 px-4 py-3 bg-card-bg border border-border-subtle rounded-xl transition-all ${filter === 'all' ? 'text-neon-blue border-neon-blue' : 'text-white/60 hover:text-white'}`}
        >
          <Filter size={20} />
          Todos
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin text-neon-blue mx-auto mb-4" size={48} />
            <p className="text-white/40 font-bold uppercase tracking-widest">Sincronizando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center glass-card">
            <ShoppingBag className="mx-auto mb-4 opacity-10" size={64} />
            <p className="text-white/40 font-bold uppercase tracking-widest">Nenhum pedido encontrado</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div 
              key={order.id}
              whileHover={{ x: 5 }}
              className="glass-card p-6 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">#{order.id?.slice(-6)}</span>
                  <span className="text-lg font-bold mt-1">{order.customerName || 'Cliente Anônimo'}</span>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Itens</span>
                  <span className="text-sm font-medium mt-1">
                    {order.items.length} {order.items.length === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total</span>
                  <span className="text-sm font-bold mt-1 text-neon-blue">R$ {order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id!, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer ${
                      order.status === 'Pendente' ? 'bg-neon-blue/10 text-neon-blue' :
                      order.status === 'Preparando' ? 'bg-amber-500/10 text-amber-500' :
                      order.status === 'Enviado' ? 'bg-violet-500/10 text-violet-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    <option value="Pendente" className="bg-dark-bg">Pendente</option>
                    <option value="Preparando" className="bg-dark-bg">Preparando</option>
                    <option value="Enviado" className="bg-dark-bg">Enviado</option>
                    <option value="Concluído" className="bg-dark-bg">Concluído</option>
                    <option value="Cancelado" className="bg-dark-bg">Cancelado</option>
                  </select>
                  <span className="text-[10px] text-white/40 mt-1 font-bold">
                    {order.date?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <ChevronRight size={20} className="text-white/20 group-hover:text-neon-blue transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
