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
      if (!user?.uid || typeof user.uid !== 'string') {
        alert('⚠️ Error: el usuario no tiene un uid válido.');
        return;
      }

      // ✅ 1. Confirmar correo en Auth (marca el email como verificado)
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        user.uid,
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
        .eq('uid', user.uid);

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
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Usuarios pendientes de aprobación</h1>
      
      {pending.length === 0 ? (
        <p className="text-gray-400">No hay usuarios pendientes.</p>
      ) : (
        pending.map((u) => (
          <div
            key={u.uid || u.username}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]"
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
