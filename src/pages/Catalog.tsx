import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Globe, 
  Palette, 
  Share2, 
  Image as ImageIcon,
  Save,
  Loader2,
  ExternalLink,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../services/imgbb';

export default function Catalog() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    slug: '',
    description: '',
    primaryColor: '#00E5FF',
    isActive: true,
    bannerUrl: '',
    logoUrl: '',
    whatsapp: '',
    instagram: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const docRef = doc(db, 'adminSettings', 'catalog');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData({ ...formData, ...docSnap.data() });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'adminSettings', 'catalog'), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      alert('Configurações do catálogo salvas!');
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'bannerUrl' | 'logoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData({ ...formData, [field]: url });
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-neon-blue" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo Digital</h1>
          <p className="text-white/40">Configure sua loja online e receba pedidos pelo WhatsApp.</p>
        </div>
        <div className="flex gap-3">
          <a 
            href={`/loja/${formData.slug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-all"
          >
            <ExternalLink size={20} />
            Visualizar Loja
          </a>
        </div>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Store size={24} className="text-neon-blue" />
              Informações Gerais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Nome da Loja</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">URL Amigável (Slug)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm">niklaus.com/</span>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-28 pr-4 py-3 outline-none focus:border-neon-blue"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Descrição da Loja</label>
              <textarea 
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Palette size={24} className="text-neon-blue" />
              Identidade Visual
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-medium text-white/60">Logo da Loja</label>
                <div className="relative w-32 h-32 bg-white/5 border border-white/10 border-dashed rounded-2xl flex items-center justify-center overflow-hidden group">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon size={32} className="text-white/20" />
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => handleImageUpload(e, 'logoUrl')}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-medium text-white/60">Cor Principal</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    className="w-16 h-16 bg-transparent border-none cursor-pointer"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                  <input 
                    type="text" 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue font-mono"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-white/60">Banner de Destaque</label>
              <div className="relative aspect-video bg-white/5 border border-white/10 border-dashed rounded-2xl flex items-center justify-center overflow-hidden group">
                {formData.bannerUrl ? (
                  <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={48} className="text-white/20" />
                )}
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => handleImageUpload(e, 'bannerUrl')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <Share2 size={20} className="text-neon-blue" />
              Redes Sociais
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">WhatsApp</label>
                <input 
                  type="tel" 
                  placeholder="5511999999999"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Instagram</label>
                <input 
                  type="text" 
                  placeholder="@sualoja"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <Smartphone size={20} className="text-neon-blue" />
              Status da Loja
            </h3>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="font-bold text-sm">Loja Online</p>
                <p className="text-xs text-white/40">{formData.isActive ? 'Ativa e visível' : 'Desativada'}</p>
              </div>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                className={`w-12 h-6 rounded-full relative transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-neon-blue text-black font-black py-5 rounded-2xl shadow-lg shadow-neon-blue/20 hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            SALVAR CONFIGURAÇÕES
          </button>
        </div>
      </form>
    </div>
  );
}
