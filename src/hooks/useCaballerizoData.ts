// src/hooks/useCaballerizoData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import type {
  CaballerizoEmployee,
  CaballerizoTask,
  CaballerizoTaskCategory,
  CaballerizoHorse,
  CaballerizoHorseAssignment,
} from '../pages/caballerizo/types';
import * as caballerizoService from '../services/caballerizoService';

// ==================== QUERY KEYS ====================

export const caballerizoKeys = {
  all: ['caballerizo'] as const,
  session: () => [...caballerizoKeys.all, 'session'] as const,
  employee: (uid: string | undefined) => [...caballerizoKeys.all, 'employee', uid] as const,
  tasks: (employeeId: number | undefined) => [...caballerizoKeys.all, 'tasks', employeeId] as const,
  categories: () => [...caballerizoKeys.all, 'categories'] as const,
  assignments: (employeeId: number | undefined) => [...caballerizoKeys.all, 'assignments', employeeId] as const,
  horses: () => [...caballerizoKeys.all, 'horses'] as const,
};

// ==================== HOOKS ====================

export const useCurrentSession = () => {
  return useQuery<Session | null>({
    queryKey: caballerizoKeys.session(),
    queryFn: caballerizoService.getCurrentSession,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useEmployeeByUid = (uid: string | undefined) => {
  return useQuery<CaballerizoEmployee>({
    queryKey: caballerizoKeys.employee(uid),
    queryFn: () => caballerizoService.getEmployeeByUid(uid!),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos del empleado cambian poco
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useTaskCategories = () => {
  return useQuery<CaballerizoTaskCategory[]>({
    queryKey: caballerizoKeys.categories(),
    queryFn: caballerizoService.getTaskCategories,
    staleTime: 10 * 60 * 1000, // 10 minutos - categorías son datos estáticos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
};

export const useEmployeeTasks = (employeeId: number | undefined) => {
  return useQuery<CaballerizoTask[]>({
    queryKey: caballerizoKeys.tasks(employeeId),
    queryFn: () => caballerizoService.getEmployeeTasks(employeeId!),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000, // 2 minutos - tareas cambian con frecuencia
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useEmployeeHorseAssignments = (employeeId: number | undefined) => {
  return useQuery<CaballerizoHorseAssignment[]>({
    queryKey: caballerizoKeys.assignments(employeeId),
    queryFn: () => caballerizoService.getEmployeeHorseAssignments(employeeId!),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutos - asignaciones cambian ocasionalmente
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useAllHorses = () => {
  return useQuery<CaballerizoHorse[]>({
    queryKey: caballerizoKeys.horses(),
    queryFn: caballerizoService.getAllHorses,
    staleTime: 5 * 60 * 1000, // 5 minutos - lista de caballos relativamente estática
    gcTime: 15 * 60 * 1000, // 15 minutos
  });
};

// ==================== MUTATIONS ====================

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, taskData }: { taskId: number; taskData: CaballerizoTask }) =>
      caballerizoService.updateTaskStatus(taskId, taskData),
    onSuccess: (_, variables) => {
      // Invalidar las tareas del empleado para refrescar
      const employeeId = variables.taskData.fk_idEmployee;
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: caballerizoKeys.tasks(employeeId) });
      }
    },
  });
};

export const useUpdateEmployeePhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ employeeId, photoData }: { employeeId: number; photoData: string }) =>
      caballerizoService.updateEmployeePhoto(employeeId, photoData),
    onSuccess: (updatedEmployee) => {
      // Invalidar el empleado para refrescar la foto
      if (updatedEmployee.uid) {
        queryClient.invalidateQueries({ queryKey: caballerizoKeys.employee(updatedEmployee.uid) });
      }
    },
  });
};
