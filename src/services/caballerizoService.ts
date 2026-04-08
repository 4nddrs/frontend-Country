// src/services/caballerizoService.ts
import { supabase } from '../supabaseClient';
import type {
  CaballerizoEmployee,
  CaballerizoTask,
  CaballerizoTaskCategory,
  CaballerizoHorse,
  CaballerizoHorseAssignment,
} from '../pages/caballerizo/types';

const API_URL = "http://localhost:8000";

// ==================== HELPERS ====================

const matchesEmployeeByUid = (employee: CaballerizoEmployee, uid: string): boolean => {
  const record = employee as Record<string, unknown>;
  const extractString = (value: unknown): string | undefined =>
    typeof value === "string" && value.length > 0 ? value : undefined;

  const possibleValues = [
    extractString(employee.uid),
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

const normalizeStatus = (status?: string | null): string => {
  const value = (status ?? "").trim().toLowerCase();
  if (value.includes("cancel")) return "Cancelada";
  if (value.includes("complet")) return "Completada";
  if (value.includes("progreso") || value.includes("proceso")) return "En progreso";
  return "Pendiente";
};

// ==================== API CALLS ====================

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const getEmployeeByUid = async (uid: string): Promise<CaballerizoEmployee> => {
  const response = await fetch(`${API_URL}/employees/`);
  if (!response.ok) throw new Error("No se pudo obtener la información del empleado");

  const employees: any[] = await response.json();
  const employee = employees.find((emp) => matchesEmployeeByUid(emp, uid));

  if (!employee) {
    throw new Error("No se encontró un registro de empleado asociado a esta cuenta");
  }

  // Mapear image_url → employeePhoto
  return {
    ...employee,
    employeePhoto: employee.image_url || employee.employeePhoto || null,
  };
};

export const getTaskCategories = async (): Promise<CaballerizoTaskCategory[]> => {
  const response = await fetch(`${API_URL}/task-categories/`);
  if (!response.ok) throw new Error("No se pudieron cargar las categorías de tareas");
  return response.json();
};

export const getEmployeeTasks = async (employeeId: number): Promise<CaballerizoTask[]> => {
  const response = await fetch(`${API_URL}/tasks/`);
  if (!response.ok) throw new Error("No se pudieron cargar las tareas asignadas");
  
  const allTasks: CaballerizoTask[] = await response.json();
  return allTasks
    .filter((task) => task.fk_idEmployee === employeeId)
    .map((task) => ({
      ...task,
      taskStatus: normalizeStatus(task.taskStatus),
    }));
};

export const getEmployeeHorseAssignments = async (employeeId: number): Promise<CaballerizoHorseAssignment[]> => {
  const response = await fetch(`${API_URL}/horse_assignments/`);
  if (!response.ok) throw new Error("No se pudieron cargar las asignaciones de caballos");
  
  const allAssignments: CaballerizoHorseAssignment[] = await response.json();
  return allAssignments.filter((assignment) => assignment.fk_idEmployee === employeeId);
};

export const getAllHorses = async (): Promise<CaballerizoHorse[]> => {
  const response = await fetch(`${API_URL}/horses/`);
  if (!response.ok) throw new Error("No se pudo cargar la información de caballos");
  return response.json();
};

export const updateTaskStatus = async (taskId: number, taskData: CaballerizoTask): Promise<CaballerizoTask> => {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });
  
  if (!response.ok) throw new Error("No se pudo actualizar el estado de la tarea");
  return response.json();
};

export const updateEmployeePhoto = async (employeeId: number, photoData: string): Promise<CaballerizoEmployee> => {
  const response = await fetch(`${API_URL}/employees/${employeeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeePhoto: photoData }),
  });
  
  if (!response.ok) throw new Error("No se pudo actualizar la foto");
  return response.json();
};
