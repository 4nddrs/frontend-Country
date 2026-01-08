import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X, ChevronUp, ChevronDown } from 'lucide-react';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'http://localhost:8000/erp_users/';

interface ErpUser {
  uid?: string; // UUID from Supabase Auth
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
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // For selects
  const [userRoles, setUserRoles] = useState<any[]>([]);

  const fetchUserRoles = async () => {
    try {
      const res = await fetch("http://localhost:8000/user_roles/");
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
      setNewUser({
        username: '',
        email: '',
        uid: '',
        isapproved: false,
        fk_idUserRole: 1,
        telegram_chat_id: undefined,
      });
      fetchUsers();
    } catch {
      toast.error('No se pudo crear usuario.');
    }
  };

  const updateUser = async (uid: string, updatedUser: ErpUser) => {
    try {
      const res = await fetch(`${API_URL}${uid}`, {
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
          <input
            type="text"
            name="uid"
            placeholder="UID de Supabase (UUID)"
            value={newUser.uid || ""}
            onChange={e => setNewUser({ ...newUser, uid: e.target.value })}
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
          <input
            type="number"
            name="telegram_chat_id"
            placeholder="Telegram Chat ID (opcional)"
            value={newUser.telegram_chat_id || ""}
            onChange={e => setNewUser({ ...newUser, telegram_chat_id: e.target.value ? Number(e.target.value) : undefined })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
          />
          <label className="flex items-center gap-2 p-2 bg-gray-700 rounded-md">
            <input
              type="checkbox"
              checked={newUser.isapproved}
              onChange={e => setNewUser({ ...newUser, isapproved: e.target.checked })}
            />
            <span className="text-white">Aprobado</span>
          </label>
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
              const isExpanded = expanded[user.uid ?? ''] ?? false;
              return (
              <div
                key={user.uid}
                className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-lime-500/10 via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lime-500/20"
              >
                {editingId === user.uid ? (
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
                      <label className="block mb-1 text-sm font-medium">UID (UUID)</label>
                      <input
                        type="text"
                        defaultValue={user.uid || ""}
                        onChange={e => setNewUser({ ...newUser, uid: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                        disabled
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
                    <div>
                      <label className="block mb-1 text-sm font-medium">Telegram Chat ID</label>
                      <input
                        type="number"
                        defaultValue={user.telegram_chat_id || ""}
                        onChange={e => setNewUser({ ...newUser, telegram_chat_id: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full p-2 rounded-md bg-gray-600 text-white mb-2"
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={newUser.isapproved}
                        onChange={e => setNewUser({ ...newUser, isapproved: e.target.checked })}
                      />
                      <label className="text-sm font-medium">Aprobado</label>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => updateUser(user.uid!, {
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
                            [user.uid ?? '']: !prev[user.uid ?? ''],
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
                        onClick={() => { setEditingId(user.uid!); setNewUser(user); }}
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