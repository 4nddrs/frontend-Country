import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'http://82.25.66.67:8000/employee_roles/';

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
    <div className="bg-slate-900 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
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
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8 border border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando roles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <div key={role.idRoleEmployee} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === role.idRoleEmployee ? (
                  <>
                    <input
                      type="text"
                      defaultValue={role.nameRole}
                      onChange={e => setNewRole({ nameRole: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <div className="flex justify-end gap-2">
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
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">{role.nameRole}</h3>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditingId(role.idRoleEmployee!); setNewRole(role); }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button
                        onClick={() => deleteRole(role.idRoleEmployee!)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
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