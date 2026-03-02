import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Phone, Instagram, Facebook, Search, Plus, Minus,
  X, Loader2, Store, ArrowLeft, Package, CheckCircle2, Truck
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
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
  const [form, setForm] = useState({ name:'', phone:'', address:'', notes:'', payment:'PIX' });

  useEffect(() => {
    const load = async () => {
      try {
        // Buscar config do catálogo
        const cfgSnap = await getDoc(doc(db, 'adminSettings', 'catalog'));
        if (!cfgSnap.exists()) { setLoading(false); return; }
        const cfg = cfgSnap.data() as CatalogConfig;
        if (cfg.slug !== slug) { setLoading(false); return; }
        setConfig(cfg);
        // Aplicar cor primária
        document.documentElement.style.setProperty('--neon-color', cfg.primaryColor || '#00E5FF');

        // Buscar produtos ativos
        const prodSnap = await getDocs(query(collection(db, 'products'), where('status', '==', 'active')));
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [slug]);

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? {...i, quantity: i.quantity+1} : i);
      return [...prev, { id:p.id, name:p.name, price:p.price, quantity:1, image:p.imageUrl }];
    });
  };
  const removeFromCart = (id: string) => setCart(p => p.filter(i => i.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setCart(p => p.map(i => i.id === id ? {...i, quantity:qty} : i));
  };
  const total = cart.reduce((a,i) => a + i.price * i.quantity, 0);
  const cartQty = cart.reduce((a,i) => a + i.quantity, 0);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    try {
      const orderData = {
        customerName: form.name, customerPhone: form.phone,
        customerAddress: form.address, notes: form.notes,
        paymentMethod: form.payment,
        items: cart.map(i => ({ name:i.name, price:i.price, quantity:i.quantity })),
        total, status: 'Pendente',
        date: serverTimestamp(), type: 'online', source: 'catalog',
      };
      await addDoc(collection(db, 'orders'), orderData);
      setOrdered(true);
      setCart([]);
      setCheckoutOpen(false);
    } catch (e) { console.error(e); alert('Erro ao enviar pedido. Tente novamente.'); }
    finally { setSending(false); }
  };

  const categories = ['Todos', ...Array.from(new Set(products.map((p:any) => p.category).filter(Boolean)))];
  const filtered = products.filter((p:any) => {
    const ms = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'Todos' || p.category === catFilter;
    return ms && mc;
  });

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 size={40} className="animate-spin text-[var(--neon-color,#00E5FF)]"/>
    </div>
  );
  if (!config) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-4">
      <Store size={56} className="opacity-20"/>
      <p className="text-xl font-bold">Loja não encontrada</p>
      <p className="text-white/40 text-sm">Verifique o link ou entre em contato com a loja.</p>
    </div>
  );
  if (!config.isActive) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-4">
      <Store size={56} className="opacity-20"/>
      <p className="text-xl font-bold">Loja temporariamente fechada</p>
    </div>
  );

  const neon = config.primaryColor || '#00E5FF';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Banner */}
      {config.bannerUrl && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img src={config.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-70"/>
        </div>
      )}

      {/* Header da loja */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {config.logoUrl
              ? <img src={config.logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover border-2" style={{borderColor:neon}}/>
              : <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor:`${neon}20`}}>
                  <Store size={18} style={{color:neon}}/>
                </div>}
            <div>
              <h1 className="font-black text-lg leading-tight">{config.storeName || 'Minha Loja'}</h1>
              {config.description && <p className="text-xs text-white/40 leading-tight">{config.description}</p>}
            </div>
          </div>
          {config.allowOrders && (
            <button onClick={() => setCartOpen(true)} className="relative p-3 rounded-xl"
              style={{backgroundColor:`${neon}15`, color:neon}}>
              <ShoppingCart size={22}/>
              {cartQty > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-black"
                  style={{backgroundColor:neon}}>{cartQty}</span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Pedido confirmado */}
        <AnimatePresence>
          {ordered && (
            <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="p-5 rounded-2xl border flex items-start gap-4"
              style={{backgroundColor:`${neon}10`, borderColor:`${neon}30`}}>
              <CheckCircle2 size={22} style={{color:neon, flexShrink:0}}/>
              <div>
                <p className="font-bold">Pedido enviado com sucesso!</p>
                <p className="text-sm text-white/60 mt-1">
                  {config.whatsapp ? `Em breve entraremos em contato via WhatsApp (${config.whatsapp}).` : 'Aguarde o contato da loja.'}
                </p>
                <button onClick={() => setOrdered(false)} className="text-xs text-white/40 hover:text-white mt-2 underline">Fechar</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Busca e filtros */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18}/>
            <input type="text" placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none text-sm transition-colors"
              style={{'--tw-ring-color':neon} as any}
              onFocus={e => e.currentTarget.style.borderColor = neon}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}/>
          </div>
          {categories.length > 2 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${catFilter===c ? 'text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                  style={catFilter===c ? {backgroundColor:neon} : {}}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid de produtos */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={48} className="mx-auto mb-4 opacity-10"/>
            <p className="text-white/40">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p:any) => (
              <motion.div key={p.id} whileHover={{y:-4}} transition={{type:'spring',stiffness:400}}
                className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all">
                <div className="aspect-square bg-white/5 overflow-hidden">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer"/>
                    : <div className="w-full h-full flex items-center justify-center opacity-20"><Package size={40}/></div>}
                </div>
                <div className="p-3 space-y-2">
                  <p className="font-bold text-sm leading-tight line-clamp-2">{p.name}</p>
                  {p.category && <p className="text-[10px] text-white/30 uppercase tracking-widest">{p.category}</p>}
                  {config.showPrices !== false && (
                    <p className="font-black text-lg" style={{color:neon}}>R$ {p.price?.toFixed(2)}</p>
                  )}
                  {config.allowOrders && p.stock > 0 && (
                    <button onClick={() => addToCart(p)}
                      className="w-full py-2.5 rounded-xl text-xs font-black text-black transition-all hover:brightness-110 active:scale-95"
                      style={{backgroundColor:neon}}>
                      + ADICIONAR
                    </button>
                  )}
                  {p.stock === 0 && <p className="text-center text-xs text-rose-400 font-bold py-2">Esgotado</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Contatos */}
        <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-white/5">
          {config.whatsapp && (
            <a href={`https://wa.me/55${config.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all">
              <Phone size={16}/> WhatsApp
            </a>
          )}
          {config.instagram && (
            <a href={`https://instagram.com/${config.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-pink-500/10 text-pink-400 rounded-xl text-sm font-bold hover:bg-pink-500/20 transition-all">
              <Instagram size={16}/> Instagram
            </a>
          )}
        </div>
        <p className="text-center text-white/20 text-xs pb-4">Powered by NIKLAUS</p>
      </div>

      {/* Drawer do carrinho */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setCartOpen(false)} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/>
            <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:30,stiffness:300}}
              className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-[#111] border-l border-white/10 flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold">Carrinho ({cartQty})</h2>
                <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white/40"><X size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="py-20 text-center text-white/20">
                    <ShoppingCart size={40} className="mx-auto mb-3 opacity-20"/>Carrinho vazio
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover"/> : <Package size={20} className="m-2 opacity-30"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {config.showPrices !== false && <p className="text-xs font-bold" style={{color:neon}}>R$ {(item.price*item.quantity).toFixed(2)}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, item.quantity-1)} className="p-1 hover:bg-white/10 rounded"><Minus size={13}/></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity+1)} className="p-1 hover:bg-white/10 rounded"><Plus size={13}/></button>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="p-5 border-t border-white/10 space-y-3">
                  {config.showPrices !== false && (
                    <div className="flex justify-between font-black text-lg">
                      <span>Total</span>
                      <span style={{color:neon}}>R$ {total.toFixed(2)}</span>
                    </div>
                  )}
                  <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    className="w-full py-4 rounded-xl font-black text-black transition-all hover:brightness-110"
                    style={{backgroundColor:neon}}>
                    FINALIZAR PEDIDO
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de checkout */}
      <AnimatePresence>
        {checkoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/80" onClick={() => setCheckoutOpen(false)}
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}/>
            <motion.div initial={{opacity:0,y:50}} animate={{opacity:1,y:0}} exit={{opacity:0,y:50}}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Finalizar Pedido</h2>
                <button onClick={() => setCheckoutOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white/40"><X size={18}/></button>
              </div>
              {/* Resumo */}
              <div className="p-4 rounded-xl border space-y-2" style={{borderColor:`${neon}20`,backgroundColor:`${neon}08`}}>
                {cart.map(i => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-white/70">{i.name} × {i.quantity}</span>
                    {config.showPrices !== false && <span className="font-bold">R$ {(i.price*i.quantity).toFixed(2)}</span>}
                  </div>
                ))}
                {config.showPrices !== false && (
                  <div className="flex justify-between font-black pt-2 border-t border-white/10">
                    <span>Total</span><span style={{color:neon}}>R$ {total.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <form onSubmit={handleOrder} className="space-y-4">
                {[
                  {k:'name',l:'Seu Nome *',t:'text',ph:'João Silva',req:true},
                  {k:'phone',l:'WhatsApp *',t:'tel',ph:'(11) 99999-9999',req:true},
                  {k:'address',l:'Endereço de Entrega',t:'text',ph:'Rua, nº, bairro',req:false},
                ].map(f => (
                  <div key={f.k} className="space-y-1.5">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{f.l}</label>
                    <input type={f.t} required={f.req} placeholder={f.ph}
                      value={(form as any)[f.k]} onChange={e => setForm(p => ({...p, [f.k]:e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm"
                      onFocus={e => e.currentTarget.style.borderColor = neon}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}/>
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['PIX','Dinheiro','Cartão'].map(p => (
                      <button key={p} type="button" onClick={() => setForm(f => ({...f, payment:p}))}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${form.payment===p ? 'text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
                        style={form.payment===p ? {backgroundColor:neon} : {}}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Observações</label>
                  <textarea rows={2} placeholder="Sem cebola, endereço alternativo..."
                    value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm resize-none"
                    onFocus={e => e.currentTarget.style.borderColor = neon}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}/>
                </div>
                <button type="submit" disabled={sending || !form.name || !form.phone}
                  className="w-full py-4 rounded-xl font-black text-black transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{backgroundColor:neon}}>
                  {sending ? <Loader2 size={18} className="animate-spin"/> : <Truck size={18}/>}
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
