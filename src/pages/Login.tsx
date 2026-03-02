import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Loader2,
  Eye, EyeOff, User, KeyRound, CheckCircle2, X, UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db, auth } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';

type Mode = 'login' | 'forgot' | 'register';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('niklaus.systems@gmail.com');
  const [password, setPassword] = useState('654326');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminPhoto, setAdminPhoto] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Buscar foto do admin para exibir no ícone
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'adminSettings', 'profile'));
        if (snap.exists() && snap.data()?.photoURL) setAdminPhoto(snap.data().photoURL);
      } catch { /* sem foto = ícone padrão */ }
    })();
  }, []);

  const go = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
    if (m === 'login') { setEmail('niklaus.systems@gmail.com'); setPassword('654326'); }
    else { setEmail(''); setPassword(''); setName(''); }
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const code = err?.code ?? '';
      if (['auth/invalid-credential','auth/user-not-found','auth/wrong-password'].includes(code))
        setError('Email ou senha incorretos.');
      else if (code === 'auth/too-many-requests')
        setError('Muitas tentativas. Aguarde e tente novamente.');
      else
        setError('Falha no login. Verifique sua conexão.');
    } finally { setLoading(false); }
  };

  // ── Esqueceu senha ─────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Informe seu email.'); return; }
    setLoading(true); setError('');
    try {
      await sendPasswordResetEmail(auth!, email);
      setSuccess(`Link enviado para ${email}. Verifique sua caixa de entrada (e spam).`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') setError('Email não encontrado.');
      else setError('Erro ao enviar email. Tente novamente.');
    } finally { setLoading(false); }
  };

  // ── Cadastro ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (password.length < 6) { setError('Senha deve ter mínimo 6 caracteres.'); return; }
    setLoading(true); setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth!, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, name, email, role: 'admin', tipo: 'admin',
        createdAt: serverTimestamp(),
      });
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('Email já cadastrado. Faça login.');
      else if (err.code === 'auth/invalid-email') setError('Email inválido.');
      else setError('Erro ao criar conta: ' + (err.message ?? ''));
    } finally { setLoading(false); }
  };

  const icons: Record<Mode, React.ReactNode> = {
    login:    adminPhoto
                ? <img src={adminPhoto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                : <ShieldCheck size={36} className="text-black"/>,
    forgot:   <KeyRound size={36} className="text-black"/>,
    register: <UserPlus size={36} className="text-black"/>,
  };
  const titles: Record<Mode, [string, string]> = {
    login:    ['NIKLAUS', 'Gestão inteligente para o seu negócio.'],
    forgot:   ['Recuperar Senha', 'Enviaremos um link de redefinição.'],
    register: ['Criar Conta', 'Comece a usar o NIKLAUS agora mesmo.'],
  };

  return (
    <div className="fixed inset-0 bg-dark-bg flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full pointer-events-none"/>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none"/>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md relative">

        {/* Ícone / Foto */}
        <div className="text-center mb-8">
          <motion.div
            key={mode}
            initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-neon-blue rounded-3xl mb-5 shadow-lg shadow-neon-blue/30 overflow-hidden"
          >
            {icons[mode]}
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} transition={{ duration:0.15 }}>
              <h1 className="text-3xl font-black tracking-tighter mb-1">{titles[mode][0]}</h1>
              <p className="text-white/40 text-sm">{titles[mode][1]}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity:0, x: mode==='login' ? -16 : 16 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.18 }}
            className="glass-card p-8 space-y-5"
          >
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex gap-2 items-start">
                <X size={15} className="mt-0.5 shrink-0"/>{error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex gap-2 items-start">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0"/>{success}
              </div>
            )}

            {/* LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <Field label="Email">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={17}/>
                  <input type="email" required autoComplete="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-neon-blue transition-colors text-sm"
                    placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
                </Field>
                <Field label="Senha" right={
                  <button type="button" onClick={()=>go('forgot')} className="text-xs text-neon-blue font-bold hover:underline">
                    Esqueceu a senha?
                  </button>
                }>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={17}/>
                  <input type={showPass?'text':'password'} required autoComplete="current-password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 outline-none focus:border-neon-blue transition-colors text-sm"
                    placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </Field>
                <Btn loading={loading} label="ENTRAR NO SISTEMA"/>
              </form>
            )}

            {/* ESQUECEU SENHA */}
            {mode === 'forgot' && !success && (
              <form onSubmit={handleForgot} className="space-y-5">
                <Field label="Seu Email">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={17}/>
                  <input type="email" required autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-neon-blue transition-colors text-sm"
                    placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
                </Field>
                <Btn loading={loading} label="ENVIAR LINK DE RECUPERAÇÃO"/>
              </form>
            )}

            {/* CADASTRO */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <Field label="Seu Nome">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={17}/>
                  <input type="text" required autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-neon-blue transition-colors text-sm"
                    placeholder="João Silva" value={name} onChange={e=>setName(e.target.value)}/>
                </Field>
                <Field label="Email">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={17}/>
                  <input type="email" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-neon-blue transition-colors text-sm"
                    placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
                </Field>
                <Field label="Senha (mín. 6 caracteres)">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={17}/>
                  <input type={showPass?'text':'password'} required minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 outline-none focus:border-neon-blue transition-colors text-sm"
                    placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                    {showPass ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </Field>
                <Btn loading={loading} label="CRIAR MINHA CONTA"/>
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Rodapé */}
        <div className="text-center mt-6 text-sm text-white/40">
          {mode === 'login' ? (
            <p>Não tem conta?{' '}
              <button onClick={()=>go('register')} className="text-neon-blue font-bold hover:underline">
                Começar agora
              </button>
            </p>
          ) : (
            <p>Já tem conta?{' '}
              <button onClick={()=>go('login')} className="text-neon-blue font-bold hover:underline">
                Fazer login
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, right, children }: { label:string; right?:React.ReactNode; children:React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</label>
        {right}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function Btn({ loading, label }: { loading:boolean; label:string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full bg-neon-blue text-black font-bold py-3.5 rounded-xl shadow-lg shadow-neon-blue/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-1">
      {loading
        ? <Loader2 size={19} className="animate-spin"/>
        : <>{label}<ArrowRight size={17} className="group-hover:translate-x-1 transition-transform"/></>}
    </button>
  );
}
