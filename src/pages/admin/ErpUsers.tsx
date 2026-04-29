import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'https://api.countryclub.doc-ia.cloud/erp_users/';

interface ErpUser {
  uid?: string;
  username: string;
  email: string;
  isapproved: boolean;
  approved_at?: string;
  fk_idUserRole: number;
  telegram_chat_id?: number;
  created_at?: string;
}

const ErpUsersManagement = () => {
  const [users, setUsers] = useState<ErpUser[]>([]);
  const [newUser, setNewUser] = useState<ErpUser>({
    username: '',
    email: '',
    uid: '',
    isapproved: false,
    fk_idUserRole: 1,
    telegram_chat_id: undefined,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<ErpUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [userRoles, setUserRoles] = useState<any[]>([]);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchUserRoles = async () => {
    try {
      const res = await fetch("https://api.countryclub.doc-ia.cloud/user_roles/");
      if (!res.ok) throw new Error("Error al obtener roles de usuario");
      const data = await res.json();
      setUserRoles(data);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener usuarios');
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error('No se pudo cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserRoles();
  }, []);

  const createUser = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error('Error al crear usuario');
      toast.success('Usuario creado!');
      setNewUser({ username: '', email: '', uid: '', isapproved: false, fk_idUserRole: 1, telegram_chat_id: undefined });
      fetchUsers();
    } catch {
      toast.error('No se pudo crear usuario.');
    }
  };

  const updateUser = async (uid: string) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar usuario');
      toast.success('Usuario actualizado!');
      setEditingId(null);
      setEditingData(null);
      fetchUsers();
    } catch {
      toast.error('No se pudo actualizar usuario.');
    }
  };

  const deleteUser = async (uid: string) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar usuario?',
      description: 'Esta acción eliminará el usuario del sistema permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${uid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar usuario');
      toast.success('Usuario eliminado!');
      fetchUsers();
    } catch {
      toast.error('No se pudo eliminar usuario.');
    }
  };

  const handleEditClick = (user: ErpUser) => {
    setEditingId(user.uid!);
    setEditingData({ ...user });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Usuarios ERP</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Usuario</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="username"
            placeholder="Usuario"
            value={newUser.username}
            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
            className="select-field flex-1 placeholder-gray-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            className="select-field flex-1 placeholder-gray-400"
          />
          <input
            type="text"
            name="uid"
            placeholder="UID de Supabase (UUID)"
            value={newUser.uid || ""}
            onChange={e => setNewUser({ ...newUser, uid: e.target.value })}
            className="select-field flex-1 placeholder-gray-400"
          />
          <select
            name="fk_idUserRole"
            value={newUser.fk_idUserRole}
            onChange={e => setNewUser({ ...newUser, fk_idUserRole: Number(e.target.value) })}
            className="select-field flex-1"
          >
            <option value="">-- Selecciona rol --</option>
            {userRoles.map(role => (
              <option key={role.idUserRole} value={role.idUserRole}>{role.roleName}</option>
            ))}
          </select>
          <input
            type="number"
            name="telegram_chat_id"
            placeholder="Telegram Chat ID (opcional)"
            value={newUser.telegram_chat_id || ""}
            onChange={e => setNewUser({ ...newUser, telegram_chat_id: e.target.value ? Number(e.target.value) : undefined })}
            className="select-field flex-1 placeholder-gray-400"
          />
          <label className="flex items-center gap-2 p-2 bg-gray-700 rounded-md">
            <input
              type="checkbox"
              checked={newUser.isapproved}
              onChange={e => setNewUser({ ...newUser, isapproved: e.target.checked })}
            />
            <span className="text-white">Aprobado</span>
          </label>
          <AddButton onClick={createUser} />
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando usuarios...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => {
              const isExpanded = expanded[user.uid ?? ''] ?? false;
              return (
                <div
                  key={user.uid}
                  className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-lime-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lime-500/20"
                >
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className="h-4 w-4 rounded-full bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.6)]" />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Usuario</span>
                  </div>

                  <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-semibold text-lime-300">{user.username}</h3>
                      <p className="text-slate-400">
                        <span className="font-medium text-slate-200">{user.email}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [user.uid ?? '']: !prev[user.uid ?? ''] }))}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-lime-500/40 bg-lime-500/10 py-2 text-sm font-medium text-lime-300 transition hover:bg-lime-500/15"
                    >
                      {isExpanded ? <><ChevronUp size={16} /> Ver menos</> : <><ChevronDown size={16} /> Ver más</>}
                    </button>

                    {isExpanded && (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                        <ul className="space-y-1">
                          <li><strong>UID:</strong> {user.uid || '-'}</li>
                          <li><strong>Rol:</strong> {userRoles.find(r => r.idUserRole === user.fk_idUserRole)?.roleName || user.fk_idUserRole}</li>
                          <li><strong>Aprobado:</strong> {user.isapproved ? 'Sí' : 'No'}</li>
                          <li><strong>Fecha aprobación:</strong> {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : '-'}</li>
                          <li><strong>Telegram ID:</strong> {user.telegram_chat_id || '-'}</li>
                          <li><strong>Creado:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                    bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                    shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                    hover:scale-[1.1]
                                    active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                    transition-all duration-300 ease-in-out"
                      >
                        <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.uid!)}
                        className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                  hover:scale-[1.1]
                                  active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out"
                      >
                        <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isEditModalOpen && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Usuario ERP</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Username</label>
                  <input
                    type="text"
                    value={editingData!.username}
                    onChange={e => setEditingData({ ...editingData!, username: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={editingData!.email}
                    onChange={e => setEditingData({ ...editingData!, email: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">UID (UUID)</label>
                  <input
                    type="text"
                    value={editingData!.uid || ""}
                    className="w-full p-2 rounded-md bg-gray-700 opacity-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Rol de Usuario</label>
                  <select
                    value={editingData!.fk_idUserRole}
                    onChange={e => setEditingData({ ...editingData!, fk_idUserRole: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  >
                    <option value="">-- Selecciona rol --</option>
                    {userRoles.map(role => (
                      <option key={role.idUserRole} value={role.idUserRole}>{role.roleName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Telegram Chat ID</label>
                  <input
                    type="number"
                    value={editingData!.telegram_chat_id || ""}
                    onChange={e => setEditingData({ ...editingData!, telegram_chat_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full p-2 rounded-md bg-gray-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingData!.isapproved}
                    onChange={e => setEditingData({ ...editingData!, isapproved: e.target.checked })}
                  />
                  <label className="text-sm font-medium">Aprobado</label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateUser(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default ErpUsersManagement;
