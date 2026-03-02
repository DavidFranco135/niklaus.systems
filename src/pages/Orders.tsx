import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Clock, CheckCircle2, Truck, ExternalLink,
  Search, Filter, ChevronRight, Loader2, X, Eye, Phone,
  MapPin, Package, RefreshCw, Bell, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import {
  collection, query, orderBy, limit, doc, updateDoc,
  onSnapshot, where, Timestamp
} from 'firebase/firestore';

interface Order {
  id?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  paymentMethod?: string;
  notes?: string;
  date?: any;
  type?: string;
}

const STATUS_OPTIONS = ['Pendente','Confirmado','Preparando','Pronto','Enviado','Concluído','Cancelado'];
const STATUS_COLORS: Record<string,string> = {
  'Pendente':   'bg-neon-blue/10 text-neon-blue',
  'Confirmado': 'bg-emerald-500/10 text-emerald-400',
  'Preparando': 'bg-amber-500/10 text-amber-400',
  'Pronto':     'bg-violet-500/10 text-violet-400',
  'Enviado':    'bg-blue-500/10 text-blue-400',
  'Concluído':  'bg-emerald-500/20 text-emerald-500',
  'Cancelado':  'bg-rose-500/10 text-rose-400',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [catalogSlug, setCatalogSlug] = useState('');

  // Buscar slug do catálogo e ativar listener de pedidos
  useEffect(() => {
    import('../services/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ doc: fDoc, getDoc }) => {
        getDoc(fDoc(db, 'adminSettings', 'catalog')).then(snap => {
          if (snap.exists()) setCatalogSlug(snap.data().slug ?? '');
        });
      });
    });

    // Listener em tempo real — busca em 'orders' E 'sales' com type=online
    const q = query(collection(db, 'orders'), orderBy('date', 'desc'), limit(100));
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });

    return () => unsub();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: Timestamp.now() });
      if (selected?.id === orderId) setSelected(o => o ? {...o, status} : null);
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch = !search || o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.id?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    pending:    orders.filter(o => o.status === 'Pendente').length,
    preparing:  orders.filter(o => ['Confirmado','Preparando'].includes(o.status)).length,
    shipping:   orders.filter(o => ['Pronto','Enviado'].includes(o.status)).length,
    done:       orders.filter(o => o.status === 'Concluído').length,
  };

  const catalogUrl = catalogSlug
    ? `${window.location.origin}/loja/${catalogSlug}`
    : `${window.location.origin}/loja`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos Online</h1>
          <p className="text-white/40">Gerencie pedidos recebidos pelo catálogo digital.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(catalogUrl, '_blank')}
            className="flex items-center gap-2 bg-white/5 border border-white/10 font-bold px-5 py-3 rounded-xl hover:bg-white/10 transition-all text-sm">
            <ExternalLink size={18}/> Ver Catálogo
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(catalogUrl); alert('Link copiado!'); }}
            className="flex items-center gap-2 bg-neon-blue text-black font-bold px-5 py-3 rounded-xl hover:brightness-110 transition-all text-sm">
            <Store size={18}/> Copiar Link
          </button>
        </div>
      </header>

      {/* Link da loja */}
      <div className="glass-card p-4 flex items-center gap-3 border-neon-blue/20">
        <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue"><Store size={18}/></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Link da sua loja online</p>
          <p className="text-sm text-neon-blue font-mono truncate">{catalogUrl}</p>
        </div>
        <button onClick={() => window.open(catalogUrl,'_blank')}
          className="px-3 py-2 bg-neon-blue/10 text-neon-blue rounded-lg text-xs font-bold hover:bg-neon-blue/20 transition-all whitespace-nowrap">
          Abrir Loja
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Pendentes', val:stats.pending, color:'neon-blue', icon:Clock, filter:'Pendente' },
          { label:'Em Preparo', val:stats.preparing, color:'amber', icon:ShoppingBag, filter:'Preparando' },
          { label:'Em Rota',   val:stats.shipping, color:'violet', icon:Truck, filter:'Enviado' },
          { label:'Concluídos', val:stats.done, color:'emerald', icon:CheckCircle2, filter:'Concluído' },
        ].map(s => (
          <div key={s.label} onClick={() => setStatusFilter(f => f===s.filter ? 'all' : s.filter)}
            className={`glass-card p-5 cursor-pointer transition-all hover:scale-[1.02] ${statusFilter===s.filter ? 'border-neon-blue ring-1 ring-neon-blue/30' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 bg-${s.color}-500/10 rounded-xl text-${s.color}-500`}><s.icon size={20}/></div>
              <span className="text-2xl font-bold">{s.val}</span>
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18}/>
          <input type="text" placeholder="Buscar por cliente ou ID do pedido..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-neon-blue transition-colors text-sm"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all','Pendente','Preparando','Enviado','Concluído','Cancelado'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${statusFilter===s ? 'bg-neon-blue text-black' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'}`}>
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de pedidos */}
      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin text-neon-blue mx-auto mb-4" size={40}/></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <ShoppingBag className="mx-auto mb-4 text-white/10" size={56}/>
          <p className="text-white/40 font-bold">Nenhum pedido encontrado</p>
          <p className="text-white/20 text-sm mt-1">Compartilhe o link da sua loja para receber pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <motion.div key={order.id} layout
              className="glass-card p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:border-neon-blue/20 transition-all"
              onClick={() => setSelected(order)}>
              {/* Info principal */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/30 uppercase">#{order.id?.slice(-6)}</span>
                  <span className="font-bold">{order.customerName || 'Cliente Anônimo'}</span>
                  {order.customerPhone && <span className="text-xs text-white/40">{order.customerPhone}</span>}
                </div>
                <div className="h-10 w-px bg-white/10 hidden md:block"/>
                <div className="hidden md:flex flex-col">
                  <span className="text-[10px] text-white/30 font-bold uppercase">Itens</span>
                  <span className="text-sm">{order.items?.length ?? 0} produto(s)</span>
                </div>
                <div className="h-10 w-px bg-white/10 hidden md:block"/>
                <div className="hidden md:flex flex-col">
                  <span className="text-[10px] text-white/30 font-bold uppercase">Total</span>
                  <span className="font-bold text-neon-blue">R$ {order.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Status + ação */}
              <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                <select value={order.status ?? 'Pendente'}
                  onChange={e => updateStatus(order.id!, e.target.value)}
                  disabled={updating === order.id}
                  className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer ${STATUS_COLORS[order.status ?? 'Pendente'] ?? 'bg-white/10 text-white/60'}`}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setSelected(order)}
                  className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-neon-blue hover:bg-neon-blue/10 transition-all">
                  <Eye size={16}/>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal detalhes do pedido */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelected(null)} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}/>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="relative w-full max-w-lg glass-card overflow-hidden">
              {/* Header do modal */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                <div>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Pedido #{selected.id?.slice(-6)}</p>
                  <h3 className="text-lg font-bold">{selected.customerName || 'Cliente Anônimo'}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-lg text-white/40">
                  <X size={18}/>
                </button>
              </div>
              {/* Corpo */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Info do cliente */}
                <div className="space-y-2">
                  {selected.customerPhone && (
                    <a href={`https://wa.me/55${selected.customerPhone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-emerald-400 hover:underline">
                      <Phone size={14}/> {selected.customerPhone}
                    </a>
                  )}
                  {selected.customerAddress && (
                    <p className="flex items-center gap-2 text-sm text-white/40">
                      <MapPin size={14}/> {selected.customerAddress}
                    </p>
                  )}
                </div>

                {/* Itens */}
                <div>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Itens do Pedido</p>
                  <div className="space-y-2">
                    {(selected.items || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-neon-blue/10 rounded-lg flex items-center justify-center text-neon-blue">
                            <Package size={14}/>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-white/40">x{item.quantity} × R$ {item.price?.toFixed(2)}</p>
                          </div>
                        </div>
                        <span className="font-bold text-sm">R$ {(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-xl">
                  <span className="font-bold">Total do Pedido</span>
                  <span className="text-xl font-black text-neon-blue">R$ {selected.total?.toFixed(2)}</span>
                </div>

                {selected.notes && (
                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Observação</p>
                    <p className="text-sm text-white/60">{selected.notes}</p>
                  </div>
                )}

                {/* Mudar status */}
                <div>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Atualizar Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUS_OPTIONS.filter(s => s !== 'Cancelado').map(s => (
                      <button key={s} onClick={() => updateStatus(selected.id!, s)}
                        disabled={updating===selected.id}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          selected.status===s ? 'bg-neon-blue text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WhatsApp */}
                {selected.customerPhone && (
                  <a href={`https://wa.me/55${selected.customerPhone.replace(/\D/g,'')}?text=Olá ${selected.customerName || ''}! Seu pedido está ${selected.status}.`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:brightness-110 transition-all text-sm">
                    <Phone size={16}/> Contatar via WhatsApp
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
