import {
  useMemo,
  useState,
  useCallback,
} from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import { PerfilCaballerizo } from "./PerfilCaballerizo";
import { TareasCaballerizo } from "./TareasCaballerizo";
import { CaballosCaballerizo } from "./CaballosCaballerizo";
import type {
  CaballerizoHorse,
} from "./types";
import {
  useCurrentSession,
  useEmployeeByUid,
  useTaskCategories,
  useEmployeeTasks,
  useEmployeeHorseAssignments,
  useAllHorses,
  useUpdateTaskStatus,
} from "../../hooks/useCaballerizoData";


const DEFAULT_STATUS_OPTIONS = [
  "Pendiente",
  "En progreso",
  "Completada",
  "Cancelada",
];

const normalizeStatus = (status?: string | null): string => {
  const value = (status ?? "").trim().toLowerCase();
  if (value.includes("cancel")) return "Cancelada";
  if (value.includes("complet")) return "Completada";
  if (value.includes("progreso") || value.includes("proceso")) return "En progreso";
  return "Pendiente";
};

const buildCategoriesMap = (
  categories: { idTaskCategory: number; categoryName: string }[],
): Record<number, string> => {
  return categories.reduce<Record<number, string>>((acc, category) => {
    acc[category.idTaskCategory] = category.categoryName;
    return acc;
  }, {});
};

const buildHorseMap = (
  horses: CaballerizoHorse[],
): Record<number, CaballerizoHorse> => {
  return horses.reduce<Record<number, CaballerizoHorse>>((acc, horse) => {
    acc[horse.idHorse] = horse;
    return acc;
  }, {});
};

const CaballerizoDashboard = () => {
  const navigate = useNavigate();

  // React Query hooks
  const { data: session } = useCurrentSession();
  const userId = session?.user?.id;
  
  const { data: employee, isLoading: loadingEmployee, error: employeeError } = useEmployeeByUid(userId);
  const { data: categories = [], isLoading: loadingCategories } = useTaskCategories();
  const { data: tasks = [], isLoading: loadingTasks } = useEmployeeTasks(employee?.idEmployee);
  const { data: assignments = [], isLoading: loadingAssignments } = useEmployeeHorseAssignments(employee?.idEmployee);
  const { data: horses = [], isLoading: loadingHorses } = useAllHorses();

  // Mutations
  const updateTaskStatus = useUpdateTaskStatus();

  // Local UI state
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Derived data
  const categoryMap = useMemo(() => buildCategoriesMap(categories), [categories]);
  const horsesById = useMemo(() => buildHorseMap(horses), [horses]);

  // Combined loading and error states
  const loading = loadingEmployee || loadingCategories || loadingTasks || loadingAssignments || loadingHorses;
  const error = employeeError ? (employeeError as Error).message : null;

  const statusOptions = useMemo(() => {
    const unique = new Set(DEFAULT_STATUS_OPTIONS);
    tasks.forEach((task) => {
      if (task.taskStatus) {
        unique.add(normalizeStatus(task.taskStatus));
      }
    });
    return Array.from(unique);
  }, [tasks]);

  const handleTaskStatusUpdate = useCallback(
    async (taskId: number, newStatus: string) => {
      const targetTask = tasks.find((task) => task.idTask === taskId);
      if (!targetTask) return;

      setUpdatingTaskId(taskId);

      try {
        await updateTaskStatus.mutateAsync({
          taskId,
          taskData: {
            ...targetTask,
            taskStatus: newStatus,
          },
        });
        toast.success("Estado de la tarea actualizado.");
      } catch (err) {
        console.error("Error actualizando tarea:", err);
        toast.error("No se pudo actualizar el estado de la tarea.");
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [tasks, updateTaskStatus],
  );

  const handleNavigateToTasks = () => navigate("/caballerizo/tareas");
  const handleNavigateToHorses = () => navigate("/caballerizo/caballos");

  const handleRetry = () => {
    // React Query refetch is handled automatically
    window.location.reload();
  };

  return (
    <div className="app-shell bg-black text-white font-sans flex h-screen overflow-hidden text-base leading-normal">
      <Sidebar userRole={9} />
      <div className="app-content flex-1 min-h-screen p-4 lg:p-8 overflow-y-auto lg:ml-80">
        <Routes>
          <Route
            path="/caballerizo"
            element={<Navigate to="/caballerizo/perfil" replace />}
          />
          <Route
            path="/caballerizo/perfil"
            element={
              <PerfilCaballerizo
                employee={employee || null}
                loading={loading}
                error={error}
                onRetry={handleRetry}
                onNavigateToTasks={handleNavigateToTasks}
                onNavigateToHorses={handleNavigateToHorses}
              />
            }
          />
          <Route
            path="/caballerizo/tareas"
            element={
              <TareasCaballerizo
                tasks={tasks}
                loading={loading}
                error={error}
                categoryMap={categoryMap}
                statusOptions={statusOptions}
                onRetry={handleRetry}
                onUpdateStatus={handleTaskStatusUpdate}
                updatingTaskId={updatingTaskId}
              />
            }
          />
          <Route
            path="/caballerizo/caballos"
            element={
              <CaballosCaballerizo
                assignments={assignments}
                horsesById={horsesById}
                loading={loading}
                error={error}
                onRetry={handleRetry}
              />
            }
          />
          <Route
            path="*"
            element={<Navigate to="/caballerizo/perfil" replace />}
          />
        </Routes>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default CaballerizoDashboard;



