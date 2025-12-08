// Dashboard Service - Servicio para obtener estadísticas y datos del dashboard

const API_BASE = 'http://localhost:8000';

// Timeout para las peticiones (60 segundos para base de datos grandes)
const FETCH_TIMEOUT = 60000;
const MAX_RETRIES = 2;

// Helper function para fetch con timeout y reintentos
const fetchWithTimeout = async (url: string, timeout = FETCH_TIMEOUT, retries = MAX_RETRIES): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Reintentar en caso de timeout o error de red
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('ERR_'))) {
      console.log(`⚠️ Reintentando petición a ${url}... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      return fetchWithTimeout(url, timeout, retries - 1);
    }
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - El servidor tardó demasiado en responder');
    }
    throw error;
  }
};

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
    console.log('📊 Cargando estadísticas del dashboard...');
    
    // Cargar datos básicos secuencialmente para reducir carga en el servidor
    console.log('  → Cargando caballos...');
    const horsesRes = await fetchWithTimeout(`${API_BASE}/horses/`);
    const horses = await horsesRes.json();
    console.log(`  ✓ ${horses.length} caballos cargados`);
    
    console.log('  → Cargando empleados...');
    const employeesRes = await fetchWithTimeout(`${API_BASE}/employees/`);
    const employees = await employeesRes.json();
    console.log(`  ✓ ${employees.length} empleados cargados`);
    
    console.log('  → Cargando propietarios...');
    const ownersRes = await fetchWithTimeout(`${API_BASE}/owner/`);
    const owners = await ownersRes.json();
    console.log(`  ✓ ${owners.length} propietarios cargados`);
    
    console.log('  → Cargando tareas...');
    const tasksRes = await fetchWithTimeout(`${API_BASE}/tasks/`);
    const tasks = await tasksRes.json();
    console.log(`  ✓ ${tasks.length} tareas cargadas`);
    
    console.log('  → Cargando ingresos...');
    const incomeRes = await fetchWithTimeout(`${API_BASE}/income/`);
    const incomes = await incomeRes.json();
    console.log(`  ✓ ${incomes.length} ingresos cargados`);
    
    console.log('  → Cargando gastos...');
    const expensesRes = await fetchWithTimeout(`${API_BASE}/expenses/`);
    const expenses = await expensesRes.json();
    console.log(`  ✓ ${expenses.length} gastos cargados`);

    console.log('📈 Procesando estadísticas...');

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
    
    // Debug: Ver estructura de ingresos y gastos
    if (incomes.length > 0) {
      console.log('📊 Muestra de ingreso:', incomes[0]);
      console.log('📊 TODOS los campos del ingreso:', Object.keys(incomes[0]));
    }
    if (expenses.length > 0) {
      console.log('📊 Muestra de gasto:', expenses[0]);
      console.log('📊 TODOS los campos del gasto:', Object.keys(expenses[0]));
    }
    
    const monthlyIncome = incomes
      .filter((i: any) => i.date?.slice(0, 7) === currentMonth)
      .reduce((sum: number, i: any) => {
        // Intentar diferentes nombres de campos
        const amount = Number(i.amountBsCaptureType || i.AmountBsCaptureType || i.amount || i.Amount || i.totalAmount || 0);
        return sum + amount;
      }, 0);

    const monthlyExpenses = expenses
      .filter((e: any) => e.date?.slice(0, 7) === currentMonth)
      .reduce((sum: number, e: any) => {
        // Intentar diferentes nombres de campos
        const amount = Number(e.AmountBsCaptureType || e.amountBsCaptureType || e.amount || e.Amount || e.totalAmount || 0);
        return sum + amount;
      }, 0);

    console.log(`💰 Mes actual: ${currentMonth}`);
    console.log(`💰 Ingresos del mes: ${monthlyIncome}`);
    console.log(`💰 Gastos del mes: ${monthlyExpenses}`);

    const netBalance = monthlyIncome - monthlyExpenses;

    console.log('✅ Estadísticas calculadas correctamente');

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
  } catch (error: any) {
    console.error('❌ Error fetching dashboard stats:', error);
    console.error('Error detallado:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Error al cargar estadísticas: ${error.message}`);
  }
};

