import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import AIAssistant from './components/AIAssistant';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Fiado from './pages/Fiado';
import Finance from './pages/Finance';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import { AlertTriangle, Loader2 } from 'lucide-react';

// ─── Guard de rota privada ─────────────────────────────────────────────────
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg text-neon-blue flex-col gap-4">
        <Loader2 size={40} className="animate-spin" />
        <p className="text-sm font-bold tracking-widest text-white/40 uppercase animate-pulse">
          Carregando NIKLAUS...
        </p>
      </div>
    );
  }

  if (isConfigured && !user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── Banner de modo demo ───────────────────────────────────────────────────
const DemoBanner = () => {
  const { isConfigured, user } = useAuth();
  if (isConfigured || !user) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-black px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold shadow-xl shadow-amber-500/30">
      <AlertTriangle size={14} />
      MODO DEMO — Configure o Firebase no .env para persistência real
    </div>
  );
};

// ─── Layout interno (com sidebar) ─────────────────────────────────────────
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-dark-bg text-white overflow-hidden font-sans">
    <DemoBanner />
    <Sidebar />
    <main className="flex-1 overflow-y-auto p-6 relative">
      {children}
    </main>
    <AIAssistant />
  </div>
);

// ─── App root ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Página de login — sem sidebar */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas com sidebar */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/fiado" element={<Fiado />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
