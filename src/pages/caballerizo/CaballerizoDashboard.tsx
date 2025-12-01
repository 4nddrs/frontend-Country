import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../supabaseClient";
import { PerfilCaballerizo } from "./PerfilCaballerizo";
import { TareasCaballerizo } from "./TareasCaballerizo";
import { CaballosCaballerizo } from "./CaballosCaballerizo";
import type {
  CaballerizoEmployee,
  CaballerizoHorse,
  CaballerizoHorseAssignment,
  CaballerizoTask,
  CaballerizoTaskCategory,
} from "./types";
import { encodeImageForBackend } from "../../utils/imageHelpers";

const API_URL = "http://82.25.66.67:8000";
const TASKS_URL = `${API_URL}/tasks/`;
const CATEGORIES_URL = `${API_URL}/task-categories/`;
const EMPLOYEES_URL = `${API_URL}/employees/`;
const HORSES_URL = `${API_URL}/horses/`;
const HORSE_ASSIGNMENTS_URL = `${API_URL}/horse_assignments/`;

const DEFAULT_STATUS_OPTIONS = [
  "PENDIENTE",
  "EN PROGRESO",
  "COMPLETADA",
  "CANCELADA",
];

const matchesEmployeeByUid = (employee: CaballerizoEmployee, uid: string) => {
  const record = employee as Record<string, unknown>;

  const extractString = (value: unknown): string | undefined =>
    typeof value === "string" && value.length > 0 ? value : undefined;

  const possibleValues = [
    extractString(employee.fk_idAuthUser),
    extractString(record.uid),
    extractString(record.authUid),
    extractString(record.auth_uid),
    extractString(record.auth_uuid),
    extractString(record.supabase_uid),
    extractString((record.erp_user as Record<string, unknown> | undefined)?.uid),
    extractString((record.erpUser as Record<string, unknown> | undefined)?.uid),
  ].filter(Boolean) as string[];

  return possibleValues.some((value) => value === uid);
};

const buildCategoriesMap = (
  categories: CaballerizoTaskCategory[],
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

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error ?? new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });

