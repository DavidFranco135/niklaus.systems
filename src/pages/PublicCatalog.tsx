// src/pages/PublicCatalog.tsx
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Phone, Instagram, Facebook, Search, Plus, Minus,
  X, Loader2, Store, Package, Truck, CheckCircle2, Tag
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface CatalogConfig {
  storeName: string; description: string; primaryColor: string;
  logoUrl: string; bannerUrl: string; whatsapp: string;
  instagram: string; facebook: string; isActive: boolean;
  showPrices: boolean; allowOrders: boolean; slug: string;
}
interface CartItem { id: string; name: string; price: number; quantity: number; image?: string; }

export default function PublicCatalog() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<CatalogConfig | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '', payment: 'PIX' });

  useEffect(() => {
    const load = async () => {
      try {
        const cfgSnap = await getDoc(doc(db, 'adminSettings', 'catalog'));
        if (!cfgSnap.exists()) { setLoading(false); return; }
        const cfg = cfgSnap.data() as CatalogConfig;
        if (cfg.slug !== slug) { setLoading(false); return; }
        setConfig(cfg);
        document.documentElement.style.setProperty('--neon-color', cfg.primaryColor || '#00E5FF');

        // ✅ Busca todos os produtos Ativos (status == 'Ativo')
        // Com fallback para pegar tudo se não houver índice
        let prods: any[] = [];
        try {
          const q = query(collection(db, 'products'), where('status', '==', 'Ativo'));
          const snap = await getDocs(q);
          prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Se não retornou nada, tenta sem filtro (compatibilidade)
          if (prods.length === 0) {
            const all = await getDocs(collection(db, 'products'));
            prods = all.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => !p.status || p.status === 'Ativo' || p.status === 'active' || p.status === 'Active');
          }
        } catch {
          const all = await getDocs(collection(db, 'products'));
          prods = all.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        setProducts(prods);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [slug]);

  const addToCart = (p: any) => {
    if (p.stock !== undefined && p.stock <= 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, quantity: 1, image: p.imageUrl }];
    });
  };
  const removeFromCart = (id: string) => setCart(p => p.filter(i => i.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(p => p.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };
  const total = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const cartQty = cart.reduce((a, i) => a + i.quantity, 0);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'orders'), {
        customerName: form.name, customerPhone: form.phone,
        customerAddress: form.address, notes: form.notes,
        paymentMethod: form.payment,
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        total, status: 'Pendente', date: serverTimestamp(), type: 'online', source: 'catalog',
      });
      setOrdered(true);
      setCart([]);
      setCheckoutOpen(false);
    } catch (e) { console.error(e); alert('Erro ao enviar pedido. Tente novamente.'); }
    finally { setSending(false); }
  };

  const categories = ['Todos', ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)))];
  const filtered = products.filter((p: any) => {
    const ms = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'Todos' || p.category === catFilter;
    return ms && mc;
  });

  const neon = config?.primaryColor || '#00E5FF';

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 size={40} className="animate-spin" style={{ color: neon }} />
    </div>
  );
  if (!config) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
      <Store size={56} className="opacity-20" />
      <p className="text-xl font-bold">Loja não encontrada</p>
      <p className="text-white/40 text-sm">Verifique o link ou entre em contato com a loja.</p>
    </div>
  );
  if (!config.isActive) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-4">
      <Store size={56} className="opacity-20" />
      <p className="text-xl font-bold">Loja temporariamente fechada</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24">

      {/* Banner */}
      {config.bannerUrl && (
        <div className="w-full h-40 sm:h-56 md:h-64 overflow-hidden">
          <img src={config.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
        </div>
      )}

      {/* Header sticky */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {config.logoUrl
              ? <img src={config.logoUrl} alt="Logo" className="w-9 h-9 rounded-full object-cover border-2 shrink-0" style={{ borderColor: neon }} />
              : <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${neon}20` }}>
                <Store size={16} style={{ color: neon }} />
              </div>}
            <div className="min-w-0">
              <h1 className="font-black text-base sm:text-lg leading-tight truncate">{config.storeName}</h1>
              {config.description && <p className="text-xs text-white/40 truncate hidden sm:block">{config.description}</p>}
            </div>
          </div>
          {config.allowOrders && (
            <button onClick={() => setCartOpen(true)} className="relative p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${neon}15`, color: neon }}>
              <ShoppingCart size={20} />
              {cartQty > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-black" style={{ backgroundColor: neon }}>
                  {cartQty}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="text" placeholder="Buscar produtos..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 outline-none text-sm transition-colors"
            onFocus={e => e.currentTarget.style.borderColor = neon}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Categorias */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all"
                style={catFilter === cat
                  ? { backgroundColor: neon, color: '#000' }
                  : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Contagem */}
        <p className="text-xs text-white/30 font-medium">
          {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grid de produtos */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-white/20 space-y-3">
            <Package size={48} className="mx-auto opacity-20" />
            <p className="font-bold">Nenhum produto encontrado</p>
            {search && <p className="text-sm">Tente buscar por outro termo</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map(p => {
              const inCart = cart.find(i => i.id === p.id);
              const outOfStock = p.stock !== undefined && p.stock <= 0;
              return (
                <motion.div key={p.id} whileHover={{ y: -4 }} className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-white/20">

                  {/* Imagem */}
                  <div className="aspect-square bg-white/5 overflow-hidden relative">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-white/10"><Package size={32} /></div>}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-xs font-black text-white/60 uppercase tracking-widest">Indisponível</span>
                      </div>
                    )}
                    {p.category && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white/60">
                        {p.category}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <p className="font-bold text-sm leading-tight line-clamp-2">{p.name}</p>
                    {p.description && <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed">{p.description}</p>}

                    <div className="mt-auto space-y-2">
                      {config.showPrices !== false && (
                        <p className="font-black text-base" style={{ color: neon }}>
                          R$ {(p.price || 0).toFixed(2)}
                        </p>
                      )}

                      {config.allowOrders && (
                        outOfStock ? (
                          <div className="w-full py-2 rounded-xl text-center text-xs font-bold text-white/20 bg-white/5">
                            Indisponível
                          </div>
                        ) : inCart ? (
                          <div className="flex items-center justify-between bg-white/10 rounded-xl px-2 py-1">
                            <button onClick={() => updateQty(p.id, inCart.quantity - 1)} className="p-1 hover:text-white text-white/60 transition-colors"><Minus size={14} /></button>
                            <span className="font-black text-sm">{inCart.quantity}</span>
                            <button onClick={() => addToCart(p)} className="p-1 hover:text-white text-white/60 transition-colors"><Plus size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(p)}
                            className="w-full py-2 rounded-xl text-xs font-black text-black transition-all hover:brightness-110 active:scale-95"
                            style={{ backgroundColor: neon }}>
                            + Adicionar
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Rodapé contatos */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {config.whatsapp && (
              <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all">
                <Phone size={16} /> WhatsApp
              </a>
            )}
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-pink-500/10 text-pink-400 rounded-xl text-sm font-bold hover:bg-pink-500/20 transition-all">
                <Instagram size={16} /> Instagram
              </a>
            )}
            {config.facebook && (
              <a href={`https://facebook.com/${config.facebook}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-blue-500/10 text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-all">
                <Facebook size={16} /> Facebook
              </a>
            )}
          </div>
          <p className="text-center text-white/20 text-xs">Powered by NIKLAUS</p>
        </div>
      </div>

      {/* Pedido confirmado */}
      <AnimatePresence>
        {ordered && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${neon}20` }}>
                <CheckCircle2 size={32} style={{ color: neon }} />
              </div>
              <h2 className="text-xl font-black">Pedido Enviado!</h2>
              <p className="text-white/40 text-sm">Em breve entraremos em contato para confirmar seu pedido.</p>
              {config.whatsapp && (
                <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=Olá! Acabei de fazer um pedido no catálogo online.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-black font-black rounded-xl hover:brightness-110 transition-all">
                  <Phone size={16} /> Confirmar pelo WhatsApp
                </a>
              )}
              <button onClick={() => setOrdered(false)} className="w-full py-3 bg-white/5 text-white/60 font-bold rounded-xl hover:bg-white/10 transition-all">
                Continuar comprando
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer carrinho */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setCartOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-[#111] border-l border-white/10 flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold">Carrinho ({cartQty})</h2>
                <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white/40"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="py-20 text-center text-white/20 space-y-3">
                    <ShoppingCart size={40} className="mx-auto opacity-20" />
                    <p>Carrinho vazio</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden shrink-0">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <Package size={20} className="m-2 opacity-30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {config.showPrices !== false && <p className="text-xs font-bold" style={{ color: neon }}>R$ {(item.price * item.quantity).toFixed(2)}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Minus size={13} /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Plus size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="p-5 border-t border-white/10 space-y-3">
                  {config.showPrices !== false && (
                    <div className="flex justify-between font-black text-lg">
                      <span>Total</span><span style={{ color: neon }}>R$ {total.toFixed(2)}</span>
                    </div>
                  )}
                  <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    className="w-full py-4 rounded-xl font-black text-black hover:brightness-110 transition-all"
                    style={{ backgroundColor: neon }}>
                    FINALIZAR PEDIDO
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal checkout */}
      <AnimatePresence>
        {checkoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/80" onClick={() => setCheckoutOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Finalizar Pedido</h2>
                <button onClick={() => setCheckoutOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white/40"><X size={18} /></button>
              </div>
              <div className="p-4 rounded-xl border space-y-2" style={{ borderColor: `${neon}30`, backgroundColor: `${neon}08` }}>
                {cart.map(i => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-white/70">{i.name} × {i.quantity}</span>
                    {config.showPrices !== false && <span className="font-bold">R$ {(i.price * i.quantity).toFixed(2)}</span>}
                  </div>
                ))}
                {config.showPrices !== false && (
                  <div className="flex justify-between font-black pt-2 border-t border-white/10">
                    <span>Total</span><span style={{ color: neon }}>R$ {total.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <form onSubmit={handleOrder} className="space-y-4">
                {[
                  { k: 'name', l: 'Seu Nome *', t: 'text', ph: 'João Silva', req: true },
                  { k: 'phone', l: 'WhatsApp *', t: 'tel', ph: '(11) 99999-9999', req: true },
                  { k: 'address', l: 'Endereço de Entrega', t: 'text', ph: 'Rua, nº, bairro', req: false },
                ].map(f => (
                  <div key={f.k} className="space-y-1.5">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{f.l}</label>
                    <input type={f.t} required={f.req} placeholder={f.ph}
                      value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm"
                      onFocus={e => e.currentTarget.style.borderColor = neon}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['PIX', 'Dinheiro', 'Cartão'].map(p => (
                      <button key={p} type="button" onClick={() => setForm(f => ({ ...f, payment: p }))}
                        className="py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={form.payment === p ? { backgroundColor: neon, color: '#000' } : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Observações</label>
                  <textarea rows={2} placeholder="Sem cebola, endereço alternativo..."
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm resize-none"
                    onFocus={e => e.currentTarget.style.borderColor = neon}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <button type="submit" disabled={sending || !form.name || !form.phone}
                  className="w-full py-4 rounded-xl font-black text-black transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: neon }}>
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                  {sending ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
