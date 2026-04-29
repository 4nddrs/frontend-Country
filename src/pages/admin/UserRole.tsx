import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, SaveButton, CancelButton, AdminSection } from '../../components/ui/admin-buttons';

const API_URL = 'https://api.countryclub.doc-ia.cloud/user_roles/';

interface UserRole {
  idUserRole?: number;
  roleName: string;
  created_at?: string;
}

const UserRolesManagement = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [newRole, setNewRole] = useState<UserRole>({
    roleName: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingData !== null;

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener roles');
      const data = await res.json();
      setRoles(data);
    } catch {
      // Silenciar error de carga
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!isEditModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelEdit();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen]);

  const createRole = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });
      if (!res.ok) throw new Error('Error al crear rol');
      toast.success('Rol creado!');
      setNewRole({ roleName: '' });
      fetchRoles();
    } catch {
      toast.error('No se pudo crear el rol.');
    }
  };

  const updateRole = async (id: number) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar rol');
      toast.success('Rol actualizado!');
      handleCancelEdit();
      fetchRoles();
    } catch {
      toast.error('No se pudo actualizar el rol.');
    }
  };

  const handleEditClick = (role: UserRole) => {
    setEditingId(role.idUserRole!);
    setEditingData({ ...role });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const deleteRole = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar rol?',
      description: 'Esta acción eliminará el rol de usuario permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar rol');
      toast.success('Rol eliminado!');
      fetchRoles();
    } catch {
      toast.error('No se pudo eliminar el rol.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Roles de Usuario</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Rol</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="roleName"
            placeholder="Nombre del Rol"
            value={newRole.roleName}
            onChange={e => setNewRole({ ...newRole, roleName: e.target.value })}
            className="select-field flex-1 placeholder-gray-400"
          />
          <AddButton onClick={createRole} />
        </div>
      </AdminSection>
      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando roles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <div
                key={role.idUserRole}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-rose-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-rose-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Rol
                  </span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-rose-300">{role.roleName}</h3>
                  </div>

                  <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                    <button
                      onClick={() => handleEditClick(role)}
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
                      onClick={() => deleteRole(role.idUserRole!)}
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
            ))}
          </div>
        )}
      </AdminSection>

      {isEditModalOpen && editingData && createPortal(
        <div
          className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleCancelEdit}
        >
          <div
            className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Rol de Usuario</h3>
                <p className="text-sm text-slate-400">Actualiza los datos del rol.</p>
              </div>
              <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                Cerrar
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-300">Nombre del Rol</label>
                <input
                  type="text"
                  value={editingData.roleName}
                  onChange={e => setEditingData({ ...editingData, roleName: e.target.value })}
                  className="select-field w-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <CancelButton onClick={handleCancelEdit} />
              <SaveButton onClick={() => updateRole(editingId!)}>Guardar cambios</SaveButton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserRolesManagement;
