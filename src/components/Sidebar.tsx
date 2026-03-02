import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  CreditCard,
  DollarSign,
  Globe,
  BarChart3,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../hooks/useAuth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'Vendas (PDV)', path: '/pos' },
  { icon: Package, label: 'Produtos', path: '/products' },
  { icon: Boxes, label: 'Estoque', path: '/inventory' },
  { icon: Users, label: 'Clientes', path: '/customers' },
  { icon: CreditCard, label: 'Fiado', path: '/fiado' },
  { icon: DollarSign, label: 'Financeiro', path: '/finance' },
  { icon: Globe, label: 'Pedidos Online', path: '/orders' },
  { icon: Store, label: 'Catálogo Digital', path: '/catalog' },
  { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 76 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-card-bg border-r border-border-subtle flex flex-col z-50 shrink-0"
    >
      {/* Logo */}
      <div className="px-4 py-5 flex items-center justify-between border-b border-border-subtle">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xl font-black tracking-tighter text-neon-blue neon-shadow"
          >
            NIKLAUS
          </motion.div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white',
            isCollapsed && 'mx-auto'
          )}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative',
                isActive
                  ? 'bg-neon-blue/10 text-neon-blue'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={cn(
                    'shrink-0 transition-transform group-hover:scale-110',
                    isCollapsed && 'mx-auto',
                    isActive && 'text-neon-blue'
                  )}
                />
                {!isCollapsed && (
                  <span className="font-medium text-sm truncate">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-2 w-1.5 h-1.5 bg-neon-blue rounded-full"
                  />
                )}
                {/* Tooltip quando collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white text-black text-xs rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-3 border-t border-border-subtle space-y-1">
        {!isCollapsed && profile && (
          <div className="px-3 py-2 flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-neon-blue/10 rounded-full flex items-center justify-center text-neon-blue overflow-hidden shrink-0">
              {(profile as any)?.photoURL ? (
                <img src={(profile as any).photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{profile.name}</p>
              <p className="text-[10px] text-white/40 uppercase">{(profile as any)?.tipo || 'admin'}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all group',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white text-black text-xs rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Sair
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
