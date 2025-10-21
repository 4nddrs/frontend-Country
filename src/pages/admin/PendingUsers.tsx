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
    <div className="p-6 text-white">
      
      <div className="flex items-center justify-center h-[15vh]">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]
               filter drop-shadow-[0_0_10px_rgba(222,179,98,0.75)]
               drop-shadow-[0_0_26px_rgba(222,179,98,0.45)]
               drop-shadow-[0_0_30px_rgba(255,243,211,0.28)]">
          <span className="title-letter">U</span>
          <span className="title-letter">s</span>
          <span className="title-letter">u</span>
          <span className="title-letter">a</span>
          <span className="title-letter">r</span>
          <span className="title-letter">i</span>
          <span className="title-letter">o</span>
          <span className="title-letter">s</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">p</span>
          <span className="title-letter">e</span>
          <span className="title-letter">n</span>
          <span className="title-letter">d</span>
          <span className="title-letter">i</span>
          <span className="title-letter">e</span>
          <span className="title-letter">n</span>
          <span className="title-letter">t</span>
          <span className="title-letter">e</span>
          <span className="title-letter">s</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">d</span>
          <span className="title-letter">e</span>
          <span className="title-letter">&nbsp;</span>
          <span className="title-letter">a</span>
          <span className="title-letter">p</span>
          <span className="title-letter">r</span>
          <span className="title-letter">o</span>
          <span className="title-letter">b</span>
          <span className="title-letter">a</span>
          <span className="title-letter">c</span>
          <span className="title-letter">i</span>
          <span className="title-letter">ó</span>
          <span className="title-letter">n</span>
        </h1>
      </div>

      {pending.length === 0 ? (
        <p className="text-gray-400">No hay usuarios pendientes.</p>
      ) : (
        pending.map((u) => (
          <div
            key={u.uid || u.username}
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
