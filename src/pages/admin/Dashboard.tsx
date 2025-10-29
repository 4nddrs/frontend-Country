import { useState, useEffect } from "react";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, ClipboardList, AlertCircle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDashboardStats,
  getRecentAttentions,
  getMonthlyFinancials,
  getTasksSummary
} from '../../services/dashboardService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalHorses: 0,
    activeHorses: 0,
    schoolHorses: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    totalOwners: 0,
    pendingTasks: 0,
    completedTasks: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netBalance: 0
  });

  const [recentAttentions, setRecentAttentions] = useState<any[]>([]);
  const [monthlyFinancials, setMonthlyFinancials] = useState<any[]>([]);
  const [tasksSummary, setTasksSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, attentionsData, financialsData, tasksData] = await Promise.all([
        getDashboardStats(),
        getRecentAttentions(8),
        getMonthlyFinancials(),
        getTasksSummary()
      ]);

      setStats(statsData);
      setRecentAttentions(attentionsData);
      setMonthlyFinancials(financialsData);
      setTasksSummary(tasksData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short'
    });
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bdab62] mx-auto"></div>
          <p className="mt-4 text-[#F8F4E3]">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-[#bdab62]">Dashboard</h1>
        <p className="text-gray-400 mt-1">Panel de control - Country Club Hipica</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Caballos Totales */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 p-5 rounded-xl border border-emerald-700/30 hover:border-emerald-600/50 transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Caballos Totales</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalHorses}</p>
                  <p className="text-emerald-400 text-sm mt-1">{stats.activeHorses} activos</p>
                </div>
                <Activity className="w-10 h-10 text-emerald-400 opacity-80" />
              </div>
            </div>

            {/* Empleados */}
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-5 rounded-xl border border-blue-700/30 hover:border-blue-600/50 transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Empleados</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalEmployees}</p>
                  <p className="text-blue-400 text-sm mt-1">{stats.activeEmployees} activos</p>
                </div>
                <Users className="w-10 h-10 text-blue-400 opacity-80" />
              </div>
            </div>

            {/* Propietarios */}
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-5 rounded-xl border border-purple-700/30 hover:border-purple-600/50 transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Propietarios</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalOwners}</p>
                  <p className="text-purple-400 text-sm mt-1">Registrados</p>
                </div>
                <Users className="w-10 h-10 text-purple-400 opacity-80" />
              </div>
            </div>

            {/* Caballos de Escuela */}
            <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 p-5 rounded-xl border border-amber-700/30 hover:border-amber-600/50 transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Caballos Escuela</p>
                  <p className="text-3xl font-bold mt-1">{stats.schoolHorses}</p>
                  <p className="text-amber-400 text-sm mt-1">Disponibles</p>
                </div>
                <TrendingUp className="w-10 h-10 text-amber-400 opacity-80" />
              </div>
            </div>
          </div>

          {/* FINANZAS DEL MES */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Finanzas del Mes
                </h2>
                <p className="text-gray-400 text-sm mt-1">Ingresos y gastos del mes actual</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-700/30">
                <p className="text-green-400 text-sm">Ingresos</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlyIncome)}</p>
              </div>
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-700/30">
                <p className="text-red-400 text-sm">Gastos</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlyExpenses)}</p>
              </div>
              <div className={`${stats.netBalance >= 0 ? 'bg-emerald-900/30 border-emerald-700/30' : 'bg-red-900/30 border-red-700/30'} p-4 rounded-lg border`}>
                <p className={`${stats.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'} text-sm`}>Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.netBalance)}</p>
              </div>
            </div>

            {/* Gráfico de Tendencia Financiera */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyFinancials}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9ca3af"
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return `${month}/${year.slice(2)}`;
                    }}
                  />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" name="Ingresos" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Gastos" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICOS INFERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tareas por Estado */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Tareas por Estado
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tasksSummary}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {tasksSummary.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-sm">
                  <span className="text-amber-400 font-bold">{stats.pendingTasks}</span> pendientes · 
                  <span className="text-green-400 font-bold ml-1">{stats.completedTasks}</span> completadas
                </p>
              </div>
            </div>

            {/* Comparación Mensual */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Últimos 3 Meses
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFinancials.slice(-3)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9ca3af"
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="Ingresos" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Gastos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Atenciones Recientes */}
        <div className="lg:w-80 bg-gray-800/50 p-5 rounded-xl border border-gray-700/50 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Atenciones Recientes
          </h2>
          <div className="space-y-3 overflow-auto max-h-[calc(100vh-200px)]">
            {recentAttentions.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No hay atenciones registradas</p>
            ) : (
              recentAttentions.map((attention) => (
                <div
                  key={attention.idAttentionHorse}
                  className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/30 hover:border-[#bdab62]/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-[#bdab62]">{attention.horseName}</p>
                    <p className="text-xs text-gray-400">{formatDate(attention.date)}</p>
                  </div>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{attention.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <p className="text-gray-400">{attention.employeeName}</p>
                    <p className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded">
                      {formatCurrency(attention.cost)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;