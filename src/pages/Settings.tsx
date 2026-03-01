import React, { useState, useEffect } from 'react';
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
  Camera
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
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
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-white/40">Ajuste o Niklaus do seu jeito.</p>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-2 bg-rose-500/10 text-rose-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all"
        >
          <LogOut size={18} />
          Sair do Sistema
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-neon-blue/10 border-2 border-neon-blue/20 flex items-center justify-center text-neon-blue overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-neon-blue text-black rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={16} />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-lg">{profile?.name || 'Usuário'}</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">{profile?.tipo || 'Admin'}</p>
            </div>
          </div>

          <div className="space-y-2">
            {sections.map((section) => (
              <button 
                key={section.id}
                className={`w-full p-4 flex items-center gap-4 rounded-xl transition-all text-left ${section.id === 'profile' ? 'bg-neon-blue/10 text-neon-blue' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                <section.icon size={20} />
                <span className="text-sm font-bold">{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold border-b border-white/5 pb-4">Informações do Perfil</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Nome Completo</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">E-mail</label>
                <input 
                  type="email" 
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none opacity-50 cursor-not-allowed"
                  value={formData.email}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Telefone</label>
                <input 
                  type="tel" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Nome da Empresa</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue"
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

          <div className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold border-b border-white/5 pb-4">Segurança</h3>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="font-bold">Senha de Acesso</p>
                <p className="text-xs text-white/40">Última alteração há 3 meses</p>
              </div>
              <button className="text-xs font-bold text-neon-blue hover:underline">ALTERAR SENHA</button>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div>
                <p className="font-bold">Autenticação em Duas Etapas</p>
                <p className="text-xs text-white/40">Aumente a segurança da sua conta</p>
              </div>
              <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
