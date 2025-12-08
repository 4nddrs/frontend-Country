import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  totalHorses: number;
  activeHorses: number;
  schoolHorses: number;
  totalEmployees: number;
  activeEmployees: number;
  totalOwners: number;
  pendingTasks: number;
  completedTasks: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
}

export interface RecentAttention {
  idAttentionHorse: number;
  date: string;
  description: string;
  cost: number;
  horseName: string;
  employeeName: string;
}

export interface MonthlyFinancial {
  month: string;
  income: number;
  expenses: number;
}

export interface DailyFinancial {
  date: string;
  income: number;
  expenses: number;
}

export interface TaskSummary {
  status: string;
  count: number;
  [key: string]: string | number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentAttentions: RecentAttention[];
  monthlyFinancials: MonthlyFinancial[];
  tasksSummary: TaskSummary[];
  dailyFinancials?: DailyFinancial[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const fetchDashboard = async (): Promise<DashboardResponse> => {
  const response = await fetch(`${API_BASE}/dashboard`);

  if (!response.ok) {
    throw new Error('Error al cargar el dashboard');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Respuesta no válida del servidor: ${text.slice(0, 120)}`);
  }

  return response.json();
};

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 30000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

export default useDashboard;
