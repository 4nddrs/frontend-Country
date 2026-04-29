import { useQuery } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { 
  getCurrentUser, 
  getOwnerByUid, 
  getOwnerHorses, 
  getOwnerReports,
  getTotalControlByOwner,
  type Owner,
  type Horse,
  type OwnerReport
} from '../services/userService';

interface ErpUser {
  uid: string;
  username: string;
  email: string;
  isapproved: boolean;
  fk_idUserRole: number;
}

export const useCurrentUser = () => {
  return useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (antes cacheTime)
  });
};

export const useErpUser = (uid?: string) => {
  return useQuery<ErpUser | null>({
    queryKey: ['erpUser', uid],
    queryFn: async () => {
      if (!uid) return null;
      const response = await fetch(`https://api.countryclub.doc-ia.cloud/erp_users/${uid}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!uid,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
};

export const useOwnerData = (uid?: string) => {
  return useQuery<Owner | null>({
    queryKey: ['owner', uid],
    queryFn: () => getOwnerByUid(uid!),
    enabled: !!uid,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });
};

export const useOwnerHorses = (ownerId?: number) => {
  return useQuery<Horse[]>({
    queryKey: ['ownerHorses', ownerId],
    queryFn: () => getOwnerHorses(ownerId!),
    enabled: !!ownerId,
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useOwnerReports = (ownerId?: number) => {
  return useQuery<OwnerReport[]>({
    queryKey: ['ownerReports', ownerId],
    queryFn: () => getOwnerReports(ownerId!),
    enabled: !!ownerId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useTotalControl = (ownerId?: number) => {
  return useQuery({
    queryKey: ['totalControl', ownerId],
    queryFn: () => getTotalControlByOwner(ownerId!),
    enabled: !!ownerId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
