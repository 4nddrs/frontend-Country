// src/pages/admin/PendingUsers.tsx
import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../../supabaseClient';
import { CheckCircle2, XCircle, Users, Mail, Calendar, Loader2 } from 'lucide-react';

export default function PendingUsers() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // 🔹 Cargar usuarios pendientes
  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('erp_user')
      .select('*')
      .eq('isapproved', false);

    if (error) {
      console.error('❌ Error al obtener pendientes:', error);
    } else {
      setPending(data || []);
    }
    setLoading(false);
  };

  // 🔹 Aprobar usuario
  const approveUser = async (user: any) => {
    try {
      setProcessingUserId(user.uid);

      // 🧩 Validación previa
      if (!user?.uid || typeof user.uid !== 'string') {
        alert('⚠️ Error: el usuario no tiene un uid válido.');
        setProcessingUserId(null);
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
        setProcessingUserId(null);
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
        setProcessingUserId(null);
        return;
      }

      alert(`✅ Usuario "${user.username}" aprobado con éxito.`);
      setProcessingUserId(null);
      fetchPending(); // refrescar la lista
    } catch (err: any) {
      console.error('Error inesperado:', err);
      alert('❌ Error inesperado: ' + err.message);
      setProcessingUserId(null);
    }
  };

  // 🔹 Rechazar usuario
  const rejectUser = async (user: any) => {
    if (!confirm(`¿Estás seguro de rechazar a "${user.username}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setProcessingUserId(user.uid);

      // 🧩 Validación previa
      if (!user?.uid || typeof user.uid !== 'string') {
        alert('⚠️ Error: el usuario no tiene un uid válido.');
        setProcessingUserId(null);
        return;
      }

      // ✅ 1. Eliminar usuario de Auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.uid);

      if (deleteAuthError) {
        console.error('Error eliminando usuario de Auth:', deleteAuthError);
        alert('❌ Error eliminando usuario de Auth: ' + deleteAuthError.message);
        setProcessingUserId(null);
        return;
      }

      // ✅ 2. Eliminar registro en erp_user
      const { error: deleteError } = await supabaseAdmin
        .from('erp_user')
        .delete()
        .eq('uid', user.uid);

      if (deleteError) {
        console.error('❌ Error al eliminar usuario:', deleteError);
        alert('❌ Error eliminando usuario: ' + deleteError.message);
        setProcessingUserId(null);
        return;
      }

      alert(`✅ Usuario "${user.username}" rechazado y eliminado.`);
      setProcessingUserId(null);
      fetchPending(); // refrescar la lista
    } catch (err: any) {
      console.error('Error inesperado:', err);
      alert('❌ Error inesperado: ' + err.message);
      setProcessingUserId(null);
    }
  };

  // 🔹 Cargar pendientes al montar el componente
  useEffect(() => {
    fetchPending();
  }, []);

  // 🔹 Render
  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Usuarios Pendientes de Aprobación</h1>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white/10 backdrop-blur-lg rounded-2xl">
          <Loader2 className="w-12 h-12 text-[#bdab62] animate-spin mb-4" />
          <p className="text-gray-400">Cargando usuarios pendientes...</p>
        </div>
      ) : pending.length === 0 ? (
        /* Empty State */
        <div className="bg-white/10 backdrop-blur-lg p-12 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-[#F8F4E3] mb-2">
              No hay usuarios pendientes
            </h3>
            <p className="text-gray-400">
              Todas las solicitudes han sido procesadas
            </p>
          </div>
        </div>
      ) : (
        /* Users List */
        <div className="space-y-4">
          {pending.map((u) => {
            const isProcessing = processingUserId === u.uid;
            const formattedDate = u.created_at 
              ? new Date(u.created_at).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })
              : 'Fecha desconocida';

            return (
              <div
                key={u.uid || u.username}
                className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3] hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#167C79]/30 border border-[#167C79] flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-[#bdab62] mb-1">
                          {u.username}
                        </h3>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Mail className="w-4 h-4 flex-shrink-0 text-teal-400" />
                            <span className="text-sm truncate">{u.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">Registrado: {formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 md:flex-shrink-0">
                    <button
                      onClick={() => approveUser(u)}
                      disabled={isProcessing}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-semibold rounded-md shadow-md active:scale-95 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                      <span>Aprobar</span>
                    </button>

                    <button
                      onClick={() => rejectUser(u)}
                      disabled={isProcessing}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-semibold rounded-md shadow-md active:scale-95 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