// Obtener atenciones recientes de caballos
export const getRecentAttentions = async (limit: number = 10): Promise<RecentAttention[]> => {
  try {
    console.log('📋 Cargando atenciones recientes...');
    
    // Cargar secuencialmente para reducir carga
    console.log('  → Cargando atenciones...');
    const attentionsRes = await fetchWithTimeout(`${API_BASE}/attention_horses/`);
    const attentions = await attentionsRes.json();
    console.log(`  ✓ ${attentions.length} atenciones cargadas`);
    
    console.log('  → Cargando caballos...');
    const horsesRes = await fetchWithTimeout(`${API_BASE}/horses/`);
    const horses = await horsesRes.json();
    console.log(`  ✓ ${horses.length} caballos cargados`);
    
    console.log('  → Cargando empleados...');
    const employeesRes = await fetchWithTimeout(`${API_BASE}/employees/`);
    const employees = await employeesRes.json();
    console.log(`  ✓ ${employees.length} empleados cargados`);

    console.log(`📋 Procesando atenciones...`);

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

    console.log(`✅ ${recentAttentions.length} atenciones recientes cargadas`);
    return recentAttentions;
  } catch (error: any) {
    console.error('❌ Error fetching recent attentions:', error);
    throw new Error(`Error al cargar atenciones: ${error.message}`);
  }
};

// Obtener datos financieros por mes (últimos 6 meses)
export const getMonthlyFinancials = async (): Promise<MonthlyFinancial[]> => {
  try {
    console.log('💰 Cargando datos financieros...');
    
    // Cargar secuencialmente
    console.log('  → Cargando ingresos...');
    const incomeRes = await fetchWithTimeout(`${API_BASE}/income/`);
    const incomes = await incomeRes.json();
    console.log(`  ✓ ${incomes.length} ingresos cargados`);
    
    console.log('  → Cargando gastos...');
    const expensesRes = await fetchWithTimeout(`${API_BASE}/expenses/`);
    const expenses = await expensesRes.json();
    console.log(`  ✓ ${expenses.length} gastos cargados`);

    console.log(`💰 Procesando datos financieros...`);

    // Obtener los últimos 6 meses
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push(yearMonth);
    }
    
    console.log('📅 Meses a procesar:', months);

    const monthlyData = months.map(month => {
      const monthIncome = incomes
        .filter((i: any) => i.date?.slice(0, 7) === month)
        .reduce((sum: number, i: any) => {
          const amount = Number(i.amountBsCaptureType || i.AmountBsCaptureType || i.amount || i.Amount || i.totalAmount || 0);
          return sum + amount;
        }, 0);

      const monthExpenses = expenses
        .filter((e: any) => e.date?.slice(0, 7) === month)
        .reduce((sum: number, e: any) => {
          const amount = Number(e.AmountBsCaptureType || e.amountBsCaptureType || e.amount || e.Amount || e.totalAmount || 0);
          return sum + amount;
        }, 0);

      return {
        month,
        income: monthIncome,
        expenses: monthExpenses
      };
    });

    console.log('💰 Resumen financiero por mes:', monthlyData);

    console.log(`✅ Datos financieros de ${monthlyData.length} meses calculados`);
    return monthlyData;
  } catch (error: any) {
    console.error('❌ Error fetching monthly financials:', error);
    throw new Error(`Error al cargar finanzas: ${error.message}`);
  }
};

// Obtener resumen de tareas por estado
export const getTasksSummary = async (): Promise<TaskSummary[]> => {
  try {
    console.log('📝 Cargando resumen de tareas...');
    
    const res = await fetchWithTimeout(`${API_BASE}/tasks/`);
    const tasks = await res.json();

    console.log(`📝 Procesando ${tasks.length} tareas...`);

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

    console.log(`✅ Resumen de tareas calculado: ${summary.length} estados`);
    return summary;
  } catch (error: any) {
    console.error('❌ Error fetching tasks summary:', error);
    throw new Error(`Error al cargar resumen de tareas: ${error.message}`);
  }
};
