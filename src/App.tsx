import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
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
import PublicCatalog from './pages/PublicCatalog';
import { Loader2 } from 'lucide-react';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isConfigured } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg text-neon-blue flex-col gap-4">
        <Loader2 size={40} className="animate-spin" />
        <p className="text-sm font-bold tracking-widest text-white/40 uppercase animate-pulse">Carregando NIKLAUS...</p>
      </div>
    );
  }
  if (isConfigured && !user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-dark-bg text-white overflow-hidden font-sans">
    <Sidebar />
    <main className="flex-1 overflow-y-auto p-6 relative">
      {children}
    </main>
    <AIAssistant />
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rota PÚBLICA — catálogo da loja (sem auth, sem sidebar) */}
            <Route path="/loja/:slug" element={<PublicCatalog />} />

            {/* Login */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas com sidebar */}
            <Route path="/*" element={
              <PrivateRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/"          element={<Dashboard />} />
                    <Route path="/pos"       element={<POS />} />
                    <Route path="/products"  element={<Products />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/fiado"     element={<Fiado />} />
                    <Route path="/finance"   element={<Finance />} />
                    <Route path="/orders"    element={<Orders />} />
                    <Route path="/reports"   element={<Reports />} />
                    <Route path="/settings"  element={<Settings />} />
                    <Route path="/catalog"   element={<Catalog />} />
                    <Route path="*"          element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            }/>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
