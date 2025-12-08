import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X, ChevronUp, ChevronDown } from 'lucide-react';

const API_URL = 'http://localhost:8000/erp_users/';

interface ErpUser {
  idErpUser?: number;
  username: string;
  email: string;
  fk_idOwner?: number;
  fk_idEmployee?: number;
  fk_idAuthUser?: string; // UUID, keep as string
  fk_idUserRole: number;
  created_at?: string;
}

const ErpUsersManagement = () => {
  const [users, setUsers] = useState<ErpUser[]>([]);
  const [newUser, setNewUser] = useState<ErpUser>({
    username: '',
    email: '',
    fk_idOwner: undefined,
    fk_idEmployee: undefined,
    fk_idAuthUser: '',
    fk_idUserRole: 1,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // For selects
  const [owners, setOwners] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  const fetchOwners = async () => {
    try {
      const res = await fetch("http://localhost:8000/owner/");
      if (!res.ok) throw new Error("Error al obtener propietarios");
      const data = await res.json();
      setOwners(data);
    } catch {
      toast.error("No se pudieron cargar propietarios");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:8000/employees/");
      if (!res.ok) throw new Error("Error al obtener empleados");
      const data = await res.json();
      setEmployees(data);
    } catch {
      toast.error("No se pudieron cargar empleados");
    }
  };

  const fetchUserRoles = async () => {
    try {
      const res = await fetch("http://localhost:8000/user_roles/");
      if (!res.ok) throw new Error("Error al obtener roles de usuario");
      const data = await res.json();
      setUserRoles(data);
    } catch {
      toast.error("No se pudieron cargar roles de usuario");
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
    fetchOwners();
    fetchEmployees();
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
      setNewUser({
        username: '',
        email: '',
        fk_idOwner: undefined,
        fk_idEmployee: undefined,
        fk_idAuthUser: '',
        fk_idUserRole: 1,
      });
      fetchUsers();
    } catch {
      toast.error('No se pudo crear usuario.');
    }
  };

  const updateUser = async (id: number, updatedUser: ErpUser) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      if (!res.ok) throw new Error('Error al actualizar usuario');
      toast.success('Usuario actualizado!');
      setEditingId(null);
      fetchUsers();
    } catch {
      toast.error('No se pudo actualizar usuario.');
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar usuario');
      toast.success('Usuario eliminado!');
      fetchUsers();
    } catch {
      toast.error('No se pudo eliminar usuario.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Usuarios ERP</h1>
      
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nuevo Usuario</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            name="username"
            placeholder="Usuario"
            value={newUser.username}
            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <select
            name="fk_idOwner"
            value={newUser.fk_idOwner || ""}
            onChange={e => setNewUser({ ...newUser, fk_idOwner: e.target.value ? Number(e.target.value) : undefined })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Opcional: Selecciona propietario --</option>
            {owners.map(owner => (
              <option key={owner.idOwner} value={owner.idOwner}>
                {owner.name + " " + owner.FirstName + " " + owner.SecondName}
              </option>
            ))}
          </select>
          <select
            name="fk_idEmployee"
            value={newUser.fk_idEmployee || ""}
            onChange={e => setNewUser({ ...newUser, fk_idEmployee: e.target.value ? Number(e.target.value) : undefined })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Opcional: Selecciona empleado --</option>
            {employees.map(emp => (
              <option key={emp.idEmployee} value={emp.idEmployee}>
                {emp.fullName}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="fk_idAuthUser"
            placeholder="ID AuthUser (UUID)"
            value={newUser.fk_idAuthUser || ""}
            onChange={e => setNewUser({ ...newUser, fk_idAuthUser: e.target.value })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <select
            name="fk_idUserRole"
            value={newUser.fk_idUserRole}
            onChange={e => setNewUser({ ...newUser, fk_idUserRole: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona rol --</option>
            {userRoles.map(role => (
              <option key={role.idUserRole} value={role.idUserRole}>
                {role.roleName}
              </option>
            ))}
          </select>
          <button onClick={createUser} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2">
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando usuarios...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => {
              const isExpanded = expanded[user.idErpUser ?? 0] ?? false;
              return (
              <div
                key={user.idErpUser}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-lime-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lime-500/20"
              >
                {editingId === user.idErpUser ? (
                  <div className="p-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium">Username</label>
                      <input
                        type="text"
                        defaultValue={user.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Email</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Propietario</label>
                      <select
                        value={newUser.fk_idOwner || ""}
                        onChange={e => setNewUser({ ...newUser, fk_idOwner: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                        <option value="">-- Opcional: Selecciona propietario --</option>
                        {owners.map(owner => (
                          <option key={owner.idOwner} value={owner.idOwner}>
                            {owner.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Empleado</label>
                      <select
                        value={newUser.fk_idEmployee || ""}
                        onChange={e => setNewUser({ ...newUser, fk_idEmployee: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                        <option value="">-- Opcional: Selecciona empleado --</option>
                        {employees.map(emp => (
                          <option key={emp.idEmployee} value={emp.idEmployee}>
                            {emp.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Auth UUID</label>
                      <input
                        type="text"
                        defaultValue={user.fk_idAuthUser || ""}
                        onChange={e => setNewUser({ ...newUser, fk_idAuthUser: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Rol de Usuario</label>
                      <select
                        value={newUser.fk_idUserRole}
                        onChange={e => setNewUser({ ...newUser, fk_idUserRole: Number(e.target.value) })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      >
                        <option value="">-- Selecciona rol --</option>
                        {userRoles.map(role => (
                          <option key={role.idUserRole} value={role.idUserRole}>
                            {role.roleName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => updateUser(user.idErpUser!, {
                          ...user,
                          ...newUser,
                        })}
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
                      <span className="h-4 w-4 rounded-full bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.6)]" />
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        Usuario
                      </span>
                    </div>

                    <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-lime-300">{user.username}</h3>
                        <p className="text-slate-400">
                          <span className="font-medium text-slate-200">{user.email}</span>
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [user.idErpUser ?? 0]: !prev[user.idErpUser ?? 0],
                          }))
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-lime-500/40 bg-lime-500/10 py-2 text-sm font-medium text-lime-300 transition hover:bg-lime-500/15"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={16} /> Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} /> Ver más
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                          <ul className="space-y-1">
                            <li><strong>Propietario:</strong> {owners.find(o => o.idOwner === user.fk_idOwner)?.ownerName || user.fk_idOwner || '-'}</li>
                            <li><strong>Empleado:</strong> {employees.find(e => e.idEmployee === user.fk_idEmployee)?.fullName || user.fk_idEmployee || '-'}</li>
                            <li><strong>Auth UUID:</strong> {user.fk_idAuthUser || '-'}</li>
                            <li><strong>Rol:</strong> {userRoles.find(r => r.idUserRole === user.fk_idUserRole)?.roleName || user.fk_idUserRole}</li>
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => { setEditingId(user.idErpUser!); setNewUser(user); }}
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
                        onClick={() => deleteUser(user.idErpUser!)}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErpUsersManagement;