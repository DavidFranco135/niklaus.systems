/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
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
import AIAssistant from './components/AIAssistant';
import { AlertTriangle } from 'lucide-react';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isConfigured } = useAuth();
  
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#050505] text-[#00E5FF]">
      <div className="animate-pulse text-2xl font-bold tracking-widest">NIKLAUS</div>
    </div>
  );
  
  // In demo mode (not configured), we allow access to everything.
  // In a real app, we would redirect to login if !user.
  if (isConfigured && !user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

const FirebaseWarning = () => {
  const { isConfigured } = useAuth();
  if (isConfigured) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-black px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold shadow-lg shadow-amber-500/20 animate-bounce">
      <AlertTriangle size={16} />
      MODO DEMO: Configure o Firebase no arquivo .env para habilitar persistência.
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
          <FirebaseWarning />
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 relative">
            <Routes>
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
              <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
              <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
              <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
              <Route path="/fiado" element={<PrivateRoute><Fiado /></PrivateRoute>} />
              <Route path="/finance" element={<PrivateRoute><Finance /></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/catalog" element={<PrivateRoute><Catalog /></PrivateRoute>} />
              <Route path="/login" element={<Login />} />
            </Routes>
            <AIAssistant />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
