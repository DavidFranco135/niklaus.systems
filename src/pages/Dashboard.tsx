import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { motion } from 'motion/react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, loading }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-6 flex flex-col gap-4"
  >
    <div className="flex items-center justify-between">
      <div className="p-3 bg-white/5 rounded-xl">
        <Icon size={24} className="text-neon-blue" />
      </div>
      {trend && !loading && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}%
        </div>
      )}
    </div>
    <div>
      <p className="text-white/40 text-sm font-medium">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-white/5 animate-pulse rounded mt-1" />
      ) : (
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      )}
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    dailyRevenue: 0,
    monthlySales: 0,
    totalCustomers: 0,
    activeProducts: 0,
    lowStockCount: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. Daily Revenue
      const dailySalesQuery = query(
        collection(db, 'sales'),
        where('date', '>=', Timestamp.fromDate(todayStart))
      );
      const dailySnapshot = await getDocs(dailySalesQuery);
      const dailyRevenue = dailySnapshot.docs.reduce((acc, doc) => acc + doc.data().total, 0);

      // 2. Monthly Sales Count
      const monthlySalesQuery = query(
        collection(db, 'sales'),
        where('date', '>=', Timestamp.fromDate(monthStart))
      );
      const monthlySnapshot = await getDocs(monthlySalesQuery);
      const monthlySales = monthlySnapshot.size;

      // 3. Total Customers
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const totalCustomers = customersSnapshot.size;

      // 4. Active Products & Low Stock
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const activeProducts = productsSnapshot.size;
      const lowStockCount = productsSnapshot.docs.filter(doc => doc.data().stock <= 5).length;

      setStats({
        dailyRevenue,
        monthlySales,
        totalCustomers,
        activeProducts,
        lowStockCount
      });

      // 5. Chart Data (Last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        last7Days.push({
          date: d,
          name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
          vendas: 0
        });
      }

      const weekSalesQuery = query(
        collection(db, 'sales'),
        where('date', '>=', Timestamp.fromDate(last7Days[0].date))
      );
      const weekSnapshot = await getDocs(weekSalesQuery);
      
      weekSnapshot.docs.forEach(doc => {
        const saleDate = doc.data().date.toDate();
        saleDate.setHours(0, 0, 0, 0);
        const dayData = last7Days.find(d => d.date.getTime() === saleDate.getTime());
        if (dayData) {
          dayData.vendas += doc.data().total;
        }
      });

      setChartData(last7Days);

      // 6. Top Products (Mock for now, would need aggregation)
      setTopProducts([
        { name: 'Camiseta Oversized', sales: 45, color: '#00E5FF' },
        { name: 'Tênis Running', sales: 32, color: '#FF00E5' },
        { name: 'Boné Street', sales: 28, color: '#E5FF00' },
        { name: 'Meia Tech', sales: 15, color: '#00FF66' },
      ]);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-white/40">Bem-vindo de volta, {profile?.name || 'Administrador'}.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Faturamento do Dia" value={`R$ ${stats.dailyRevenue.toFixed(2)}`} icon={DollarSign} loading={loading} />
        <StatCard title="Vendas do Mês" value={stats.monthlySales} icon={TrendingUp} loading={loading} />
        <StatCard title="Total de Clientes" value={stats.totalCustomers} icon={Users} loading={loading} />
        <StatCard title="Produtos Ativos" value={stats.activeProducts} icon={Package} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-semibold text-lg">Desempenho de Vendas (7 dias)</h3>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-neon-blue" size={32} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#00E5FF' }}
                  />
                  <Area type="monotone" dataKey="vendas" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorVendas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-8">Produtos Mais Vendidos</h3>
          <div className="space-y-6">
            {topProducts.map((product) => (
              <div key={product.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{product.name}</span>
                  <span className="font-medium">{product.sales} un.</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(product.sales / 50) * 100}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: product.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {stats.lowStockCount > 0 && (
            <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-rose-500 shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-rose-500">Estoque Baixo</p>
                <p className="text-xs text-rose-500/80 mt-1">{stats.lowStockCount} produtos atingiram o nível crítico de estoque.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
