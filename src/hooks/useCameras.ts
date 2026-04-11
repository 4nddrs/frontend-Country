import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCameras,
  createCamera,
  updateCamera,
  deleteCamera,
} from '../services/cameraService';
import type { CameraCreate, CameraUpdate } from '../services/cameraService';

export const useCameras = () =>
  useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

export const useCreateCamera = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CameraCreate) => createCamera(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cameras'] }),
  });
};

export const useUpdateCamera = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CameraUpdate }) =>
      updateCamera(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cameras'] }),
  });
};

export const useDeleteCamera = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCamera(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cameras'] }),
  });
};
