export interface CaballerizoEmployee {
  idEmployee: number;
  fullName: string;
  ci?: number | string | null;
  phoneNumber?: number | string | null;
  startContractDate?: string | null;
  endContractDate?: string | null;
  employeePhoto?: string | null;
  fk_idAuthUser?: string | null;
  status?: boolean | null;
  [key: string]: unknown;
}

export interface CaballerizoTask {
  idTask: number;
  taskName: string;
  description?: string | null;
  assignmentDate?: string | null;
  completionDate?: string | null;
  taskStatus?: string | null;
  fk_idTaskCategory?: number | null;
  fk_idEmployee?: number | null;
  [key: string]: unknown;
}

export interface CaballerizoTaskCategory {
  idTaskCategory: number;
  categoryName: string;
  [key: string]: unknown;
}

export interface CaballerizoHorse {
  idHorse: number;
  horseName: string;
  state?: string | null;
  [key: string]: unknown;
}

export interface CaballerizoHorseAssignment {
  idHorseAssignments: number;
  assignmentDate?: string | null;
  endDate?: string | null;
  fk_idEmployee: number;
  fk_idHorse: number;
  horse?: CaballerizoHorse | null;
  [key: string]: unknown;
}
