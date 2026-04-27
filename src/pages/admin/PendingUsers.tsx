// src/pages/admin/PendingUsers.tsx
import { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../../supabaseClient';
import { CheckCircle2, XCircle, Users, Mail, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { confirmDialog } from '../../utils/confirmDialog';
import iconImg from '../../assets/icon.jpg';

export default function PendingUsers() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // 🔹 Cargar usuarios pendientes
  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_user')
        .select('*')
        .eq('isapproved', false);
      if (error) throw error;
      setPending(data || []);
    } catch (err) {
      console.error('❌ Error al obtener pendientes:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Aprobar usuario
  const approveUser = async (user: any) => {
    try {
      setProcessingUserId(user.uid);

      if (!user?.uid || typeof user.uid !== 'string') {
        toast.error('El usuario no tiene un uid válido.');
        return;
      }

      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        user.uid,
        { email_confirm: true }
      );
      if (confirmError) {
        toast.error('Error confirmando correo: ' + confirmError.message);
        return;
      }

      const { error: updateError } = await supabaseAdmin
        .from('erp_user')
        .update({ isapproved: true, approved_at: new Date().toISOString() })
        .eq('uid', user.uid);
      if (updateError) {
        toast.error('Error aprobando usuario: ' + updateError.message);
        return;
      }

      toast.success(`Usuario "${user.username}" aprobado con éxito.`);
      await fetchPending();
    } catch (err: any) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado: ' + err.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  // 🔹 Rechazar usuario
  const rejectUser = async (user: any) => {
    const confirmed = await confirmDialog({
      title: `¿Rechazar a "${user.username}"?`,
      description: 'Esta acción eliminará al usuario y no se puede deshacer.',
      confirmText: 'Rechazar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    try {
      setProcessingUserId(user.uid);

      if (!user?.uid || typeof user.uid !== 'string') {
        toast.error('El usuario no tiene un uid válido.');
        return;
      }

      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.uid);
      if (deleteAuthError) {
        toast.error('Error eliminando usuario de Auth: ' + deleteAuthError.message);
        return;
      }

      const { error: deleteError } = await supabaseAdmin
        .from('erp_user')
        .delete()
        .eq('uid', user.uid);
      if (deleteError) {
        toast.error('Error eliminando usuario: ' + deleteError.message);
        return;
      }

      toast.success(`Usuario "${user.username}" rechazado y eliminado.`);
      await fetchPending();
    } catch (err: any) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado: ' + err.message);
    } finally {
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
        <div className="flex flex-col items-center justify-center py-12 bg-white/5 rounded-2xl">
          <Loader2 className="w-12 h-12 text-[#bdab62] animate-spin mb-4" />
          <p className="text-gray-400">Cargando usuarios pendientes...</p>
        </div>
      ) : pending.length === 0 ? (
        /* Empty State */
        <div className="bg-white/5 p-12 rounded-2xl">
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
        /* Users Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pending.map((u) => {
            const isProcessing = processingUserId === u.uid;
            const formattedDate = u.created_at
              ? new Date(u.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Fecha desconocida';

            return (
              <div
                key={u.uid || u.username}
                className="rounded-[22px] overflow-hidden bg-[#131313] shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/[0.06] hover:-translate-y-1.5 transition-transform duration-300"
              >
                {/* Banner imagen — tab derecho */}
                <div className="relative h-36 overflow-hidden">
                  <img src={iconImg} alt="banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/20" />
                  <div className="absolute top-3 right-3 text-right leading-tight">
                    <p className="text-white text-xs font-semibold drop-shadow-md">Country Hipica</p>
                    <p className="text-white/60 text-[10px] drop-shadow">Solicitud de acceso</p>
                  </div>
                </div>

                {/* Cuerpo oscuro con elevación tipo carpeta:
                    -mt sube el bloque sobre la imagen,
                    rounded-tr-[28px] crea el tab izquierdo cuadrado / derecho curvo */}
                <div className="-mt-1 rounded-tr-[28px] bg-[#131313] px-5 pt-5 pb-5 space-y-4">
                  {/* Título + subtítulo */}
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-[#F8F4E3] leading-tight">{u.username}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-500 truncate">{u.email}</span>
                    </div>
                  </div>

                  {/* Espacio interior (imita el cuerpo vacío de la tarjeta de referencia) */}
                  <div className="h-4" />

                  {/* Pie: estado + fecha */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#F8F4E3] leading-none">
                        <Users className="inline w-5 h-5 mb-0.5 mr-1 text-slate-400" />
                      </span>
                      <span className="text-xs text-slate-500 ml-1">Pendiente</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveUser(u)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
                        border border-[#167C79]/60 bg-[#167C79]/10 text-teal-300
                        hover:bg-[#167C79]/20 shadow-[0_0_10px_rgba(22,124,121,0.2)]
                        disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Aprobar
                    </button>
                    <button
                      onClick={() => rejectUser(u)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
                        border border-[#bdab62]/50 bg-[#bdab62]/8 text-[#bdab62]
                        hover:bg-[#bdab62]/15 shadow-[0_0_10px_rgba(189,171,98,0.15)]
                        disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Rechazar
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




