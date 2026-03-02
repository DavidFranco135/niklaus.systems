import React, { useState, useEffect } from 'react';
import {
  Store,
  Globe,
  Palette,
  Share2,
  Save,
  Loader2,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  QrCode,
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import ImageUpload from '../components/ImageUpload';
import { QRCodeSVG } from 'qrcode.react';

const DEFAULT_FORM = {
  storeName: '',
  slug: '',
  description: '',
  primaryColor: '#00E5FF',
  isActive: true,
  bannerUrl: '',
  logoUrl: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  showPrices: true,
  allowOrders: true,
};

export default function Catalog() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [copied, setCopied] = useState(false);

  const catalogUrl = formData.slug ? `${window.location.origin}/loja/${formData.slug}` : '';

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const docRef = doc(db, 'adminSettings', 'catalog');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData({ ...DEFAULT_FORM, ...docSnap.data() });
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
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        alert('Sem permissão para salvar. Verifique as regras do Firebase.');
      } else {
        console.error(error);
        alert('Erro ao salvar configurações.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const update = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-neon-blue" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo Digital</h1>
          <p className="text-white/40">Sua loja online integrada ao WhatsApp.</p>
        </div>
        {catalogUrl && (
          <a
            href={catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all text-sm"
          >
            <ExternalLink size={16} />
            Ver Loja
          </a>
        )}
      </header>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500"
        >
          <CheckCircle2 size={20} />
          <p className="font-bold text-sm">Catálogo salvo com sucesso!</p>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Informações gerais */}
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Store size={22} className="text-neon-blue" />
              Informações da Loja
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Nome da Loja *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors"
                  value={formData.storeName}
                  onChange={(e) => update('storeName', e.target.value)}
                  placeholder="Ex: Mercado do João"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">URL da Loja (Slug) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-mono">/loja/</span>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-16 pr-4 py-3 outline-none focus:border-neon-blue transition-colors font-mono text-sm"
                    value={formData.slug}
                    onChange={(e) =>
                      update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                    }
                    placeholder="minha-loja"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Descrição da Loja</label>
              <textarea
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue resize-none transition-colors"
                value={formData.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Descreva sua loja em poucas palavras..."
              />
            </div>

            {/* Link gerado */}
            {catalogUrl && (
              <div className="p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-xl flex items-center gap-3">
                <Globe size={16} className="text-neon-blue shrink-0" />
                <span className="text-sm text-neon-blue font-mono flex-1 truncate">{catalogUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 p-2 hover:bg-neon-blue/10 rounded-lg transition-colors text-neon-blue"
                  title="Copiar link"
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </div>

          {/* Identidade visual */}
          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Palette size={22} className="text-neon-blue" />
              Identidade Visual
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Logo da Loja</label>
                <ImageUpload
                  value={formData.logoUrl}
                  onChange={(url) => update('logoUrl', url)}
                  onClear={() => update('logoUrl', '')}
                  aspectRatio="square"
                  className="max-w-[160px]"
                  label="Enviar logo"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Cor Principal</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-12 h-12 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                      value={formData.primaryColor}
                      onChange={(e) => update('primaryColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue font-mono text-sm transition-colors"
                      value={formData.primaryColor}
                      onChange={(e) => update('primaryColor', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Banner de Destaque</label>
              <ImageUpload
                value={formData.bannerUrl}
                onChange={(url) => update('bannerUrl', url)}
                onClear={() => update('bannerUrl', '')}
                aspectRatio="video"
                label="Enviar banner (recomendado: 1200×400px)"
              />
            </div>
          </div>

          {/* Config de exibição */}
          <div className="glass-card p-8 space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Smartphone size={22} className="text-neon-blue" />
              Configurações de Exibição
            </h3>

            {[
              { id: 'showPrices', label: 'Exibir Preços', desc: 'Mostrar preços dos produtos no catálogo.' },
              { id: 'allowOrders', label: 'Aceitar Pedidos', desc: 'Permitir que clientes façam pedidos pelo WhatsApp.' },
              { id: 'isActive', label: 'Loja Online', desc: 'Loja visível e acessível ao público.' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-white/40">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => update(item.id, !formData[item.id as keyof typeof formData])}
                  className={`w-12 h-6 rounded-full relative transition-all ${
                    formData[item.id as keyof typeof formData] ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData[item.id as keyof typeof formData] ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Redes Sociais */}
          <div className="glass-card p-6 space-y-5">
            <h3 className="font-bold flex items-center gap-2">
              <Share2 size={18} className="text-neon-blue" />
              Redes Sociais
            </h3>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">WhatsApp</label>
                <input
                  type="tel"
                  placeholder="5511999999999"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm transition-colors"
                  value={formData.whatsapp}
                  onChange={(e) => update('whatsapp', e.target.value)}
                />
                <p className="text-[10px] text-white/30">Código do país + DDD + número (sem espaços)</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Instagram</label>
                <input
                  type="text"
                  placeholder="@sualoja"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm transition-colors"
                  value={formData.instagram}
                  onChange={(e) => update('instagram', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Facebook</label>
                <input
                  type="text"
                  placeholder="facebook.com/sualoja"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm transition-colors"
                  value={formData.facebook}
                  onChange={(e) => update('facebook', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* QR Code */}
          {catalogUrl && (
            <div className="glass-card p-6 flex flex-col items-center space-y-4">
              <h3 className="font-bold flex items-center gap-2 self-start">
                <QrCode size={18} className="text-neon-blue" />
                QR Code da Loja
              </h3>
              <div className="p-3 bg-white rounded-xl">
                <QRCodeSVG value={catalogUrl} size={140} bgColor="#ffffff" fgColor="#050505" />
              </div>
              <p className="text-[10px] text-white/40 text-center">Imprima e cole em sua vitrine para receber pedidos</p>
            </div>
          )}

          {/* Botão salvar */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-neon-blue text-black font-black py-5 rounded-2xl shadow-lg shadow-neon-blue/20 hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-base"
          >
            {saving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
            {saving ? 'SALVANDO...' : 'SALVAR CATÁLOGO'}
          </button>
        </div>
      </form>
    </div>
  );
}
