const API_BASE = 'http://localhost:8000';

export interface Camera {
  idCamera: number;
  name: string;
  ip: string;
  rtsp_port: number;
  stream_path: string;
  rtsp_user: string;
  is_active: boolean;
  fk_idOwner: number;
  created_at?: string;
}

export interface CameraCreate {
  name: string;
  ip: string;
  rtsp_port: number;
  stream_path: string;
  rtsp_user: string;
  rtsp_password: string;
  is_active: boolean;
  fk_idOwner: number;
}

export interface CameraUpdate {
  name?: string;
  ip?: string;
  rtsp_port?: number;
  stream_path?: string;
  rtsp_user?: string;
  rtsp_password?: string;
  is_active?: boolean;
  fk_idOwner?: number;
}

export const getCameras = async (): Promise<Camera[]> => {
  const res = await fetch(`${API_BASE}/cameras/`);
  if (!res.ok) throw new Error('Error al obtener cámaras');
  return res.json();
};

export const createCamera = async (data: CameraCreate): Promise<Camera> => {
  const res = await fetch(`${API_BASE}/cameras/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear cámara');
  return res.json();
};

export const updateCamera = async (id: number, data: CameraUpdate): Promise<Camera> => {
  const res = await fetch(`${API_BASE}/cameras/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar cámara');
  return res.json();
};

export const deleteCamera = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/cameras/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar cámara');
};

export const connectCamera = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/cameras/${id}/connect`, { method: 'POST' });
  if (!res.ok) throw new Error('Error al conectar cámara');
};

export const disconnectCamera = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/cameras/${id}/disconnect`, { method: 'POST' });
  if (!res.ok) throw new Error('Error al desconectar cámara');
};

export const getStreamUrl = (id: number): string =>
  `${API_BASE}/cameras/${id}/stream`;
