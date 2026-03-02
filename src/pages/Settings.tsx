import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  Store,
  Database,
  ChevronRight,
  Moon,
  Save,
  Loader2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Palette,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Key,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import ImageUpload from '../components/ImageUpload';
import * as XLSX from 'xlsx';
import { collection, getDocs } from 'firebase/firestore';

export default function Settings() {
  const { user, profile, logout, isConfigured } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    storeName: '',
    address: '',
    cnpj: '',
    photoURL: '',
    notifications: {
      sales: true,
      inventory: true,
      system: false,
      fiado: true,
    },
    appearance: {
      primaryColor: '#00E5FF',
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: (profile as any).name || '',
        email: (profile as any).email || '',
        phone: (profile as any).phone || '',
        storeName: (profile as any).storeName || '',
        address: (profile as any).address || '',
        cnpj: (profile as any).cnpj || '',
        photoURL: (profile as any).photoURL || '',
        notifications: (profile as any).notifications || prev.notifications,
        appearance: (profile as any).appearance || prev.appearance,
      }));
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        alert('Você está em modo demo. Configure o Firebase para salvar alterações permanentes.');
      } else {
        alert('Erro ao salvar: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const snap = await getDocs(collection(db, type));
      const data = snap.docs.map((d) => d.data());
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type);
      XLSX.writeFile(wb, `niklaus_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      alert('Erro ao exportar dados. Verifique as permissões do Firebase.');
    }
  };

  const sections = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'store', label: 'Minha Loja', icon: Store },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'data', label: 'Dados e Backup', icon: Database },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-white/40">Gerencie sua conta e preferências do sistema.</p>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 bg-rose-500/10 text-rose-500 px-6 py-3 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all"
        >
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </header>

      {!isConfigured && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4 text-amber-500">
          <AlertCircle size={22} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            <strong>Modo Demonstração:</strong> O Firebase está funcionando com as credenciais padrão. Configure variáveis VITE_FIREBASE_* no arquivo .env para sua instância exclusiva.
          </p>
        </div>
      )}

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500"
        >
          <CheckCircle2 size={20} />
          <p className="font-bold text-sm">Configurações salvas com sucesso!</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar de navegação */}
        <div className="md:col-span-1 space-y-4">
          {/* Avatar */}
          <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-neon-blue/10 border-2 border-neon-blue/20 flex items-center justify-center">
              {formData.photoURL ? (
                <img
                  src={formData.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={40} className="text-neon-blue" />
              )}
            </div>
            <div>
              <h3 className="font-bold">{formData.name || 'Usuário'}</h3>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-black bg-white/5 px-2 py-1 rounded mt-1 inline-block">
                {(profile as any)?.tipo || 'admin'}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full p-3.5 flex items-center gap-3 rounded-xl transition-all text-left ${
                  activeSection === section.id
                    ? 'bg-neon-blue/10 text-neon-blue'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <section.icon size={18} />
                <span className="text-sm font-medium flex-1">{section.label}</span>
                {activeSection === section.id && <ChevronRight size={14} />}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* PERFIL */}
              {activeSection === 'profile' && (
                <form onSubmit={handleSave} className="glass-card p-8 space-y-6">
                  <SectionHeader icon={User} title="Informações do Perfil" desc="Dados básicos da sua conta de acesso." />

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/60">Foto de Perfil</label>
                    <ImageUpload
                      value={formData.photoURL}
                      onChange={(url) => setFormData({ ...formData, photoURL: url })}
                      onClear={() => setFormData({ ...formData, photoURL: '' })}
                      aspectRatio="square"
                      className="w-32"
                      label="Upload da foto"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Nome Completo"
                      value={formData.name}
                      onChange={(v) => setFormData({ ...formData, name: v })}
                    />
                    <InputField
                      label="E-mail"
                      value={formData.email}
                      disabled
                      type="email"
                    />
                    <InputField
                      label="Telefone / WhatsApp"
                      value={formData.phone}
                      onChange={(v) => setFormData({ ...formData, phone: v })}
                      type="tel"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <SaveButton saving={saving} />
                </form>
              )}

              {/* LOJA */}
              {activeSection === 'store' && (
                <form onSubmit={handleSave} className="glass-card p-8 space-y-6">
                  <SectionHeader icon={Store} title="Minha Loja" desc="Configure os dados do seu estabelecimento." />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Nome da Empresa"
                      value={formData.storeName}
                      onChange={(v) => setFormData({ ...formData, storeName: v })}
                      placeholder="Ex: Mercado do João"
                    />
                    <InputField
                      label="CNPJ / CPF"
                      value={formData.cnpj}
                      onChange={(v) => setFormData({ ...formData, cnpj: v })}
                      placeholder="00.000.000/0000-00"
                    />
                    <div className="md:col-span-2">
                      <InputField
                        label="Endereço Completo"
                        value={formData.address}
                        onChange={(v) => setFormData({ ...formData, address: v })}
                        placeholder="Rua, número, bairro, cidade - Estado"
                      />
                    </div>
                  </div>

                  <SaveButton saving={saving} label="SALVAR DADOS DA LOJA" />
                </form>
              )}

              {/* NOTIFICAÇÕES */}
              {activeSection === 'notifications' && (
                <div className="glass-card p-8 space-y-6">
                  <SectionHeader icon={Bell} title="Notificações" desc="Escolha como deseja ser alertado." />

                  <div className="space-y-3">
                    {[
                      { id: 'sales', label: 'Novas Vendas', desc: 'Receba alertas a cada venda realizada.' },
                      { id: 'inventory', label: 'Estoque Crítico', desc: 'Quando produtos atingem o mínimo de estoque.' },
                      { id: 'fiado', label: 'Vencimentos de Fiado', desc: 'Alertas sobre dívidas próximas do limite.' },
                      { id: 'system', label: 'Atualizações do Sistema', desc: 'Novas versões e manutenções.' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div>
                          <p className="font-bold text-sm">{item.label}</p>
                          <p className="text-xs text-white/40">{item.desc}</p>
                        </div>
                        <Toggle
                          value={formData.notifications[item.id as keyof typeof formData.notifications]}
                          onChange={(val) =>
                            setFormData({
                              ...formData,
                              notifications: { ...formData.notifications, [item.id]: val },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEGURANÇA */}
              {activeSection === 'security' && (
                <div className="glass-card p-8 space-y-6">
                  <SectionHeader icon={Shield} title="Segurança" desc="Proteja sua conta e seus dados." />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="font-bold text-sm flex items-center gap-2"><Key size={16} /> Senha de Acesso</p>
                        <p className="text-xs text-white/40 mt-0.5">Autenticação via Firebase Auth</p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-neon-blue transition-all"
                        onClick={() => alert('Acesse o Firebase Console para redefinir sua senha ou use a opção "Esqueceu a senha" na tela de login.')}
                      >
                        ALTERAR
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="font-bold text-sm flex items-center gap-2"><Smartphone size={16} /> Autenticação 2FA</p>
                        <p className="text-xs text-white/40 mt-0.5">Disponível na versão Pro</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full">EM BREVE</span>
                    </div>

                    <div className="p-4 bg-neon-blue/5 border border-neon-blue/10 rounded-xl">
                      <p className="text-xs text-white/40 flex items-center gap-2">
                        <Shield size={14} className="text-neon-blue" />
                        Você está autenticado como <strong className="text-white">{formData.email}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* APARÊNCIA */}
              {activeSection === 'appearance' && (
                <div className="glass-card p-8 space-y-6">
                  <SectionHeader icon={Palette} title="Aparência" desc="Personalize a interface do sistema." />

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Tema</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          className="p-4 bg-neon-blue/10 border border-neon-blue rounded-xl flex flex-col items-center gap-2 cursor-default"
                        >
                          <Moon size={24} className="text-neon-blue" />
                          <span className="text-xs font-bold">Dark Mode</span>
                          <span className="text-[10px] text-neon-blue/60">Ativo</span>
                        </button>
                        <button
                          type="button"
                          className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2 opacity-40 cursor-not-allowed"
                          disabled
                        >
                          <Moon size={24} className="text-white/20" />
                          <span className="text-xs font-bold">Light Mode</span>
                          <span className="text-[10px] text-white/20">Em breve</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Cor de Destaque</label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {['#00E5FF', '#A855F7', '#10B981', '#F59E0B', '#F43F5E', '#3B82F6', '#EC4899'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                appearance: { ...formData.appearance, primaryColor: color },
                              })
                            }
                            className={`w-10 h-10 rounded-full border-2 transition-all ${
                              formData.appearance.primaryColor === color
                                ? 'border-white scale-110 shadow-lg'
                                : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-white/40">Cor selecionada: <span className="font-bold" style={{ color: formData.appearance.primaryColor }}>{formData.appearance.primaryColor}</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* DADOS */}
              {activeSection === 'data' && (
                <div className="glass-card p-8 space-y-6">
                  <SectionHeader icon={Database} title="Dados e Backup" desc="Gerencie a segurança dos seus dados." />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Exportar Vendas', icon: Download, color: 'emerald', action: () => handleExport('sales') },
                      { label: 'Exportar Produtos', icon: Download, color: 'neon-blue', action: () => handleExport('products') },
                      { label: 'Exportar Clientes', icon: Download, color: 'violet', action: () => handleExport('customers') },
                      { label: 'Exportar Transações', icon: Download, color: 'amber', action: () => handleExport('transactions') },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all text-left group"
                      >
                        <div className={`p-3 bg-${item.color}-500/10 rounded-xl text-${item.color}-500 group-hover:scale-110 transition-transform`}>
                          <item.icon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.label}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">Formato .xlsx</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-rose-500">Zona de Perigo</p>
                      <p className="text-xs text-rose-500/60 mt-1">Ações irreversíveis. Use com extrema cautela.</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Tem certeza? Esta ação irá limpar os dados do cache local. Os dados no Firebase serão preservados.')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="mt-3 px-4 py-2 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Limpar Cache Local
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ===== Subcomponentes =====

function SectionHeader({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 pb-5">
      <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, type = 'text', placeholder = '', disabled = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all text-sm ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative transition-all duration-200 ${value ? 'bg-neon-blue' : 'bg-white/10'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-md ${value ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function SaveButton({ saving, label = 'SALVAR ALTERAÇÕES' }: { saving: boolean; label?: string }) {
  return (
    <div className="pt-2">
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-neon-blue text-black font-black px-10 py-4 rounded-xl shadow-lg shadow-neon-blue/20 hover:brightness-110 transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        {saving ? 'SALVANDO...' : label}
      </button>
    </div>
  );
}
