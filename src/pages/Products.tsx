import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Sparkles,
  Loader2,
  Copy,
  X,
  Package,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateProductDescription, suggestPricing } from '../services/grok';
import { db } from '../services/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import ImageUpload from '../components/ImageUpload';
import { Product } from '../types';

const CATEGORIES = [
  'Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Vestuário',
  'Calçados', 'Eletrônicos', 'Papelaria', 'Brinquedos', 'Outros',
];

const emptyForm = {
  name: '',
  category: '',
  description: '',
  price: 0,
  costPrice: 0,
  stock: 0,
  minStock: 5,
  barcode: '',
  imageUrl: '',
  status: 'Ativo' as const,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        description: product.description || '',
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        minStock: product.minStock,
        barcode: product.barcode || '',
        imageUrl: product.imageUrl || '',
        status: product.status,
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyForm);
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) return;
    setAiLoading(true);
    try {
      const desc = await generateProductDescription(formData.name, formData.category || 'geral');
      setFormData((prev) => ({ ...prev, description: desc }));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestPrice = async () => {
    if (!formData.name || !formData.costPrice) return;
    setAiPriceLoading(true);
    try {
      const price = await suggestPricing(formData.name, formData.costPrice);
      if (price) {
        const numericPrice = parseFloat(price.replace(',', '.'));
        if (!isNaN(numericPrice)) {
          setFormData((prev) => ({ ...prev, price: numericPrice }));
        }
      }
    } finally {
      setAiPriceLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: serverTimestamp(),
        });
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDuplicate = (product: Product) => {
    setEditingProduct(null);
    setFormData({
      name: `${product.name} (Cópia)`,
      category: product.category,
      description: product.description || '',
      price: product.price,
      costPrice: product.costPrice,
      stock: 0,
      minStock: product.minStock,
      barcode: '',
      imageUrl: product.imageUrl || '',
      status: 'Ativo',
    });
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm);
    const matchCat = !filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const margin =
    formData.price > 0 && formData.costPrice > 0
      ? (((formData.price - formData.costPrice) / formData.price) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-white/40">Gerencie seu catálogo — {products.length} produtos cadastrados.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-neon-blue text-black font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </header>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, categoria ou código de barras..."
            className="w-full bg-card-bg border border-border-subtle rounded-xl pl-12 pr-4 py-3 outline-none focus:border-neon-blue transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 bg-card-bg border rounded-xl transition-all ${filterCategory ? 'border-neon-blue text-neon-blue' : 'border-border-subtle text-white/60 hover:text-white'}`}
          >
            <Filter size={20} />
            {filterCategory || 'Categoria'}
            <ChevronDown size={16} />
          </button>
          {showFilters && (
            <div className="absolute right-0 top-14 bg-card-bg border border-border-subtle rounded-xl shadow-2xl z-50 min-w-[180px] overflow-hidden">
              <button
                onClick={() => { setFilterCategory(''); setShowFilters(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-white/60"
              >
                Todas
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setFilterCategory(cat); setShowFilters(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${filterCategory === cat ? 'text-neon-blue' : 'text-white/60'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-white/20">
            <Loader2 size={48} className="animate-spin text-neon-blue" />
            <p className="font-medium">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-white/20">
            <Package size={48} />
            <p className="font-medium">Nenhum produto encontrado</p>
            <button onClick={() => openModal()} className="text-sm text-neon-blue font-bold hover:underline">
              + Cadastrar primeiro produto
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-white/5">
                {['Produto', 'Categoria', 'Preço / Custo', 'Margem', 'Estoque', 'Status', 'Ações'].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredProducts.map((product) => {
                const prodMargin =
                  product.price > 0
                    ? (((product.price - product.costPrice) / product.price) * 100).toFixed(1)
                    : '—';
                const isLowStock = product.stock <= product.minStock;

                return (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-white/20 overflow-hidden shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Package size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.barcode && (
                            <p className="text-[10px] text-white/30 font-mono">{product.barcode}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm">{product.category}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-neon-blue">R$ {product.price.toFixed(2)}</p>
                      <p className="text-xs text-white/40">Custo: R$ {product.costPrice.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-bold ${
                          parseFloat(prodMargin) >= 30 ? 'text-emerald-500' : parseFloat(prodMargin) >= 15 ? 'text-amber-500' : 'text-rose-500'
                        }`}
                      >
                        {prodMargin}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isLowStock && <AlertTriangle size={14} className="text-rose-500" />}
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            isLowStock ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-white/60'
                          }`}
                        >
                          {product.stock} un.
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'Ativo'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'Ativo' ? 'bg-emerald-500' : 'bg-white/40'}`} />
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(product)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                          title="Duplicar"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-rose-500/10 rounded-lg text-white/60 hover:text-rose-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl glass-card p-8 my-auto overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna esquerda */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Nome do Produto *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Categoria *</label>
                      <select
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="" className="bg-dark-bg">Selecionar...</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-dark-bg">{cat}</option>
                        ))}
                        <option value={formData.category && !CATEGORIES.includes(formData.category) ? formData.category : ''} className="bg-dark-bg">
                          {formData.category && !CATEGORIES.includes(formData.category) ? formData.category : 'Outra...'}
                        </option>
                      </select>
                    </div>

                    {/* Preços */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60">Custo (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors"
                          value={formData.costPrice || ''}
                          onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-white/60">Venda (R$)</label>
                          <button
                            type="button"
                            onClick={handleSuggestPrice}
                            disabled={aiPriceLoading || !formData.name || !formData.costPrice}
                            className="text-[10px] font-bold text-neon-blue hover:brightness-110 disabled:opacity-40 flex items-center gap-1"
                          >
                            {aiPriceLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            IA
                          </button>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    {/* Margem em tempo real */}
                    {margin && (
                      <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        parseFloat(margin) >= 30 ? 'bg-emerald-500/10 text-emerald-500' :
                        parseFloat(margin) >= 15 ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        <TrendingUp size={14} />
                        Margem de lucro: {margin}%
                        {parseFloat(margin) < 15 && ' — Margem muito baixa!'}
                        {parseFloat(margin) >= 30 && ' — Excelente!'}
                      </div>
                    )}

                    {/* Estoque */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60">Estoque Atual</label>
                        <input
                          type="number"
                          min="0"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors"
                          value={formData.stock || ''}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60">Estoque Mínimo</label>
                        <input
                          type="number"
                          min="0"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors"
                          value={formData.minStock || ''}
                          onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Código de Barras</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors font-mono"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="EAN-13, EAN-8..."
                      />
                    </div>
                  </div>

                  {/* Coluna direita */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Imagem do Produto</label>
                      <ImageUpload
                        value={formData.imageUrl}
                        onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                        onClear={() => setFormData({ ...formData, imageUrl: '' })}
                        aspectRatio="video"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white/60">Descrição</label>
                        <button
                          type="button"
                          onClick={handleGenerateDescription}
                          disabled={aiLoading || !formData.name}
                          className="flex items-center gap-1.5 text-xs font-bold text-neon-blue hover:brightness-110 disabled:opacity-40 transition-all"
                        >
                          {aiLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Sparkles size={12} />
                          )}
                          {aiLoading ? 'Gerando...' : 'Gerar com IA'}
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue resize-none text-sm transition-colors"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição do produto para o catálogo digital..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Status</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Ativo', 'Inativo'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({ ...formData, status: s })}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                              formData.status === s
                                ? s === 'Ativo'
                                  ? 'bg-emerald-500 text-black'
                                  : 'bg-rose-500 text-black'
                                : 'bg-white/5 text-white/40 hover:bg-white/10'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-neon-blue text-black rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}
                    {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
