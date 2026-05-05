import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'https://api.countryclub.doc-ia.cloud/employee_roles/';

interface Role {
  idRoleEmployee?: number;
  nameRole: string;
}

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState<Role>({ nameRole: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEditModalOpen = editingId !== null && editingData !== null;

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener roles');
      const data = await res.json();
      setRoles(data);
    } catch {
      toast.error('No se pudo cargar roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const createRole = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });
      if (!res.ok) throw new Error('Error al crear rol');
      toast.success('Rol creado!');
      setNewRole({ nameRole: '' });
      fetchRoles();
    } catch {
      toast.error('No se pudo crear rol.');
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
      setEditingId(null);
      setEditingData(null);
      fetchRoles();
    } catch {
      toast.error('No se pudo actualizar rol.');
    }
  };

  const deleteRole = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar rol?',
      description: 'Esta acción eliminará el rol de empleado permanentemente.',
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
      toast.error('No se pudo eliminar rol.');
    }
  };

  const handleEditClick = (role: Role) => {
    setEditingId(role.idRoleEmployee!);
    setEditingData({ ...role });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <div className="flex items-center justify-center h-[15vh]">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]
               filter drop-shadow-[0_0_10px_rgba(222,179,98,0.75)]
               drop-shadow-[0_0_26px_rgba(222,179,98,0.45)]
               drop-shadow-[0_0_30px_rgba(255,243,211,0.28)]">
          <span className="title-letter">G</span>
          <span className="title-letter">e</span>
          <span className="title-letter">s</span>
          <span className="title-letter">t</span>
          <span className="title-letter">i</span>
          <span className="title-letter">ó</span>
          <span className="title-letter">n</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">d</span>
          <span className="title-letter">e</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">R</span>
          <span className="title-letter">o</span>
          <span className="title-letter">l</span>
          <span className="title-letter">e</span>
          <span className="title-letter">s</span>
        </h1>
      </div>
      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-[#bdab62]">Agregar Nuevo Rol</h2>
        <div className="flex gap-4">
          <input
            type="text"
            name="nameRole"
            placeholder="Nombre del rol"
            value={newRole.nameRole}
            onChange={e => setNewRole({ nameRole: e.target.value })}
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
                key={role.idRoleEmployee}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-violet-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-violet-500/20"
              >
                <div className="flex flex-col items-center gap-2 py-5">
                  <span className="h-4 w-4 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Rol</span>
                </div>

                <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold text-violet-300">{role.nameRole}</h3>
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
                      onClick={() => deleteRole(role.idRoleEmployee!)}
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

        {isEditModalOpen && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-md max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Rol</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Nombre del rol</label>
                <input
                  type="text"
                  value={editingData!.nameRole}
                  onChange={e => setEditingData({ ...editingData!, nameRole: e.target.value })}
                  className="w-full p-2 rounded-md bg-gray-700"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateRole(editingId!)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};
export default RoleManagement;
