// src/pages/admin/PendingUsers.tsx
import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../../supabaseClient';

export default function PendingUsers() {
  const [pending, setPending] = useState<any[]>([]);

  // 🔹 Cargar usuarios pendientes
  const fetchPending = async () => {
    const { data, error } = await supabase
      .from('erp_user')
      .select('*')
      .eq('isapproved', false);

    if (error) {
      console.error('❌ Error al obtener pendientes:', error);
    } else {
      setPending(data || []);
    }
  };

  // 🔹 Aprobar usuario
  const approveUser = async (user: any) => {
    try {
      console.log('🟡 Intentando aprobar usuario:', user);

      // 🧩 Validación previa
      if (!user?.fk_idAuthUser || typeof user.fk_idAuthUser !== 'string') {
        alert('⚠️ Error: el usuario no tiene un fk_idAuthUser válido.');
        return;
      }

      // ✅ 1. Confirmar correo en Auth (marca el email como verificado)
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        user.fk_idAuthUser,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('Error confirmando correo:', confirmError);
        alert('❌ Error confirmando correo: ' + confirmError.message);
        return;
      }

      // ✅ 2. Actualizar el registro en erp_user
      const { error: updateError } = await supabaseAdmin
        .from('erp_user')
        .update({
          isapproved: true,
          approved_at: new Date().toISOString(),
        })
        .eq('fk_idAuthUser', user.fk_idAuthUser);

      if (updateError) {
        console.error('❌ Error al actualizar usuario:', updateError);
        alert('❌ Error aprobando usuario: ' + updateError.message);
        return;
      }

      alert(`✅ Usuario "${user.username}" aprobado con éxito.`);
      fetchPending(); // refrescar la lista
    } catch (err: any) {
      console.error('Error inesperado:', err);
      alert('❌ Error inesperado: ' + err.message);
    }
  };

  // 🔹 Cargar pendientes al montar el componente
  useEffect(() => {
    fetchPending();
  }, []);

  // 🔹 Render
  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Usuarios pendientes de aprobación</h2>

      {pending.length === 0 ? (
        <p className="text-gray-400">No hay usuarios pendientes.</p>
      ) : (
        pending.map((u) => (
          <div
            key={u.idErpUser || u.fk_idAuthUser}
            className="flex justify-between bg-gray-800 p-4 mb-2 rounded-lg"
          >
            <span>
              {u.username} — {u.email}
            </span>
            <button
              onClick={() => approveUser(u)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Aprobar
            </button>
          </div>
        ))
      )}
    </div>
  );
}
