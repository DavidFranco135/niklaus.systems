import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  FileText,
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const [loading, setLoading] = useState(false);

  const exportToExcel = async (type: string) => {
    setLoading(true);
    try {
      let data: any[] = [];
      let fileName = '';

      if (type === 'vendas') {
        const snap = await getDocs(collection(db, 'sales'));
        data = snap.docs.map(doc => ({
          ID: doc.id,
          Data: doc.data().date?.toDate().toLocaleString(),
          Cliente: doc.data().customerName,
          Total: doc.data().total,
          Status: doc.data().status,
          Tipo: doc.data().type
        }));
        fileName = 'Relatorio_Vendas.xlsx';
      } else if (type === 'produtos') {
        const snap = await getDocs(collection(db, 'products'));
        data = snap.docs.map(doc => ({
          Nome: doc.data().name,
          Preco: doc.data().price,
          Estoque: doc.data().stock,
          Categoria: doc.data().category
        }));
        fileName = 'Relatorio_Produtos.xlsx';
      } else if (type === 'clientes') {
        const snap = await getDocs(collection(db, 'customers'));
        data = snap.docs.map(doc => ({
          Nome: doc.data().name,
          Email: doc.data().email,
          Telefone: doc.data().phone,
          Debito: doc.data().debt || 0
        }));
        fileName = 'Relatorio_Clientes.xlsx';
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório");
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    { id: 'vendas', title: 'Vendas por Período', desc: 'Análise detalhada de faturamento e volume de vendas.', icon: TrendingUp, color: 'text-neon-blue' },
    { id: 'produtos', title: 'Produtos Mais Vendidos', desc: 'Ranking de performance do seu catálogo.', icon: Package, color: 'text-amber-500' },
    { id: 'clientes', title: 'Clientes que Mais Compram', desc: 'Identifique seus clientes mais fiéis.', icon: Users, color: 'text-violet-500' },
    { id: 'financeiro', title: 'Fluxo de Caixa Mensal', desc: 'Relatório completo de entradas e saídas.', icon: DollarSign, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-white/40">Análises profundas do seu negócio.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
            <Calendar size={20} />
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <motion.div 
            key={report.title}
            whileHover={{ y: -5 }}
            className="glass-card p-6 flex items-center justify-between group cursor-pointer"
            onClick={() => exportToExcel(report.id)}
          >
            <div className="flex items-center gap-6">
              <div className={`p-4 bg-white/5 rounded-2xl ${report.color}`}>
                <report.icon size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{report.title}</h3>
                <p className="text-sm text-white/40 mt-1">{report.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-neon-blue hover:bg-neon-blue/10 transition-all">
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              </button>
              <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="p-4 bg-neon-blue/10 rounded-full text-neon-blue relative z-10">
          <Sparkles size={48} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold">Relatório Personalizado com IA</h3>
          <p className="text-white/40 max-w-md mt-2">
            Precisa de uma análise específica? Use nossa IA para gerar um relatório sob medida para suas necessidades através do chat.
          </p>
        </div>
        <button className="bg-neon-blue text-black font-bold px-8 py-3 rounded-xl hover:brightness-110 transition-all relative z-10 flex items-center gap-2">
          Abrir Niklaus AI
          <Sparkles size={18} />
        </button>
      </div>
    </div>
  );
}
