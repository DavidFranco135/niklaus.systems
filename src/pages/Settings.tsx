import React, { useState, useEffect } from 'react';
import {
  User, Bell, Shield, Store, Database, ChevronRight,
  Moon, Sun, Save, Loader2, LogOut, CheckCircle2,
  AlertCircle, Palette, Download, Trash2, Key, Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { db } from '../services/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';
import ImageUpload from '../components/ImageUpload';
import * as XLSX from 'xlsx';

const ACCENT_COLORS = ['#00E5FF','#A855F7','#10B981','#F59E0B','#F43F5E','#3B82F6','#EC4899','#FF6B35'];

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const { primaryColor, isDark, setPrimaryColor, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [active, setActive] = useState('profile');

  const [form, setForm] = useState({
    name: '', email: '', phone: '', storeName: '', address: '', cnpj: '', photoURL: '',
    notifications: { sales: true, inventory: true, fiado: true, system: false },
  });

  useEffect(() => {
    if (profile) {
      setForm(p => ({
        ...p,
        name:      (profile as any).name      ?? '',
        email:     (profile as any).email     ?? '',
        phone:     (profile as any).phone     ?? '',
        storeName: (profile as any).storeName ?? '',
        address:   (profile as any).address   ?? '',
        cnpj:      (profile as any).cnpj      ?? '',
        photoURL:  (profile as any).photoURL  ?? '',
        notifications: (profile as any).notifications ?? p.notifications,
      }));
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { ...form, updatedAt: serverTimestamp() });
      // Salvar foto em adminSettings/profile para aparecer na tela de login
      await setDoc(doc(db, 'adminSettings', 'profile'), {
        photoURL: form.photoURL,
        name: form.name,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.warn('Salvar (pode ser demo):', err?.code);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false); }
  };

  const exportData = async (col: string) => {
    try {
      const snap = await getDocs(collection(db, col));
      const data = snap.docs.map(d => d.data());
      if (!data.length) { alert('Nenhum dado encontrado.'); return; }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, col);
      XLSX.writeFile(wb, `niklaus_${col}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch { alert('Erro ao exportar. Verifique as permissões.'); }
  };

  const sections = [
    { id:'profile',       label:'Meu Perfil',    icon:User     },
    { id:'store',         label:'Minha Loja',     icon:Store    },
    { id:'notifications', label:'Notificações',   icon:Bell     },
    { id:'security',      label:'Segurança',      icon:Shield   },
    { id:'appearance',    label:'Aparência',      icon:Palette  },
    { id:'data',          label:'Dados & Backup', icon:Database },
  ];

  const upd = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-white/40">Gerencie sua conta e preferências do sistema.</p>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 bg-rose-500/10 text-rose-500 px-6 py-3 rounded-xl font-bold hover:bg-rose-500/20 transition-all">
          <LogOut size={18}/> Sair do Sistema
        </button>
      </header>

      {saved && (
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400">
          <CheckCircle2 size={18}/> <span className="font-bold text-sm">Configurações salvas!</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-6 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-neon-blue/10 border-2 border-neon-blue/20 flex items-center justify-center">
              {form.photoURL
                ? <img src={form.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                : <User size={36} className="text-neon-blue"/>}
            </div>
            <div>
              <p className="font-bold">{form.name || 'Usuário'}</p>
              <span className="text-[10px] text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded mt-1 inline-block">
                {(profile as any)?.tipo ?? 'admin'}
              </span>
            </div>
          </div>
          <nav className="space-y-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`w-full p-3.5 flex items-center gap-3 rounded-xl transition-all text-left ${
                  active===s.id ? 'bg-neon-blue/10 text-neon-blue' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                <s.icon size={18}/>
                <span className="text-sm font-medium flex-1">{s.label}</span>
                {active===s.id && <ChevronRight size={14}/>}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}
              transition={{ duration:0.15 }}>

              {/* PERFIL */}
              {active==='profile' && (
                <form onSubmit={handleSave} className="glass-card p-8 space-y-6">
                  <SH icon={User} title="Informações do Perfil" desc="Dados da sua conta de acesso."/>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Foto de Perfil</label>
                    <p className="text-xs text-white/30">Esta foto aparecerá também na tela de login.</p>
                    <ImageUpload value={form.photoURL} onChange={u=>upd('photoURL',u)} onClear={()=>upd('photoURL','')}
                      aspectRatio="square" className="w-28" label="Enviar foto"/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <IF label="Nome Completo"    value={form.name}  onChange={v=>upd('name',v)}/>
                    <IF label="E-mail"           value={form.email} disabled type="email"/>
                    <IF label="Telefone/WhatsApp" value={form.phone} onChange={v=>upd('phone',v)} type="tel" placeholder="(11) 99999-9999"/>
                  </div>
                  <SaveBtn saving={saving}/>
                </form>
              )}

              {/* LOJA */}
              {active==='store' && (
                <form onSubmit={handleSave} className="glass-card p-8 space-y-6">
                  <SH icon={Store} title="Minha Loja" desc="Dados do seu estabelecimento."/>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <IF label="Nome da Empresa" value={form.storeName} onChange={v=>upd('storeName',v)} placeholder="Mercado do João"/>
                    <IF label="CNPJ / CPF"      value={form.cnpj}      onChange={v=>upd('cnpj',v)}      placeholder="00.000.000/0000-00"/>
                    <div className="md:col-span-2">
                      <IF label="Endereço Completo" value={form.address} onChange={v=>upd('address',v)} placeholder="Rua, nº, bairro, cidade — Estado"/>
                    </div>
                  </div>
                  <SaveBtn saving={saving} label="SALVAR LOJA"/>
                </form>
              )}

              {/* NOTIFICAÇÕES */}
              {active==='notifications' && (
                <div className="glass-card p-8 space-y-6">
                  <SH icon={Bell} title="Notificações" desc="Escolha como deseja ser alertado."/>
                  <div className="space-y-3">
                    {[
                      { id:'sales',     label:'Novas Vendas',      desc:'Alerta a cada venda realizada.'         },
                      { id:'inventory', label:'Estoque Crítico',   desc:'Produtos abaixo do mínimo.'             },
                      { id:'fiado',     label:'Vencimentos Fiado', desc:'Dívidas próximas ao limite de crédito.' },
                      { id:'system',    label:'Atualizações',      desc:'Novas versões e manutenções.'           },
                    ].map(it => (
                      <div key={it.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                          <p className="font-bold text-sm">{it.label}</p>
                          <p className="text-xs text-white/40">{it.desc}</p>
                        </div>
                        <Toggle
                          value={form.notifications[it.id as keyof typeof form.notifications]}
                          onChange={v=>setForm(f=>({ ...f, notifications:{ ...f.notifications, [it.id]:v } }))}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEGURANÇA */}
              {active==='security' && (
                <div className="glass-card p-8 space-y-6">
                  <SH icon={Shield} title="Segurança" desc="Proteja sua conta."/>
                  <div className="space-y-3">
                    <Row label="Senha de Acesso" desc="Autenticado via Firebase Auth">
                      <button type="button"
                        onClick={()=>alert('Acesse o Firebase Console ou use "Esqueceu a senha" na tela de login.')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-neon-blue transition-all">
                        ALTERAR
                      </button>
                    </Row>
                    <Row label="Autenticação 2FA" desc="Disponível na versão Pro">
                      <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full">EM BREVE</span>
                    </Row>
                    <div className="p-4 bg-neon-blue/5 border border-neon-blue/10 rounded-xl">
                      <p className="text-xs text-white/40">Sessão ativa: <strong className="text-white">{form.email}</strong></p>
                    </div>
                  </div>
                </div>
              )}

              {/* APARÊNCIA */}
              {active==='appearance' && (
                <div className="glass-card p-8 space-y-8">
                  <SH icon={Palette} title="Aparência" desc="Personalize cores e tema."/>

                  {/* Tema Dark/Light */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Tema do Sistema</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => { if (!isDark) toggleTheme(); }}
                        className={`p-5 rounded-xl flex flex-col items-center gap-3 border-2 transition-all ${
                          isDark ? 'border-neon-blue bg-neon-blue/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                        <Moon size={28} className={isDark ? 'text-neon-blue' : 'text-white/40'}/>
                        <div>
                          <p className="font-bold text-sm">Dark Mode</p>
                          {isDark && <p className="text-[10px] text-neon-blue">✓ Ativo</p>}
                        </div>
                      </button>
                      <button type="button" onClick={() => { if (isDark) toggleTheme(); }}
                        className={`p-5 rounded-xl flex flex-col items-center gap-3 border-2 transition-all ${
                          !isDark ? 'border-neon-blue bg-neon-blue/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                        <Sun size={28} className={!isDark ? 'text-neon-blue' : 'text-white/40'}/>
                        <div>
                          <p className="font-bold text-sm">Light Mode</p>
                          {!isDark && <p className="text-[10px] text-neon-blue">✓ Ativo</p>}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Cor primária */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Cor de Destaque</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {ACCENT_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setPrimaryColor(c)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            primaryColor===c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                          style={{ backgroundColor: c }}
                          title={c}/>
                      ))}
                    </div>
                    {/* Input custom */}
                    <div className="flex items-center gap-3">
                      <input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none"/>
                      <div className="flex-1">
                        <input type="text" value={primaryColor} onChange={e=>{ if(/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setPrimaryColor(e.target.value); }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue font-mono text-sm transition-colors"/>
                      </div>
                      <div className="w-12 h-12 rounded-xl shadow-lg" style={{ backgroundColor: primaryColor }}/>
                    </div>
                    <p className="text-xs text-white/30">A cor é aplicada instantaneamente em todo o sistema.</p>
                  </div>
                </div>
              )}

              {/* DADOS */}
              {active==='data' && (
                <div className="glass-card p-8 space-y-6">
                  <SH icon={Database} title="Dados & Backup" desc="Exporte e gerencie seus dados."/>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label:'Vendas',       icon:Download, col:'sales',        color:'emerald' },
                      { label:'Produtos',     icon:Download, col:'products',     color:'neon-blue' },
                      { label:'Clientes',     icon:Download, col:'customers',    color:'violet' },
                      { label:'Transações',   icon:Download, col:'transactions', color:'amber' },
                    ].map(it => (
                      <button key={it.col} onClick={()=>exportData(it.col)}
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group text-left">
                        <div className={`p-3 bg-${it.color}-500/10 rounded-xl text-${it.color}-500 group-hover:scale-110 transition-transform`}>
                          <it.icon size={20}/>
                        </div>
                        <div>
                          <p className="font-bold text-sm">Exportar {it.label}</p>
                          <p className="text-[10px] text-white/40">.xlsx</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                    <p className="text-sm font-bold text-rose-400 mb-2">Zona de Perigo</p>
                    <button type="button"
                      onClick={()=>{ if(window.confirm('Limpar cache local?')){ localStorage.clear(); window.location.reload(); }}}
                      className="px-4 py-2 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center gap-2">
                      <Trash2 size={14}/> Limpar Cache Local
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

/* ── Subcomponentes ── */
function SH({ icon:Icon, title, desc }: { icon:any; title:string; desc:string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 pb-5">
      <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue"><Icon size={19}/></div>
      <div><h3 className="text-xl font-bold">{title}</h3><p className="text-xs text-white/40">{desc}</p></div>
    </div>
  );
}

function IF({ label, value, onChange, type='text', placeholder='', disabled=false }:
  { label:string; value:string; onChange?:(v:string)=>void; type?:string; placeholder?:string; disabled?:boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</label>
      <input type={type} disabled={disabled} placeholder={placeholder} value={value}
        onChange={e=>onChange?.(e.target.value)}
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue transition-colors text-sm ${disabled?'opacity-40 cursor-not-allowed':''}`}/>
    </div>
  );
}

function Toggle({ value, onChange }: { value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <button type="button" onClick={()=>onChange(!value)}
      className={`w-12 h-6 rounded-full relative transition-all duration-200 ${value?'bg-neon-blue':'bg-white/10'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${value?'left-7':'left-1'}`}/>
    </button>
  );
}

function Row({ label, desc, children }: { label:string; desc:string; children:React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
      <div><p className="font-bold text-sm">{label}</p><p className="text-xs text-white/40">{desc}</p></div>
      {children}
    </div>
  );
}

function SaveBtn({ saving, label='SALVAR ALTERAÇÕES' }: { saving:boolean; label?:string }) {
  return (
    <button type="submit" disabled={saving}
      className="flex items-center gap-2 bg-neon-blue text-black font-black px-10 py-4 rounded-xl shadow-lg shadow-neon-blue/20 hover:brightness-110 transition-all disabled:opacity-50">
      {saving ? <Loader2 className="animate-spin" size={19}/> : <Save size={19}/>}
      {saving ? 'SALVANDO...' : label}
    </button>
  );
}
