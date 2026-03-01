import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? '80px' : '260px' }}
      className="h-screen bg-card-bg border-r border-border-subtle flex flex-col transition-all duration-300 z-50"
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-black tracking-tighter text-neon-blue"
          >
            NIKLAUS
          </motion.div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
              isActive 
                ? "bg-neon-blue/10 text-neon-blue" 
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={22} className={cn(
              "shrink-0 transition-transform group-hover:scale-110",
              isCollapsed && "mx-auto"
            )} />
            {!isCollapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-white text-black text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border-subtle">
        <button className={cn(
          "flex items-center gap-3 px-3 py-3 w-full rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all group",
          isCollapsed && "justify-center"
        )}>
          <LogOut size={22} />
          {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
}
