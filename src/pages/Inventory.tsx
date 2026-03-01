import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  Search, 
  Filter,
  History,
  Plus,
  Loader2,
  Package,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, limit, where, serverTimestamp, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { Product, InventoryMovement } from '../types';

export default function Inventory() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'entry' as 'entry' | 'exit' | 'adjustment',
    quantity: 0,
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Movements
      const qMovements = query(collection(db, 'inventoryMovements'), orderBy('date', 'desc'), limit(50));
      const snapMovements = await getDocs(qMovements);
      const itemsMovements = snapMovements.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryMovement));
      setMovements(itemsMovements);

      // Fetch Products for selection
      const snapProducts = await getDocs(collection(db, 'products'));
      const itemsProducts = snapProducts.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(itemsProducts);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const product = products.find(p => p.id === formData.productId);
      if (!product) return;

      const qtyChange = formData.type === 'entry' ? formData.quantity : -formData.quantity;

      // 1. Add Movement Record
      await addDoc(collection(db, 'inventoryMovements'), {
        productId: formData.productId,
        productName: product.name,
        type: formData.type,
        quantity: formData.quantity,
        reason: formData.reason,
        date: serverTimestamp(),
        user: 'Admin' // Should come from auth
      });

      // 2. Update Product Stock
      const productRef = doc(db, 'products', formData.productId);
      await updateDoc(productRef, {
        stock: increment(qtyChange)
      });

      setIsModalOpen(false);
      setFormData({ productId: '', type: 'entry', quantity: 0, reason: '' });
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter(p => p.stock <= 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-white/40">Controle de movimentações e níveis de estoque.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-neon-blue text-black font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all"
          >
            <Plus size={20} />
            Nova Movimentação
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <Package size={24} />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Total de Itens</p>
            <h3 className="text-2xl font-bold">{products.reduce((acc, p) => acc + p.stock, 0)} un.</h3>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 border-rose-500/30">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Itens Críticos</p>
            <h3 className="text-2xl font-bold text-rose-500">{lowStockProducts.length}</h3>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-neon-blue/10 rounded-xl text-neon-blue">
            <History size={24} />
          </div>
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Movimentações (Hoje)</p>
            <h3 className="text-2xl font-bold">{movements.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-white/5">
            <h3 className="font-bold">Histórico de Movimentações</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input 
                  type="text"
                  placeholder="Filtrar..."
                  className="bg-card-bg border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-neon-blue"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">Qtd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && movements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-white/20">
                      <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                      Carregando...
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white/40">
                        {m.date?.toDate().toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium">{m.productName}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                          m.type === 'entry' ? 'bg-emerald-500/10 text-emerald-500' : 
                          m.type === 'exit' ? 'bg-rose-500/10 text-rose-500' : 'bg-white/10 text-white/60'
                        }`}>
                          {m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Ajuste'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${m.type === 'entry' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {m.type === 'entry' ? '+' : '-'}{m.quantity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card flex flex-col">
          <div className="p-6 border-b border-border-subtle bg-white/5">
            <h3 className="font-bold">Alertas de Estoque</h3>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[500px]">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-white/20">
                <Package size={48} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhum alerta crítico</p>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-between group hover:bg-rose-500/10 transition-all">
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-rose-500/60">Estoque: {p.stock} un.</p>
                  </div>
                  <button className="p-2 bg-rose-500/10 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal for Inventory Movement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md glass-card p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Movimentação de Estoque</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Produto</label>
                <select 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                >
                  <option value="" className="bg-dark-bg">Selecionar produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} className="bg-dark-bg">
                      {p.name} (Atual: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'entry' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${formData.type === 'entry' ? 'bg-emerald-500 text-black' : 'text-white/40'}`}
                >
                  ENTRADA
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'exit' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${formData.type === 'exit' ? 'bg-rose-500 text-black' : 'text-white/40'}`}
                >
                  SAÍDA
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Quantidade</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Motivo / Observação</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  placeholder="Ex: Compra de mercadoria, Ajuste de inventário..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                disabled={loading || !formData.productId}
                className="w-full bg-neon-blue text-black font-bold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                Confirmar Movimentação
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
