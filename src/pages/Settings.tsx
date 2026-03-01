import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Store, 
  Smartphone, 
  Database,
  ChevronRight,
  Moon,
  Save,
  Loader2,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../services/imgbb';

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    storeName: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        storeName: profile.storeName || ''
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    try {
      const url = await uploadImage(file);
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: url,
        updatedAt: serverTimestamp()
      });
      // The profile in useAuth will update automatically if it's using onSnapshot, 
      // but if not, we might need to refresh or rely on the next mount.
      // Based on useAuth.tsx, it's not using onSnapshot for the profile doc, 
      // so we might need a page refresh or a manual state update in a real app.
      // For now, let's assume the user will see it on next load or we can alert.
      alert('Foto de perfil atualizada!');
      window.location.reload(); // Simple way to refresh profile from Firestore
    } catch (error) {
      console.error(error);
      alert('Erro ao fazer upload da foto.');
    } finally {
      setUploading(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Meu Perfil', icon: User, desc: 'Informações pessoais e de acesso' },
    { id: 'store', label: 'Minha Loja', icon: Store, desc: 'Configurações do estabelecimento e catálogo' },
    { id: 'notifications', label: 'Notificações', icon: Bell, desc: 'Alertas de estoque, vendas e sistema' },
    { id: 'security', label: 'Segurança', icon: Shield, desc: 'Senhas, permissões e sessões ativas' },
    { id: 'appearance', label: 'Aparência', icon: Moon, desc: 'Temas, cores e identidade visual' },
    { id: 'mobile', label: 'App Mobile', icon: Smartphone, desc: 'Configurações de PWA e notificações push' },
    { id: 'data', label: 'Dados e Backup', icon: Database, desc: 'Exportação, importação e backups' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-white/40">Ajuste o Niklaus do seu jeito.</p>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 bg-rose-500/10 text-rose-500 px-6 py-3 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all"
        >
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-neon-blue/10 border-2 border-neon-blue/20 flex items-center justify-center text-neon-blue overflow-hidden">
                {uploading ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-neon-blue text-black rounded-full shadow-lg hover:scale-110 transition-all cursor-pointer"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
              />
            </div>
            <div>
              <h3 className="font-bold text-lg">{profile?.name || 'Usuário'}</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">{profile?.tipo || 'Admin'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sections.map((section) => (
              <button 
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full p-4 flex items-center gap-4 rounded-xl transition-all text-left group ${
                  activeSection === section.id 
                    ? 'bg-neon-blue/10 text-neon-blue shadow-[inset_0_0_20px_rgba(0,229,255,0.05)]' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <section.icon size={20} className={activeSection === section.id ? 'text-neon-blue' : 'text-white/20 group-hover:text-white/40'} />
                <div className="flex-1">
                  <p className="text-sm font-bold">{section.label}</p>
                </div>
                {activeSection === section.id && <ChevronRight size={16} />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <form onSubmit={handleSave} className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                      <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                        <User size={20} />
                      </div>
                      <h3 className="text-xl font-bold">Informações do Perfil</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Nome Completo</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">E-mail</label>
                        <input 
                          type="email" 
                          disabled
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none opacity-50 cursor-not-allowed"
                          value={formData.email}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Telefone</label>
                        <input 
                          type="tel" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Nome da Empresa</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all"
                          value={formData.storeName}
                          onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-neon-blue text-black font-black py-4 rounded-xl shadow-lg shadow-neon-blue/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      SALVAR ALTERAÇÕES
                    </button>
                  </form>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                      <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                        <Shield size={20} />
                      </div>
                      <h3 className="text-xl font-bold">Segurança da Conta</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                        <div>
                          <p className="font-bold">Senha de Acesso</p>
                          <p className="text-xs text-white/40">Última alteração há 3 meses</p>
                        </div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-neon-blue transition-all">ALTERAR SENHA</button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                        <div>
                          <p className="font-bold">Autenticação em Duas Etapas</p>
                          <p className="text-xs text-white/40">Aumente a segurança da sua conta</p>
                        </div>
                        <button className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer transition-colors hover:bg-white/20">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                        <div>
                          <p className="font-bold">Sessões Ativas</p>
                          <p className="text-xs text-white/40">Você está conectado em 2 dispositivos</p>
                        </div>
                        <button className="text-xs font-bold text-rose-500 hover:underline">ENCERRAR TODAS</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection !== 'profile' && activeSection !== 'security' && (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                    {sections.find(s => s.id === activeSection)?.icon && (
                      React.createElement(sections.find(s => s.id === activeSection)!.icon, { size: 40 })
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{sections.find(s => s.id === activeSection)?.label}</h3>
                    <p className="text-white/40 max-w-xs mx-auto mt-2">
                      Esta seção está sendo configurada e estará disponível em breve com todas as funcionalidades.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveSection('profile')}
                    className="text-neon-blue font-bold text-sm hover:underline"
                  >
                    Voltar para Perfil
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
