import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes, ArrowUpRight, ArrowDownRight, AlertTriangle, Search,
  Filter, History, Plus, Loader2, Package, X, Download,
  SlidersHorizontal, ChevronDown, RefreshCw, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import {
  collection, getDocs, query, orderBy, limit, serverTimestamp,
  addDoc, doc, updateDoc, increment, where, Timestamp
} from 'firebase/firestore';
import { Product, InventoryMovement } from '../types';
import * as XLSX from 'xlsx';

const CATEGORIES = ['Todos','Alimentos','Bebidas','Limpeza','Higiene','Eletrônicos','Vestuário','Papelaria','Outros'];
const STOCK_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Estoque crítico (≤5)', value: 'critical' },
  { label: 'Estoque baixo (≤10)', value: 'low' },
  { label: 'Estoque ok (>10)', value: 'ok' },
  { label: 'Sem estoque (0)', value: 'zero' },
];
const MOVE_TYPES = [
  { label: 'Todos', value: 'all' },
  { label: 'Entradas', value: 'entry' },
  { label: 'Saídas', value: 'exit' },
  { label: 'Ajustes', value: 'adjustment' },
];

export default function Inventory() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState<'products' | 'movements'>('products');

  // Filtros de produtos
  const [searchProd, setSearchProd] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name'|'stock'|'category'>('name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  // Filtros de movimentações
  const [searchMove, setSearchMove] = useState('');
  const [moveType, setMoveType] = useState('all');
  const [moveDateFrom, setMoveDateFrom] = useState('');
  const [moveDateTo, setMoveDateTo] = useState('');

  const [formData, setFormData] = useState({
    productId: '', type: 'entry' as 'entry'|'exit'|'adjustment', quantity: 1, reason: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [snapProd, snapMove] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(query(collection(db, 'inventoryMovements'), orderBy('date', 'desc'), limit(200))),
      ]);
      setProducts(snapProd.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setMovements(snapMove.docs.map(d => ({ id: d.id, ...d.data() } as InventoryMovement)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === formData.productId);
    if (!product) return;
    setLoading(true);
    try {
      const qtyChange = formData.type === 'entry' ? formData.quantity : formData.type === 'exit' ? -formData.quantity : formData.quantity;
      await addDoc(collection(db, 'inventoryMovements'), {
        productId: formData.productId, productName: product.name,
        type: formData.type, quantity: formData.quantity,
        reason: formData.reason, date: serverTimestamp(), user: 'Admin'
      });
      await updateDoc(doc(db, 'products', formData.productId), { stock: increment(qtyChange) });
      setIsModalOpen(false);
      setFormData({ productId: '', type: 'entry', quantity: 1, reason: '' });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Filtros de produtos ──────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (searchProd) {
      const q = searchProd.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q));
    }
    if (catFilter !== 'Todos') list = list.filter(p => p.category === catFilter);
    if (stockFilter === 'critical') list = list.filter(p => p.stock <= 5 && p.stock > 0);
    else if (stockFilter === 'low') list = list.filter(p => p.stock <= 10 && p.stock > 0);
    else if (stockFilter === 'ok') list = list.filter(p => p.stock > 10);
    else if (stockFilter === 'zero') list = list.filter(p => p.stock === 0);
    list.sort((a, b) => {
      let va: any = a[sortBy as keyof Product] ?? '';
      let vb: any = b[sortBy as keyof Product] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [products, searchProd, catFilter, stockFilter, sortBy, sortDir]);

  // ── Filtros de movimentações ─────────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    let list = [...movements];
    if (searchMove) {
      const q = searchMove.toLowerCase();
      list = list.filter(m => m.productName?.toLowerCase().includes(q) || m.reason?.toLowerCase().includes(q));
    }
    if (moveType !== 'all') list = list.filter(m => m.type === moveType);
    if (moveDateFrom) {
      const from = new Date(moveDateFrom + 'T00:00:00');
      list = list.filter(m => { try { return m.date?.toDate() >= from; } catch { return true; }});
    }
    if (moveDateTo) {
      const to = new Date(moveDateTo + 'T23:59:59');
      list = list.filter(m => { try { return m.date?.toDate() <= to; } catch { return true; }});
    }
    return list;
  }, [movements, searchMove, moveType, moveDateFrom, moveDateTo]);

  // ── Exportar Excel ───────────────────────────────────────────────────────
  const exportExcel = () => {
    const data = filteredProducts.map(p => ({
      Produto: p.name, Categoria: p.category ?? '', Estoque: p.stock,
      'Preço Venda': p.price, 'Preço Custo': p.costPrice ?? '',
      Status: p.stock === 0 ? 'Sem Estoque' : p.stock <= 5 ? 'Crítico' : p.stock <= 10 ? 'Baixo' : 'OK'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
    XLSX.writeFile(wb, `estoque_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const stats = {
    total: products.reduce((a, p) => a + p.stock, 0),
    critical: products.filter(p => p.stock <= 5 && p.stock > 0).length,
    zero: products.filter(p => p.stock === 0).length,
    value: products.reduce((a, p) => a + (p.stock * (p.costPrice ?? p.price ?? 0)), 0),
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-white/40">Controle e movimentações de inventário.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel}
            className="flex items-center gap-2 bg-white/5 border border-white/10 font-bold px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-sm">
            <Download size={18}/> Exportar
          </button>
          <button onClick={fetchData}
            className="flex items-center gap-2 bg-white/5 border border-white/10 font-bold px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-sm">
            <RefreshCw size={18}/>
          </button>
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-neon-blue text-black font-bold px-5 py-3 rounded-xl hover:brightness-110 transition-all text-sm">
            <Plus size={18}/> Movimentação
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Unidades', val: `${stats.total} un.`, color: 'emerald', icon: Package },
          { label: 'Estoque Crítico', val: stats.critical, color: 'rose', icon: AlertTriangle },
          { label: 'Sem Estoque', val: stats.zero, color: 'amber', icon: Boxes },
          { label: 'Valor em Estoque', val: `R$ ${stats.value.toFixed(0)}`, color: 'neon-blue', icon: BarChart3 },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 flex items-center gap-4">
            <div className={`p-2.5 bg-${s.color}-500/10 rounded-xl text-${s.color}-500`}>
              <s.icon size={20}/>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
              <h3 className={`text-xl font-bold ${s.color === 'neon-blue' ? 'text-neon-blue' : `text-${s.color}-500`}`}>{s.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {[['products','Produtos'], ['movements','Movimentações']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v as any)}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab===v ? 'bg-neon-blue text-black' : 'text-white/40 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── PRODUTOS ── */}
      {tab === 'products' && (
        <div className="glass-card overflow-hidden">
          {/* Filtros */}
          <div className="p-4 border-b border-white/5 flex flex-wrap gap-3 bg-white/5">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16}/>
              <input type="text" placeholder="Buscar produto, categoria, código..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-neon-blue transition-colors"
                value={searchProd} onChange={e => setSearchProd(e.target.value)}/>
            </div>
            <Select value={catFilter} onChange={setCatFilter} options={CATEGORIES.map(c => ({l:c,v:c}))} icon={<Filter size={14}/>}/>
            <Select value={stockFilter} onChange={setStockFilter}
              options={STOCK_FILTERS.map(f => ({l:f.label,v:f.value}))} icon={<SlidersHorizontal size={14}/>}/>
            <span className="text-white/30 text-sm self-center">{filteredProducts.length} itens</span>
          </div>
          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-5 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                    Produto {sortBy==='name' && (sortDir==='asc'?'↑':'↓')}
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('category')}>
                    Categoria {sortBy==='category' && (sortDir==='asc'?'↑':'↓')}
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-white text-right" onClick={() => toggleSort('stock')}>
                    Estoque {sortBy==='stock' && (sortDir==='asc'?'↑':'↓')}
                  </th>
                  <th className="px-5 py-3 text-right">Preço</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="py-16 text-center text-white/20">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2"/>Carregando...
                  </td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-white/20">
                    <Package size={40} className="mx-auto mb-2 opacity-20"/>Nenhum produto encontrado
                  </td></tr>
                ) : filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{p.name}</td>
                    <td className="px-5 py-3.5 text-white/40">{p.category ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right font-bold">
                      <span className={`${p.stock === 0 ? 'text-rose-500' : p.stock <= 5 ? 'text-rose-400' : p.stock <= 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-white/60">R$ {p.price?.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                        p.stock === 0 ? 'bg-rose-500/20 text-rose-500' :
                        p.stock <= 5 ? 'bg-rose-500/10 text-rose-400' :
                        p.stock <= 10 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-emerald-500/10 text-emerald-500'}`}>
                        {p.stock === 0 ? 'Esgotado' : p.stock <= 5 ? 'Crítico' : p.stock <= 10 ? 'Baixo' : 'OK'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => { setFormData(f => ({...f, productId: p.id!})); setIsModalOpen(true); }}
                        className="p-1.5 bg-neon-blue/10 text-neon-blue rounded-lg hover:bg-neon-blue/20 transition-all">
                        <Plus size={15}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MOVIMENTAÇÕES ── */}
      {tab === 'movements' && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-wrap gap-3 bg-white/5">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16}/>
              <input type="text" placeholder="Buscar produto ou motivo..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-neon-blue transition-colors"
                value={searchMove} onChange={e => setSearchMove(e.target.value)}/>
            </div>
            <Select value={moveType} onChange={setMoveType}
              options={MOVE_TYPES.map(m => ({l:m.label,v:m.value}))} icon={<Filter size={14}/>}/>
            <input type="date" value={moveDateFrom} onChange={e => setMoveDateFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neon-blue transition-colors"/>
            <input type="date" value={moveDateTo} onChange={e => setMoveDateTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-neon-blue transition-colors"/>
            {(searchMove||moveType!=='all'||moveDateFrom||moveDateTo) && (
              <button onClick={() => { setSearchMove(''); setMoveType('all'); setMoveDateFrom(''); setMoveDateTo(''); }}
                className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-rose-400 text-sm transition-colors flex items-center gap-1">
                <X size={13}/> Limpar
              </button>
            )}
            <span className="text-white/30 text-sm self-center">{filteredMovements.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Motivo</th>
                  <th className="px-5 py-3 text-right">Qtd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="py-16 text-center text-white/20">
                    <Loader2 size={32} className="animate-spin mx-auto mb-2"/>Carregando...
                  </td></tr>
                ) : filteredMovements.length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center text-white/20">
                    <History size={40} className="mx-auto mb-2 opacity-20"/>Nenhuma movimentação encontrada
                  </td></tr>
                ) : filteredMovements.map(m => (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 text-white/40 text-xs whitespace-nowrap">
                      {(() => { try { return m.date?.toDate().toLocaleString('pt-BR'); } catch { return '—'; }})()}
                    </td>
                    <td className="px-5 py-3.5 font-medium">{m.productName}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                        m.type==='entry' ? 'bg-emerald-500/10 text-emerald-500' :
                        m.type==='exit' ? 'bg-rose-500/10 text-rose-500' : 'bg-white/10 text-white/60'}`}>
                        {m.type==='entry' ? 'Entrada' : m.type==='exit' ? 'Saída' : 'Ajuste'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/40 text-xs max-w-[200px] truncate">{m.reason || '—'}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${m.type==='entry' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {m.type==='entry' ? '+' : '-'}{m.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de movimentação */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}/>
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="relative w-full max-w-md glass-card p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Movimentação de Estoque</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white">
                  <X size={18}/>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Produto</label>
                  <select required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"
                    value={formData.productId} onChange={e => setFormData({...formData, productId:e.target.value})}>
                    <option value="">Selecionar produto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Atual: {p.stock})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl">
                  {[['entry','Entrada','emerald'],['exit','Saída','rose'],['adjustment','Ajuste','amber']].map(([v,l,c]) => (
                    <button key={v} type="button" onClick={() => setFormData({...formData, type:v as any})}
                      className={`py-2.5 rounded-lg text-xs font-bold transition-all ${formData.type===v ? `bg-${c}-500 text-black` : 'text-white/40 hover:text-white'}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Quantidade</label>
                  <input type="number" required min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"
                    value={formData.quantity||''} onChange={e => setFormData({...formData, quantity:parseInt(e.target.value)||1})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Motivo / Observação</label>
                  <input type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"
                    placeholder="Ex: Compra de mercadoria, ajuste de inventário..."
                    value={formData.reason} onChange={e => setFormData({...formData, reason:e.target.value})}/>
                </div>
                <button type="submit" disabled={loading||!formData.productId}
                  className="w-full bg-neon-blue text-black font-bold py-3.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <Loader2 size={18} className="animate-spin"/>}
                  Confirmar Movimentação
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Select({ value, onChange, options, icon }: {
  value: string; onChange: (v:string)=>void;
  options: {l:string;v:string}[]; icon?: React.ReactNode
}) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`bg-white/5 border border-white/10 rounded-lg py-2.5 pr-8 text-sm outline-none focus:border-neon-blue transition-colors appearance-none ${icon ? 'pl-9' : 'pl-3'}`}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"/>
    </div>
  );
}
