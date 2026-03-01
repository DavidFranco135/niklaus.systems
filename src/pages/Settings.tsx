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
  AlertCircle,
  Globe,
  Palette,
  Download,
  Upload,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { uploadImage } from '../services/imgbb';

export default function Settings() {
  const { user, profile, logout, isConfigured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    storeName: '',
    address: '',
    cnpj: '',
    notifications: {
      sales: true,
      inventory: true,
      system: false
    },
    appearance: {
      theme: 'dark',
      primaryColor: '#00E5FF'
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        storeName: profile.storeName || '',
        address: profile.address || '',
        cnpj: profile.cnpj || '',
        notifications: profile.notifications || prev.notifications,
        appearance: profile.appearance || prev.appearance
      }));
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
    } catch (error: any) {
      console.error(error);
      if (error.code === 'permission-denied') {
        alert('Erro de Permissão: Você está em modo demonstração ou não tem permissão para editar este perfil no Firebase.');
      } else {
        alert('Erro ao salvar: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    try {
      console.log("Iniciando upload para IMGBB...");
      const url = await uploadImage(file);
      console.log("Upload concluído. URL:", url);
      
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: url,
        updatedAt: serverTimestamp()
      });
      
      alert('Foto de perfil atualizada!');
      window.location.reload();
    } catch (error: any) {
      console.error("Erro no upload:", error);
      alert('Erro ao fazer upload da foto: ' + (error.message || 'Verifique sua conexão ou a chave da API IMGBB.'));
    } finally {
      setUploading(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Meu Perfil', icon: User, desc: 'Informações pessoais e de acesso' },
    { id: 'store', label: 'Minha Loja', icon: Store, desc: 'Configurações do estabelecimento' },
    { id: 'notifications', label: 'Notificações', icon: Bell, desc: 'Alertas de estoque e vendas' },
    { id: 'security', label: 'Segurança', icon: Shield, desc: 'Senhas e permissões' },
    { id: 'appearance', label: 'Aparência', icon: Moon, desc: 'Temas e cores' },
    { id: 'data', label: 'Dados e Backup', icon: Database, desc: 'Exportação e backups' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 px-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-white/40">Gerencie sua conta e as preferências do sistema.</p>
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
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 text-amber-500">
          <AlertCircle size={24} />
          <p className="text-sm font-medium">
            <strong>Modo Demonstração:</strong> O Firebase não está configurado. Algumas alterações podem não ser persistidas permanentemente.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-neon-blue/10 border-2 border-neon-blue/20 flex items-center justify-center text-neon-blue overflow-hidden shadow-lg shadow-neon-blue/10">
                {uploading ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-neon-blue text-black rounded-full shadow-lg hover:scale-110 transition-all cursor-pointer z-10"
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
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black bg-white/5 px-2 py-1 rounded mt-1 inline-block">
                {profile?.tipo || 'Administrador'}
              </p>
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'profile' && (
                <form onSubmit={handleSave} className="glass-card p-8 space-y-8">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Informações do Perfil</h3>
                      <p className="text-xs text-white/40">Dados básicos da sua conta de acesso.</p>
                    </div>
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
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto px-12 bg-neon-blue text-black font-black py-4 rounded-xl shadow-lg shadow-neon-blue/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      SALVAR ALTERAÇÕES
                    </button>
                  </div>
                </form>
              )}

              {activeSection === 'store' && (
                <form onSubmit={handleSave} className="glass-card p-8 space-y-8">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                      <Store size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Minha Loja</h3>
                      <p className="text-xs text-white/40">Configure os dados do seu estabelecimento.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Nome da Empresa</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all"
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">CNPJ</label>
                      <input 
                        type="text" 
                        placeholder="00.000.000/0000-00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Endereço Completo</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-all"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-12 bg-neon-blue text-black font-black py-4 rounded-xl shadow-lg shadow-neon-blue/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    SALVAR DADOS DA LOJA
                  </button>
                </form>
              )}

              {activeSection === 'notifications' && (
                <div className="glass-card p-8 space-y-8">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                      <Bell size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Notificações</h3>
                      <p className="text-xs text-white/40">Escolha como deseja ser alertado.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: 'sales', label: 'Novas Vendas', desc: 'Receba alertas a cada venda realizada.' },
                      { id: 'inventory', label: 'Estoque Baixo', desc: 'Avisar quando produtos atingirem o estoque mínimo.' },
                      { id: 'system', label: 'Atualizações do Sistema', desc: 'Novas funcionalidades e manutenções.' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div>
                          <p className="font-bold text-sm">{item.label}</p>
                          <p className="text-xs text-white/40">{item.desc}</p>
                        </div>
                        <button 
                          onClick={() => setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              [item.id]: !formData.notifications[item.id as keyof typeof formData.notifications]
                            }
                          })}
                          className={`w-12 h-6 rounded-full relative transition-all ${formData.notifications[item.id as keyof typeof formData.notifications] ? 'bg-neon-blue' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.notifications[item.id as keyof typeof formData.notifications] ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="glass-card p-8 space-y-8">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Segurança</h3>
                      <p className="text-xs text-white/40">Proteja sua conta e seus dados.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="font-bold text-sm">Senha de Acesso</p>
                        <p className="text-xs text-white/40">Última alteração há 3 meses</p>
                      </div>
                      <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-neon-blue transition-all">ALTERAR SENHA</button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="font-bold text-sm">Autenticação em Duas Etapas</p>
                        <p className="text-xs text-white/40">Aumente a segurança da sua conta</p>
                      </div>
                      <button className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer hover:bg-white/20 transition-all">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="font-bold text-sm">Sessões Ativas</p>
                        <p className="text-xs text-white/40">Você está conectado em 1 dispositivo</p>
                      </div>
                      <button className="text-xs font-bold text-rose-500 hover:underline">ENCERRAR TODAS</button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="glass-card p-8 space-y-8">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                      <Palette size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Aparência</h3>
                      <p className="text-xs text-white/40">Personalize a interface do sistema.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Tema do Sistema</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-neon-blue/10 border border-neon-blue rounded-xl flex flex-col items-center gap-2">
                          <Moon size={24} className="text-neon-blue" />
                          <span className="text-xs font-bold">Dark Mode</span>
                        </button>
                        <button className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                          <Globe size={24} className="text-white/20" />
                          <span className="text-xs font-bold">Light Mode</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Cor de Destaque</label>
                      <div className="flex items-center gap-3">
                        {['#00E5FF', '#A855F7', '#10B981', '#F59E0B', '#F43F5E'].map((color) => (
                          <button 
                            key={color}
                            onClick={() => setFormData({
                              ...formData,
                              appearance: { ...formData.appearance, primaryColor: color }
                            })}
                            className={`w-10 h-10 rounded-full border-2 transition-all ${formData.appearance.primaryColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'data' && (
                <div className="glass-card p-8 space-y-8">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                      <Database size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Dados e Backup</h3>
                      <p className="text-xs text-white/40">Gerencie a segurança dos seus dados.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-4 hover:bg-white/10 transition-all text-center">
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                        <Download size={24} />
                      </div>
                      <div>
                        <p className="font-bold">Exportar Tudo</p>
                        <p className="text-[10px] text-white/40 mt-1">Baixe todos os dados em formato JSON/Excel</p>
                      </div>
                    </button>
                    <button className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-4 hover:bg-white/10 transition-all text-center">
                      <div className="p-3 bg-neon-blue/10 rounded-xl text-neon-blue">
                        <Upload size={24} />
                      </div>
                      <div>
                        <p className="font-bold">Importar Dados</p>
                        <p className="text-[10px] text-white/40 mt-1">Migre dados de outro sistema</p>
                      </div>
                    </button>
                    <button className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-4 hover:bg-white/10 transition-all text-center">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                        <RefreshCw size={24} />
                      </div>
                      <div>
                        <p className="font-bold">Sincronizar</p>
                        <p className="text-[10px] text-white/40 mt-1">Forçar sincronização com a nuvem</p>
                      </div>
                    </button>
                    <button className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col items-center gap-4 hover:bg-rose-500/10 transition-all text-center">
                      <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                        <Trash2 size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-rose-500">Limpar Dados</p>
                        <p className="text-[10px] text-rose-500/40 mt-1">Apagar histórico e cache local</p>
                      </div>
                    </button>
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
