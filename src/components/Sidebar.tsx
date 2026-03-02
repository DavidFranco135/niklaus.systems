// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Users,
  CreditCard, DollarSign, Globe, BarChart3, Settings,
  Store, ChevronLeft, ChevronRight, LogOut, User, Menu, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../hooks/useAuth';

const cn = (...i: any[]) => twMerge(clsx(i));

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',       path: '/' },
  { icon: ShoppingCart,    label: 'Vendas (PDV)',     path: '/pos' },
  { icon: Package,         label: 'Produtos',         path: '/products' },
  { icon: Boxes,           label: 'Estoque',          path: '/inventory' },
  { icon: Users,           label: 'Clientes',         path: '/customers' },
  { icon: CreditCard,      label: 'Fiado',            path: '/fiado' },
  { icon: DollarSign,      label: 'Financeiro',       path: '/finance' },
  { icon: Globe,           label: 'Pedidos Online',   path: '/orders' },
  { icon: Store,           label: 'Catálogo Digital', path: '/catalog' },
  { icon: BarChart3,       label: 'Relatórios',       path: '/reports' },
  { icon: Settings,        label: 'Configurações',    path: '/settings' },
];

function NavItems({ isCollapsed, onNavigate }: { isCollapsed: boolean; onNavigate?: () => void }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path} to={item.path} end={item.path === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative',
                isActive ? 'bg-neon-blue/10 text-neon-blue' : 'text-white/50 hover:text-white hover:bg-white/5')
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={cn('shrink-0', isCollapsed && 'mx-auto', isActive && 'text-neon-blue')} />
                {!isCollapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
                {isActive && !isCollapsed && <motion.div layoutId="activeIndicator" className="absolute right-2 w-1.5 h-1.5 bg-neon-blue rounded-full" />}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white text-black text-xs rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-border-subtle">
        {!isCollapsed && profile && (
          <div className="px-3 py-2 flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-neon-blue/10 rounded-full flex items-center justify-center text-neon-blue overflow-hidden shrink-0">
              {(profile as any)?.photoURL
                ? <img src={(profile as any).photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <User size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{profile.name}</p>
              <p className="text-[10px] text-white/40 uppercase">{(profile as any)?.tipo || 'admin'}</p>
            </div>
          </div>
        )}
        <button
          onClick={async () => { await logout(); navigate('/login'); onNavigate?.(); }}
          className={cn('flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all', isCollapsed && 'justify-center')}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Botão hamburguer — só mobile ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[200] p-2.5 bg-card-bg border border-border-subtle rounded-xl text-white shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* ── Drawer mobile ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[190] bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-[195] w-64 bg-card-bg border-r border-border-subtle flex flex-col"
            >
              <div className="px-4 py-5 flex items-center justify-between border-b border-border-subtle">
                <span className="text-xl font-black tracking-tighter text-neon-blue neon-shadow">NIKLAUS</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"><X size={18} /></button>
              </div>
              <NavItems isCollapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Sidebar desktop ── */}
      <motion.aside
        initial={false} animate={{ width: isCollapsed ? 76 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex h-screen bg-card-bg border-r border-border-subtle flex-col z-50 shrink-0"
      >
        <div className="px-4 py-5 flex items-center justify-between border-b border-border-subtle">
          {!isCollapsed && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-black tracking-tighter text-neon-blue neon-shadow">NIKLAUS</motion.div>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={cn('p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors', isCollapsed && 'mx-auto')}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <NavItems isCollapsed={isCollapsed} />
      </motion.aside>
    </>
  );
}
