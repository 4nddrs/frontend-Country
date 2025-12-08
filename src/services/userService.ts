import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

const API_URL = 'http://localhost:8000';

export interface Owner {
  idOwner: number;
  uid: string;
  name?: string;
  FirstName?: string;
  SecondName?: string;
  ownerName?: string;
  ownerPhoto?: string;
  email?: string;
  phone?: string;
  cellPhone?: string;
  ci?: string;
  phoneNumber?: string;
}

export interface Horse {
  idHorse: number;
  horseName: string;
  birthdate?: string;
  sex?: string;
  color?: string;
  generalDescription?: string;
  passportNumber?: number;
  box?: boolean;
  section?: boolean;
  basket?: boolean;
  state?: string;
  race?: { nameRace: string };
  fk_idOwner: number;
  fk_idRace?: number;
  horsePhoto?: string | null;
}

export interface OwnerReport {
  idOwnerReportMonth: number;
  fk_idOwner: number;
  period: string;
  state: string;
  paymentDate?: string;
  priceAlpha: number;
  box: number;
  section: number;
  aBasket: number;
  contributionCabFlyer: number;
  VaccineApplication: number;
  deworming: number;
  AmeniaExam: number;
  externalTeacher: number;
  fine: number;
  saleChala: number;
  costPerBucket: number;
  healthCardPayment: number;
  other: number;
  horses_report?: Array<any>;
  owner?: Owner;
}

// Cache para datos del owner
let ownerCache: { data: Owner; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getOwnerByUid = async (uid: string): Promise<Owner | null> => {
  // Verificar cache
  if (ownerCache && Date.now() - ownerCache.timestamp < CACHE_DURATION) {
    return ownerCache.data;
  }

  try {
    // Intentar con query param
    let ownerRes = await fetch(`${API_URL}/owner/?uid=${uid}`);
    
    if (ownerRes.ok) {
      const result = await ownerRes.json();
      let owner;
      
      if (Array.isArray(result)) {
        owner = result.find((o: any) => o.uid === uid);
      } else {
        owner = result;
      }
      
      if (owner) {
        ownerCache = { data: owner, timestamp: Date.now() };
        return owner;
      }
    }
    
    // Fallback: obtener todos y filtrar
    ownerRes = await fetch(`${API_URL}/owner/`);
    if (!ownerRes.ok) {
      throw new Error('No se pudo obtener datos del propietario');
    }
    
    const allOwners = await ownerRes.json();
    const owner = allOwners.find((o: any) => o.uid === uid);
    
    if (!owner) {
      throw new Error('Propietario no encontrado');
    }
    
    ownerCache = { data: owner, timestamp: Date.now() };
    return owner;
  } catch (error) {
    console.error('Error fetching owner:', error);
    throw error;
  }
};

export const getOwnerHorses = async (ownerId: number): Promise<Horse[]> => {
  const response = await fetch(`${API_URL}/horses/by_owner/${ownerId}`);
  if (!response.ok) throw new Error('Error al obtener caballos');
  return response.json();
};

export const getOwnerReports = async (ownerId: number): Promise<OwnerReport[]> => {
  const response = await fetch(`${API_URL}/owner_report_month/`);
  if (!response.ok) throw new Error('Error al obtener reportes');
  
  const allReports = await response.json();
  return allReports.filter((r: any) => r.fk_idOwner === ownerId);
};

export const getHorseNutritionalPlan = async (horseId: number) => {
  const response = await fetch(`${API_URL}/nutritional_plan_horses/by_horse/${horseId}`);
  if (!response.ok) return null;
  return response.json();
};

export const getTotalControlByOwner = async (ownerId: number) => {
  const response = await fetch(`${API_URL}/total_control/`);
  if (!response.ok) throw new Error('Error al obtener control total');
  
  const allControls = await response.json();
  return allControls.filter((c: any) => c.fk_idOwner === ownerId);
};

export const updateOwner = async (ownerId: number, data: Partial<Owner>): Promise<Owner> => {
  const response = await fetch(`${API_URL}/owner/${ownerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error('Error al actualizar propietario');
  
  // Invalidar cache
  ownerCache = null;
  
  return response.json();
};

// Limpiar cache manualmente si es necesario
export const clearOwnerCache = () => {
  ownerCache = null;
};
