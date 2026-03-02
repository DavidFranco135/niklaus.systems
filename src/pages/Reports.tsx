import React, { useState } from 'react';
import {
  BarChart3, Download, Calendar, TrendingUp, Users, Package,
  DollarSign, FileText, Loader2, Sparkles, Filter, ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

export default function Reports() {
  const [loading, setLoading] = useState<string | null>(null);

  // Filtros de período
  const now = new Date();
  const [mode, setMode] = useState<'month'|'day'|'range'>('month');
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selDay, setSelDay] = useState(now.toISOString().slice(0,10));
  const [rangeFrom, setRangeFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10));
  const [rangeTo, setRangeTo] = useState(now.toISOString().slice(0,10));

  function getDateRange(): [Date, Date] {
    if (mode === 'month') {
      return [new Date(selYear, selMonth, 1), new Date(selYear, selMonth + 1, 0, 23, 59, 59)];
    } else if (mode === 'day') {
      const d = new Date(selDay);
      return [new Date(d.getFullYear(), d.getMonth(), d.getDate()), new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)];
    } else {
      return [new Date(rangeFrom + 'T00:00:00'), new Date(rangeTo + 'T23:59:59')];
    }
  }

  function periodLabel() {
    if (mode === 'month') return `${MONTHS[selMonth]} / ${selYear}`;
    if (mode === 'day') return new Date(selDay + 'T12:00').toLocaleDateString('pt-BR');
    return `${new Date(rangeFrom+'T12:00').toLocaleDateString('pt-BR')} até ${new Date(rangeTo+'T12:00').toLocaleDateString('pt-BR')}`;
  }

  const exportVendas = async () => {
    setLoading('vendas');
    try {
      const [from, to] = getDateRange();
      const q = query(collection(db, 'sales'),
        where('date', '>=', Timestamp.fromDate(from)),
        where('date', '<=', Timestamp.fromDate(to)),
        orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        ID: d.id,
        Data: d.data().date?.toDate().toLocaleString('pt-BR'),
        Cliente: d.data().customerName ?? '—',
        Total: `R$ ${(d.data().total ?? 0).toFixed(2)}`,
        Status: d.data().status ?? '—',
        Tipo: d.data().type ?? '—',
        Itens: d.data().items?.length ?? 0,
      }));
      exportXLSX(data, `Vendas_${periodLabel().replace(/\//g,'-')}`);
    } catch (e: any) {
      // Sem índice composto — tenta sem filtro de data
      const snap = await getDocs(query(collection(db, 'sales'), orderBy('date','desc')));
      const [from, to] = getDateRange();
      const data = snap.docs
        .filter(d => { try { const dt = d.data().date?.toDate(); return dt >= from && dt <= to; } catch { return true; }})
        .map(d => ({
          ID: d.id,
          Data: d.data().date?.toDate().toLocaleString('pt-BR'),
          Cliente: d.data().customerName ?? '—',
          Total: `R$ ${(d.data().total ?? 0).toFixed(2)}`,
          Status: d.data().status ?? '—',
        }));
      exportXLSX(data, `Vendas_${periodLabel().replace(/\//g,'-')}`);
    } finally { setLoading(null); }
  };

  const exportProdutos = async () => {
    setLoading('produtos');
    try {
      const snap = await getDocs(collection(db, 'products'));
      const data = snap.docs.map(d => ({
        Nome: d.data().name, Categoria: d.data().category ?? '—',
        'Preço': `R$ ${(d.data().price ?? 0).toFixed(2)}`,
        'Custo': d.data().costPrice ? `R$ ${d.data().costPrice.toFixed(2)}` : '—',
        Estoque: d.data().stock, Status: d.data().status ?? 'Ativo',
      }));
      exportXLSX(data, 'Produtos');
    } catch (e) { console.error(e); } finally { setLoading(null); }
  };

  const exportClientes = async () => {
    setLoading('clientes');
    try {
      const snap = await getDocs(collection(db, 'customers'));
      const data = snap.docs.map(d => ({
        Nome: d.data().name, Email: d.data().email ?? '—',
        Telefone: d.data().phone ?? '—', CPF: d.data().cpf ?? '—',
        'Dívida Fiado': `R$ ${(d.data().debt ?? 0).toFixed(2)}`,
      }));
      exportXLSX(data, 'Clientes');
    } catch (e) { console.error(e); } finally { setLoading(null); }
  };

  const exportFinanceiro = async () => {
    setLoading('financeiro');
    try {
      const [from, to] = getDateRange();
      const snap = await getDocs(query(collection(db, 'transactions'), orderBy('date','desc')));
      const rawData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = rawData.filter((d: any) => {
        try { const dt = d.date?.toDate(); return dt >= from && dt <= to; } catch { return true; }
      });
      const data = (filtered as any[]).map(d => ({
        Data: d.date?.toDate().toLocaleString('pt-BR') ?? '—',
        Tipo: d.type === 'income' ? 'Entrada' : 'Saída',
        Categoria: d.category ?? '—',
        Descrição: d.description ?? '—',
        Valor: `R$ ${(d.amount ?? 0).toFixed(2)}`,
      }));
      // Resumo no topo
      const income = (filtered as any[]).filter((d:any) => d.type==='income').reduce((a:number,d:any) => a+(d.amount??0),0);
      const expense = (filtered as any[]).filter((d:any) => d.type==='expense').reduce((a:number,d:any) => a+(d.amount??0),0);
      const summary = [
        { Data:'RESUMO', Tipo:'', Categoria:'', Descrição:'Total Entradas', Valor: `R$ ${income.toFixed(2)}` },
        { Data:'', Tipo:'', Categoria:'', Descrição:'Total Saídas', Valor: `R$ ${expense.toFixed(2)}` },
        { Data:'', Tipo:'', Categoria:'', Descrição:'Saldo', Valor: `R$ ${(income-expense).toFixed(2)}` },
        { Data:'', Tipo:'', Categoria:'', Descrição:'', Valor:'' },
        ...data,
      ];
      exportXLSX(summary, `Financeiro_${periodLabel().replace(/\//g,'-')}`);
    } catch (e) { console.error(e); } finally { setLoading(null); }
  };

  function exportXLSX(data: any[], name: string) {
    if (!data.length) { alert('Nenhum dado encontrado para o período.'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0,31));
    XLSX.writeFile(wb, `niklaus_${name}.xlsx`);
  }

  const reports = [
    { id:'vendas',     title:'Vendas por Período', desc:'Faturamento e volume de vendas no período.', icon:TrendingUp, color:'text-neon-blue',   action: exportVendas },
    { id:'produtos',   title:'Inventário Produtos', desc:'Estoque e preços de todos os produtos.',    icon:Package,    color:'text-amber-500',   action: exportProdutos },
    { id:'clientes',   title:'Base de Clientes',    desc:'Todos os clientes e saldo fiado.',          icon:Users,      color:'text-violet-500',  action: exportClientes },
    { id:'financeiro', title:'Fluxo Financeiro',    desc:'Entradas, saídas e saldo do período.',      icon:DollarSign, color:'text-emerald-500', action: exportFinanceiro },
  ];

  const years = Array.from({length:5},(_,i)=>now.getFullYear()-i);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-white/40">Exporte dados e análises do seu negócio.</p>
      </header>

      {/* Seletor de período */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue"><Calendar size={18}/></div>
          <h3 className="font-bold">Período do Relatório</h3>
        </div>

        {/* Modo */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
          {[['month','Por Mês'],['day','Por Dia'],['range','Intervalo']].map(([v,l]) => (
            <button key={v} onClick={() => setMode(v as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode===v ? 'bg-neon-blue text-black' : 'text-white/40 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Controles por modo */}
        {mode === 'month' && (
          <div className="flex gap-3 flex-wrap">
            <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm">
              {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        {mode === 'day' && (
          <input type="date" value={selDay} onChange={e => setSelDay(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"/>
        )}
        {mode === 'range' && (
          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"/>
            <span className="text-white/40 text-sm">até</span>
            <input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-blue text-sm"/>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-neon-blue/5 border border-neon-blue/10 rounded-xl">
          <Calendar size={14} className="text-neon-blue"/>
          <span className="text-sm text-neon-blue font-medium">Período selecionado: <strong>{periodLabel()}</strong></span>
        </div>
      </div>

      {/* Cards de relatório */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map(r => (
          <motion.div key={r.id} whileHover={{ y:-4 }}
            className="glass-card p-6 flex items-center justify-between group cursor-pointer hover:border-neon-blue/20 transition-all"
            onClick={r.action}>
            <div className="flex items-center gap-5">
              <div className={`p-4 bg-white/5 rounded-2xl ${r.color} group-hover:bg-neon-blue/10 transition-all`}>
                <r.icon size={28}/>
              </div>
              <div>
                <h3 className="font-bold">{r.title}</h3>
                <p className="text-sm text-white/40 mt-0.5">{r.desc}</p>
                <p className="text-xs text-neon-blue font-bold mt-1">{periodLabel()}</p>
              </div>
            </div>
            <button className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-neon-blue hover:bg-neon-blue/10 transition-all ml-4">
              {loading === r.id ? <Loader2 size={20} className="animate-spin"/> : <Download size={20}/>}
            </button>
          </motion.div>
        ))}
      </div>

      {/* IA */}
      <div className="glass-card p-8 flex flex-col items-center text-center space-y-4 border-dashed border-2 border-white/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
        <div className="p-4 bg-neon-blue/10 rounded-full text-neon-blue relative z-10"><Sparkles size={40}/></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold">Relatório Personalizado com IA</h3>
          <p className="text-white/40 max-w-md mt-2 text-sm">
            Use o NIKLAUS AI para análises específicas, previsões e insights personalizados do seu negócio.
          </p>
        </div>
        <button onClick={() => { const btn = document.querySelector('[data-ai-toggle]') as HTMLButtonElement; btn?.click(); }}
          className="bg-neon-blue text-black font-bold px-8 py-3 rounded-xl hover:brightness-110 transition-all relative z-10 flex items-center gap-2">
          Abrir NIKLAUS AI <Sparkles size={16}/>
        </button>
      </div>
    </div>
  );
}
