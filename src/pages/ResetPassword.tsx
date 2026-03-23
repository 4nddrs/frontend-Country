import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AUTH_REDIRECT_URLS } from '../config/app';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [linkExpired, setLinkExpired] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Escuchar eventos de autenticación de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event);
      console.log('📦 Session:', session);
      
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        // Token válido, usuario puede cambiar la contraseña
        console.log('✅ PASSWORD_RECOVERY detectado');
        setVerifying(false);
        setLinkExpired(false);
        toast.success('Enlace verificado. Puedes cambiar tu contraseña.');
      } else if (event === 'SIGNED_IN' && session) {
        // Usuario inició sesión correctamente después del recovery
        console.log('✅ SIGNED_IN después de recovery');
        setVerifying(false);
        setLinkExpired(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
        setVerifying(false);
      }
    });

    // Verificar si hay errores explícitos en la URL
    const checkUrlErrors = async () => {
      const fullUrl = window.location.href;
      const hashPart = window.location.hash;
      const searchPart = window.location.search;
      
      console.log('🔍 URL completa:', fullUrl);
      console.log('🔍 Hash:', hashPart);
      console.log('🔍 Search params:', searchPart);
      
      // Verificar parámetros de consulta (PKCE flow usa ?code=xxx)
      const searchParams = new URLSearchParams(searchPart);
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      // También verificar hash params (legacy flow usa #access_token=xxx)
      const hashParams = new URLSearchParams(hashPart.substring(1));
      const hashError = hashParams.get('error');
      const hashErrorCode = hashParams.get('error_code');
      const hashErrorDescription = hashParams.get('error_description');
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      console.log('📝 Search Params:', { code, errorParam });
      console.log('📝 Hash Params:', { hashError, hashErrorCode, type, hasAccessToken: !!accessToken });

      // Verificar errores en search params
      if (errorParam) {
        console.error('❌ Error en search params:', errorParam, errorDescription);
        if (mounted) {
          setVerifying(false);
          setLinkExpired(true);
          toast.error(errorDescription?.replace(/\+/g, ' ') || 'Link inválido o expirado');
        }
        return;
      }

      // Verificar errores en hash params
      if (hashError) {
        console.error('❌ Error en hash:', hashError, hashErrorCode, hashErrorDescription);
        if (mounted) {
          setVerifying(false);
          setLinkExpired(true);
          toast.error(hashErrorDescription?.replace(/\+/g, ' ') || 'Link inválido o expirado');
        }
        return;
      }

      // Si hay código de confirmación, NO hacer nada - dejar que Supabase lo maneje automáticamente
      if (code) {
        console.log('🔑 Código de confirmación encontrado:', code.substring(0, 20) + '...');
        console.log('⏳ Esperando a que Supabase procese el código automáticamente...');
        // NO llamar a exchangeCodeForSession - Supabase lo hará automáticamente con detectSessionInUrl
        return;
      }

      // Si hay access_token (legacy flow), establecer sesión directamente
      if (accessToken && type === 'recovery') {
        console.log('🔑 Token de recovery encontrado (legacy), estableciendo sesión...');
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (error) {
            console.error('❌ Error al establecer sesión:', error);
            if (mounted) {
              setVerifying(false);
              setLinkExpired(true);
              toast.error('Error al verificar el enlace');
            }
          } else if (data.session) {
            console.log('✅ Sesión establecida correctamente');
            if (mounted) {
              setVerifying(false);
              setLinkExpired(false);
              toast.success('Enlace verificado correctamente');
            }
          }
        } catch (err) {
          console.error('❌ Error catch al establecer sesión:', err);
          if (mounted) {
            setVerifying(false);
            setLinkExpired(true);
          }
        }
        return;
      }

      // Dar tiempo a Supabase para procesar el token automáticamente
      console.log('⏳ Esperando a que Supabase procese automáticamente...');
      setTimeout(async () => {
        if (!mounted) return;
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Sesión obtenida:', { hasSession: !!session, error });
        
        if (!session) {
          console.warn('⚠️ No hay sesión después de esperar');
          setVerifying(false);
          setLinkExpired(true);
          toast.error('Link inválido o expirado');
        } else {
          console.log('✅ Sesión válida encontrada');
          setVerifying(false);
        }
      }, 2000);
    };

    checkUrlErrors();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success('¡Contraseña actualizada correctamente!');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error al actualizar la contraseña');
      toast.error('Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (!resendEmail.trim()) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
        redirectTo: AUTH_REDIRECT_URLS.resetPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('¡Nuevo correo enviado! Revisa tu bandeja de entrada');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Error al enviar el correo');
    } finally {
      setResending(false);
    }
  };

  // Pantalla de verificación
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#0a1628] p-4">
        <div className="bg-[#0f1f3a]/80 backdrop-blur-xl border border-[#1f3747] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="mb-6 mx-auto w-20 h-20 bg-[#21386e]/30 rounded-full flex items-center justify-center">
            <Lock className="w-12 h-12 text-[#6c8fdf] animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Verificando enlace...</h2>
          <p className="text-gray-400 mb-6">
            Por favor espera mientras validamos tu enlace de recuperación.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c8fdf] mx-auto"></div>
        </div>
      </div>
    );
  }

  // Pantalla de link expirado
  if (linkExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#0a1628] p-4">
        <div className="bg-[#0f1f3a]/80 backdrop-blur-xl border border-[#1f3747] rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="mb-4 mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Enlace Expirado</h2>
            <p className="text-gray-400 text-sm">
              El enlace de recuperación ha expirado o ya fue utilizado. Solicita uno nuevo ingresando tu correo electrónico.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Correo Electrónico</label>
              <div className="relative">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-4 pr-4 py-3 bg-[#111c24] border border-[#1f3747] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#6c8fdf] placeholder-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleResendLink()}
                />
              </div>
            </div>

            <button
              onClick={handleResendLink}
              disabled={resending}
              className="w-full bg-[#21386e] hover:bg-[#1a2c59] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60"
            >
              {resending ? 'Enviando...' : 'Enviar Nuevo Enlace'}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full text-gray-400 hover:text-white text-sm transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de éxito
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#0a1628] p-4">
        <div className="bg-[#0f1f3a]/80 backdrop-blur-xl border border-[#1f3747] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="mb-6 mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">¡Contraseña Actualizada!</h2>
          <p className="text-gray-400 mb-6">
            Tu contraseña ha sido actualizada correctamente. Serás redirigido al inicio de sesión en unos momentos.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c8fdf] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#0a1628] p-4">
      <div className="bg-[#0f1f3a]/80 backdrop-blur-xl border border-[#1f3747] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-4 mx-auto w-16 h-16 bg-[#21386e]/30 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#6c8fdf]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Restablecer Contraseña</h2>
          <p className="text-gray-400">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* Nueva Contraseña */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-4 pr-12 py-3 bg-[#111c24] border border-[#1f3747] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#6c8fdf] placeholder-gray-500"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6c8fdf]"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Confirmar Contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-4 pr-12 py-3 bg-[#111c24] border border-[#1f3747] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#6c8fdf] placeholder-gray-500"
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6c8fdf]"
              >
                {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Indicador de contraseñas coincidentes */}
          {newPassword && confirmPassword && newPassword === confirmPassword && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Las contraseñas coinciden</span>
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#21386e] hover:bg-[#1a2c59] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-[#21386e]/30"
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>

          {/* Link de Regreso */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-gray-400 hover:text-white text-sm transition-colors"
          >
            Volver al inicio
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;



