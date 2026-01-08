import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/employee_roles/';

interface Role {
  idRoleEmployee?: number;
  nameRole: string;
}

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState<Role>({ nameRole: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
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

  const updateRole = async (id: number, updatedRole: Role) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRole),
      });
      if (!res.ok) throw new Error('Error al actualizar rol');
      toast.success('Rol actualizado!');
      setEditingId(null);
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
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Rol</h2>
        <div className="flex gap-4">
          <input
            type="text"
            name="nameRole"
            placeholder="Nombre del rol"
            value={newRole.nameRole}
            onChange={e => setNewRole({ nameRole: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <button onClick={createRole} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
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
                {editingId === role.idRoleEmployee ? (
                  <div className="p-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium">Nombre del rol</label>
                      <input
                        type="text"
                        defaultValue={role.nameRole}
                        onChange={e => setNewRole({ nameRole: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => updateRole(role.idRoleEmployee!, { nameRole: newRole.nameRole || role.nameRole })}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Save size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2 py-5">
                      <span className="h-4 w-4 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Rol
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-violet-300">{role.nameRole}</h3>
                      </div>

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                        <button
                          onClick={() => { setEditingId(role.idRoleEmployee!); setNewRole(role); }}
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default RoleManagement;