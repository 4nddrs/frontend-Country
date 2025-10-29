// Dashboard Service - Servicio para obtener estadísticas y datos del dashboard

const API_BASE = 'https://backend-country-nnxe.onrender.com';

// Interfaces
interface DashboardStats {
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

interface RecentAttention {
  idAttentionHorse: number;
  date: string;
  description: string;
  cost: number;
  horseName: string;
  employeeName: string;
}

interface MonthlyFinancial {
  month: string;
  income: number;
  expenses: number;
}

interface TaskSummary {
  status: string;
  count: number;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

// Obtener estadísticas principales del dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Obtener todos los datos en paralelo
    const [horsesRes, employeesRes, ownersRes, tasksRes, incomeRes, expensesRes] = await Promise.all([
      fetch(`${API_BASE}/horses/`),
      fetch(`${API_BASE}/employees/`),
      fetch(`${API_BASE}/owner/`),
      fetch(`${API_BASE}/tasks/`),
      fetch(`${API_BASE}/income/`),
      fetch(`${API_BASE}/expenses/`)
    ]);

    const horses = await horsesRes.json();
    const employees = await employeesRes.json();
    const owners = await ownersRes.json();
    const tasks = await tasksRes.json();
    const incomes = await incomeRes.json();
    const expenses = await expensesRes.json();

    // Calcular estadísticas de caballos
    const totalHorses = horses.length;
    const activeHorses = horses.filter((h: any) => h.state === 'Activo').length;
    const schoolHorses = horses.filter((h: any) => h.stateSchool === true).length;

    // Calcular estadísticas de empleados
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e: any) => e.status === true).length;

    // Calcular estadísticas de tareas
    const pendingTasks = tasks.filter((t: any) => 
      t.taskStatus === 'Pendiente' || t.taskStatus === 'En Proceso'
    ).length;
    const completedTasks = tasks.filter((t: any) => t.taskStatus === 'Completada').length;

    // Calcular finanzas del mes actual
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const monthlyIncome = incomes
      .filter((i: any) => i.date?.slice(0, 7) === currentMonth)
      .reduce((sum: number, i: any) => sum + (Number(i.amountBsCaptureType) || 0), 0);

    const monthlyExpenses = expenses
      .filter((e: any) => e.date?.slice(0, 7) === currentMonth)
      .reduce((sum: number, e: any) => sum + (Number(e.AmountBsCaptureType) || 0), 0);

    const netBalance = monthlyIncome - monthlyExpenses;

    return {
      totalHorses,
      activeHorses,
      schoolHorses,
      totalEmployees,
      activeEmployees,
      totalOwners: owners.length,
      pendingTasks,
      completedTasks,
      monthlyIncome,
      monthlyExpenses,
      netBalance
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Obtener atenciones recientes de caballos
export const getRecentAttentions = async (limit: number = 10): Promise<RecentAttention[]> => {
  try {
    const [attentionsRes, horsesRes, employeesRes] = await Promise.all([
      fetch(`${API_BASE}/attention_horses/`),
      fetch(`${API_BASE}/horses/`),
      fetch(`${API_BASE}/employees/`)
    ]);

    const attentions = await attentionsRes.json();
    const horses = await horsesRes.json();
    const employees = await employeesRes.json();

    // Crear mapas para búsqueda rápida
    const horseMap = new Map(horses.map((h: any) => [h.idHorse, h.horseName]));
    const employeeMap = new Map(employees.map((e: any) => [e.idEmployee, e.fullName]));

    // Ordenar por fecha más reciente y tomar los últimos N
    const recentAttentions = attentions
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map((att: any) => ({
        idAttentionHorse: att.idAttentionHorse,
        date: att.date,
        description: att.description,
        cost: Number(att.cost) || 0,
        horseName: horseMap.get(att.fk_idHorse) || 'Desconocido',
        employeeName: employeeMap.get(att.fk_idEmployee) || 'Desconocido'
      }));

    return recentAttentions;
  } catch (error) {
    console.error('Error fetching recent attentions:', error);
    throw error;
  }
};

// Obtener datos financieros por mes (últimos 6 meses)
export const getMonthlyFinancials = async (): Promise<MonthlyFinancial[]> => {
  try {
    const [incomeRes, expensesRes] = await Promise.all([
      fetch(`${API_BASE}/income/`),
      fetch(`${API_BASE}/expenses/`)
    ]);

    const incomes = await incomeRes.json();
    const expenses = await expensesRes.json();

    // Obtener los últimos 6 meses
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7)); // YYYY-MM
    }

    const monthlyData = months.map(month => {
      const monthIncome = incomes
        .filter((i: any) => i.date?.slice(0, 7) === month)
        .reduce((sum: number, i: any) => sum + (Number(i.amountBsCaptureType) || 0), 0);

      const monthExpenses = expenses
        .filter((e: any) => e.date?.slice(0, 7) === month)
        .reduce((sum: number, e: any) => sum + (Number(e.AmountBsCaptureType) || 0), 0);

      return {
        month,
        income: monthIncome,
        expenses: monthExpenses
      };
    });

    return monthlyData;
  } catch (error) {
    console.error('Error fetching monthly financials:', error);
    throw error;
  }
};

// Obtener resumen de tareas por estado
export const getTasksSummary = async (): Promise<TaskSummary[]> => {
  try {
    const res = await fetch(`${API_BASE}/tasks/`);
    const tasks = await res.json();

    // Agrupar por estado
    const statusCounts: { [key: string]: number } = {};
    tasks.forEach((task: any) => {
      const status = task.taskStatus || 'Sin Estado';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Convertir a array para gráficos
    const summary: TaskSummary[] = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    return summary;
  } catch (error) {
    console.error('Error fetching tasks summary:', error);
    throw error;
  }
};
