import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Copy,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { generateProductDescription } from '../services/gemini';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../services/imgbb';
import { Product } from '../types';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStock: 5,
    barcode: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) return;
    setAiLoading(true);
    try {
      const desc = await generateProductDescription(formData.name, formData.category);
      setFormData({ ...formData, description: desc || '' });
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData({ ...formData, imageUrl: url });
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          status: 'Ativo',
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({
        name: '', category: '', description: '', price: 0, costPrice: 0, stock: 0, minStock: 5, barcode: '', imageUrl: ''
      });
      fetchProducts();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      barcode: product.barcode || '',
      imageUrl: product.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDuplicate = (product: Product) => {
    setFormData({
      name: `${product.name} (Cópia)`,
      category: product.category,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      stock: 0,
      minStock: product.minStock,
      barcode: '',
      imageUrl: product.imageUrl || ''
    });
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-white/40">Gerencie seu catálogo de produtos.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', category: '', description: '', price: 0, costPrice: 0, stock: 0, minStock: 5, barcode: '', imageUrl: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-neon-blue text-black font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </header>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome, categoria ou código..."
            className="w-full bg-card-bg border border-border-subtle rounded-xl pl-12 pr-4 py-3 outline-none focus:border-neon-blue transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-card-bg border border-border-subtle rounded-xl text-white/60 hover:text-white transition-all">
          <Filter size={20} />
          Filtros
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-white/20">
            <Loader2 size={48} className="animate-spin text-neon-blue" />
            <p className="font-medium">Carregando produtos...</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Produto</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Preço</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Estoque</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-white/20 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon size={20} />
                        )}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60">{product.category}</td>
                  <td className="px-6 py-4 font-bold text-neon-blue">R$ {product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${product.stock < product.minStock ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-white/60'}`}>
                      {product.stock} un.
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'Ativo' ? 'bg-emerald-500' : 'bg-white/40'}`} />
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(product)} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"><Edit2 size={18} /></button>
                      <button onClick={() => handleDuplicate(product)} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white"><Copy size={18} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-white/60 hover:text-rose-500"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for New/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-3xl glass-card p-8 my-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Nome do Produto</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Categoria</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Preço de Venda</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Preço de Custo</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Estoque Atual</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Estoque Mínimo</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Imagem do Produto</label>
                    <div className="relative aspect-video bg-white/5 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 overflow-hidden group">
                      {formData.imageUrl ? (
                        <>
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg font-bold text-xs">Trocar Imagem</label>
                          </div>
                        </>
                      ) : (
                        <>
                          {uploading ? (
                            <Loader2 size={32} className="animate-spin text-neon-blue" />
                          ) : (
                            <>
                              <ImageIcon size={32} className="text-white/20" />
                              <label className="cursor-pointer text-xs font-bold text-neon-blue hover:underline">Fazer Upload</label>
                            </>
                          )}
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Código de Barras</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white/60">Descrição</label>
                      <button 
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={aiLoading || !formData.name}
                        className="flex items-center gap-1.5 text-xs font-bold text-neon-blue hover:brightness-110 disabled:opacity-50"
                      >
                        <Sparkles size={14} />
                        {aiLoading ? 'Gerando...' : 'Gerar com IA'}
                      </button>
                    </div>
                    <textarea 
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue resize-none text-sm"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
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
                  disabled={loading || uploading}
                  className="flex-1 px-6 py-3 bg-neon-blue text-black rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={20} className="animate-spin" />}
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
