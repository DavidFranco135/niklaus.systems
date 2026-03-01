import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Tag, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode,
  CheckCircle2,
  X,
  Loader2,
  Printer,
  Share2,
  Barcode,
  ChevronRight,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { Product, Customer, Sale, SaleItem } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function POS() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card' | 'credit'>('cash');
  const [isFinishing, setIsFinishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items.filter(p => p.status === 'Ativo'));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(items);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1 
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setIsFinishing(true);
    try {
      const saleData: any = {
        date: serverTimestamp(),
        items: cart,
        subtotal,
        discount,
        total,
        paymentMethod,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Consumidor Final',
        sellerId: profile?.uid || 'unknown',
        sellerName: profile?.name || 'Vendedor',
        status: 'completed'
      };

      const saleRef = await addDoc(collection(db, 'sales'), saleData);
      setLastSaleId(saleRef.id);

      // Update Inventory
      for (const item of cart) {
        const productRef = doc(db, 'products', item.productId);
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      }

      // Record Transaction
      await addDoc(collection(db, 'transactions'), {
        type: 'income',
        category: 'Venda',
        amount: total,
        date: serverTimestamp(),
        description: `Venda #${saleRef.id.slice(-6)}`,
        relatedId: saleRef.id
      });

      // If payment is credit, update customer debt
      if (paymentMethod === 'credit' && selectedCustomer) {
        const customerRef = doc(db, 'customers', selectedCustomer.id);
        await updateDoc(customerRef, {
          debt: increment(total)
        });
      }

      setShowSuccess(true);
      setCart([]);
      setDiscount(0);
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error finalizing sale:", error);
    } finally {
      setIsFinishing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Buscar produto por nome ou código de barras..."
            className="w-full bg-card-bg border border-border-subtle rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-neon-blue transition-all text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <motion.button
                key={product.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className="glass-card p-4 text-left group relative overflow-hidden"
              >
                <div className="aspect-square bg-white/5 rounded-xl mb-3 flex items-center justify-center text-white/20 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Package size={32} />
                  )}
                </div>
                <h3 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-neon-blue transition-colors">{product.name}</h3>
                <p className="text-neon-blue font-black">R$ {product.price.toFixed(2)}</p>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white/60">
                  Estoque: {product.stock}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart and Checkout Area */}
      <div className="w-[400px] flex flex-col gap-4">
        <div className="glass-card flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border-subtle flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <ShoppingCart size={20} className="text-neon-blue" />
              Carrinho
            </h2>
            <span className="bg-neon-blue/10 text-neon-blue px-2 py-1 rounded-lg text-xs font-bold">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} itens
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div 
                  key={item.productId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 bg-white/5 p-3 rounded-xl group"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-bold line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-white/40">R$ {item.price.toFixed(2)} cada</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-sm font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
                <ShoppingCart size={48} />
                <p className="text-sm font-medium">Carrinho vazio</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-white/5 border-t border-border-subtle space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-neon-blue appearance-none"
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <option value="" className="bg-dark-bg">Consumidor Final</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-32 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="number"
                  placeholder="Desc."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-neon-blue"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/40">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-rose-500">
                <span>Desconto</span>
                <span>- R$ {discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-white pt-2 border-t border-white/10">
                <span>TOTAL</span>
                <span className="text-neon-blue text-2xl">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 grid grid-cols-2 gap-2">
          <button 
            onClick={() => setPaymentMethod('cash')}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${paymentMethod === 'cash' ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-white/5 border-transparent text-white/40 hover:text-white'}`}
          >
            <Banknote size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Dinheiro</span>
          </button>
          <button 
            onClick={() => setPaymentMethod('pix')}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${paymentMethod === 'pix' ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-white/5 border-transparent text-white/40 hover:text-white'}`}
          >
            <QrCode size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">PIX</span>
          </button>
          <button 
            onClick={() => setPaymentMethod('card')}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${paymentMethod === 'card' ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-white/5 border-transparent text-white/40 hover:text-white'}`}
          >
            <CreditCard size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Cartão</span>
          </button>
          <button 
            onClick={() => setPaymentMethod('credit')}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${paymentMethod === 'credit' ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-white/5 border-transparent text-white/40 hover:text-white'}`}
          >
            <User size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Fiado</span>
          </button>
        </div>

        <button 
          onClick={handleFinalizeSale}
          disabled={cart.length === 0 || isFinishing}
          className="w-full bg-neon-blue text-black font-black py-5 rounded-2xl shadow-lg shadow-neon-blue/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
        >
          {isFinishing ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              FINALIZAR VENDA
              <CheckCircle2 size={24} />
            </>
          )}
        </button>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass-card p-10 text-center"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={48} className="text-black" />
              </div>
              <h2 className="text-3xl font-black mb-2">VENDA CONCLUÍDA!</h2>
              <p className="text-white/40 mb-8 font-medium">O registro foi salvo e o estoque atualizado com sucesso.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-4 rounded-xl font-bold transition-all">
                  <Printer size={20} />
                  Recibo
                </button>
                <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-4 rounded-xl font-bold transition-all">
                  <Share2 size={20} />
                  Compartilhar
                </button>
              </div>

              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full bg-neon-blue text-black font-black py-4 rounded-xl hover:brightness-110 transition-all"
              >
                PRÓXIMA VENDA
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