const CaballerizoDashboard = () => {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<CaballerizoEmployee | null>(null);
  const [tasks, setTasks] = useState<CaballerizoTask[]>([]);
  const [assignments, setAssignments] = useState<CaballerizoHorseAssignment[]>(
    [],
  );
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [horsesById, setHorsesById] = useState<Record<number, CaballerizoHorse>>(
    {},
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [updatingPhoto, setUpdatingPhoto] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const userId = sessionData.session?.user?.id;

      if (!userId) {
        throw new Error("No se encontro una sesion activa.");
      }

      const employeesResponse = await fetch(EMPLOYEES_URL);
      if (!employeesResponse.ok) {
        throw new Error("No se pudo obtener la informacion del empleado.");
      }

      const employeesData: CaballerizoEmployee[] = await employeesResponse.json();

      const metadata = (sessionData.session?.user?.user_metadata ??
        {}) as Record<string, unknown>;
      const metadataEmployeeId =
        typeof metadata.idEmployee === "number" ? metadata.idEmployee : undefined;

      const foundEmployee =
        employeesData.find((emp) => matchesEmployeeByUid(emp, userId)) ||
        (metadataEmployeeId
          ? employeesData.find((emp) => emp.idEmployee === metadataEmployeeId)
          : undefined);

      if (!foundEmployee) {
        throw new Error(
          "No se encontro un registro de empleado asociado a esta cuenta.",
        );
      }

      setEmployee(foundEmployee);

      const [
        categoriesResponse,
        tasksResponse,
        assignmentsResponse,
        horsesResponse,
      ] = await Promise.all([
        fetch(CATEGORIES_URL),
        fetch(TASKS_URL),
        fetch(HORSE_ASSIGNMENTS_URL),
        fetch(HORSES_URL),
      ]);

      if (!categoriesResponse.ok) {
        throw new Error("No se pudieron cargar las categorias de tareas.");
      }
      if (!tasksResponse.ok) {
        throw new Error("No se pudieron cargar las tareas asignadas.");
      }
      if (!assignmentsResponse.ok) {
        throw new Error("No se pudieron cargar las asignaciones de caballos.");
      }
      if (!horsesResponse.ok) {
        throw new Error("No se pudieron cargar la informacion de caballos.");
      }

      const categoriesData: CaballerizoTaskCategory[] =
        await categoriesResponse.json();
      const tasksData: CaballerizoTask[] = await tasksResponse.json();
      const assignmentsData: CaballerizoHorseAssignment[] =
        await assignmentsResponse.json();
      const horsesData: CaballerizoHorse[] = await horsesResponse.json();

      setCategoryMap(buildCategoriesMap(categoriesData));
      setTasks(
        tasksData.filter(
          (task) => task.fk_idEmployee === foundEmployee.idEmployee,
        ),
      );
      setAssignments(
        assignmentsData.filter(
          (assignment) => assignment.fk_idEmployee === foundEmployee.idEmployee,
        ),
      );
      setHorsesById(buildHorseMap(horsesData));
    } catch (err) {
      console.error("Error cargando informacion del caballerizo:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrio un error al cargar la informacion.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusOptions = useMemo(() => {
    const unique = new Set(DEFAULT_STATUS_OPTIONS);

    tasks.forEach((task) => {
      if (task.taskStatus) {
        unique.add(task.taskStatus.toUpperCase());
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
        const payload = {
          ...targetTask,
          taskStatus: newStatus,
        };

        const response = await fetch(`${TASKS_URL}${taskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("No se pudo actualizar el estado de la tarea.");
        }

        setTasks((prev) =>
          prev.map((task) =>
            task.idTask === taskId ? { ...task, taskStatus: newStatus } : task,
          ),
        );
        toast.success("Estado de la tarea actualizado.");
      } catch (err) {
        console.error("Error actualizando tarea:", err);
        toast.error("No se pudo actualizar el estado de la tarea.");
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [tasks],
  );

  const handleNavigateToTasks = () => navigate("/caballerizo/tareas");
  const handleNavigateToHorses = () => navigate("/caballerizo/caballos");

  const handleProfilePhotoUpdate = useCallback(
    async (file: File) => {
      if (!employee?.idEmployee) {
        toast.error("No se encontro el perfil del caballerizo.");
        return;
      }

      setUpdatingPhoto(true);

      try {
        const dataUrl = await fileToDataUrl(file);
        const encodedPhoto = encodeImageForBackend(dataUrl);

        const payload = {
          ...employee,
          employeePhoto: encodedPhoto,
        };

        const response = await fetch(`${EMPLOYEES_URL}${employee.idEmployee}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("No se pudo actualizar la foto de perfil.");
        }

        setEmployee((prev) =>
          prev ? { ...prev, employeePhoto: dataUrl } : prev,
        );
        toast.success("Foto de perfil actualizada.");
      } catch (err) {
        console.error("Error actualizando foto de perfil:", err);
        toast.error(
          "No se pudo actualizar la foto. Intenta con otra imagen o más tarde.",
        );
      } finally {
        setUpdatingPhoto(false);
      }
    },
    [employee],
  );

  return (
    <div className="bg-black text-white font-sans flex h-screen overflow-hidden text-base leading-normal">
      <Sidebar userRole={9} />
      <div className="flex-1 min-h-screen p-4 lg:p-8 overflow-y-auto lg:ml-80">
        <Routes>
          <Route
            path="/caballerizo"
            element={<Navigate to="/caballerizo/perfil" replace />}
          />
          <Route
            path="/caballerizo/perfil"
            element={
              <PerfilCaballerizo
                employee={employee}
                loading={loading}
                error={error}
                onRetry={loadData}
                onNavigateToTasks={handleNavigateToTasks}
                onNavigateToHorses={handleNavigateToHorses}
                onUpdatePhoto={handleProfilePhotoUpdate}
                updatingPhoto={updatingPhoto}
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
                onRetry={loadData}
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
                onRetry={loadData}
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
