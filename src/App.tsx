// src/App.tsx
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import MainLayout from './components/MainLayout';
import AuthForm from './components/AuthForm';
import AppUser from './pages/user/AppUser';
import ResetPassword from './pages/ResetPassword';
import { handleSignOut } from './utils/auth';

// Función auxiliar para obtener el rol (reutilizable)
const fetchUserRole = async (userId: string) => {
  console.log('🔍 fetchUserRole - userId:', userId);
  const { data: erpUser, error } = await supabase
    .from('erp_user')
    .select('fk_idUserRole, isapproved, uid, username, email')
    .eq('uid', userId) 
    .maybeSingle(); 
  
  console.log('🔍 fetchUserRole - FULL response:', { 
    erpUser, 
    error,
    hasData: !!erpUser,
    errorCode: error?.code,
    errorMessage: error?.message,
    errorDetails: error?.details
  });
  
  if (error) {
    console.error('❌ Error consultando erp_user:', error);
    return { 
      role: null, 
      approved: false, 
      error: `Error BD: ${error.message}`,
      debugInfo: { errorCode: error.code, errorDetails: error.details }
    };
  }

  if (!erpUser) {
    console.warn('⚠️ Usuario sin registro en erp_user - userId:', userId);
    return { 
      role: null, 
      approved: false, 
      error: 'Usuario no registrado en erp_user.',
      debugInfo: { userId, message: 'No hay registro en erp_user para este uid' }
    };
  }
  
  console.log('📋 Usuario encontrado:', {
    uid: erpUser.uid,
    username: erpUser.username,
    email: erpUser.email,
    isapproved: erpUser.isapproved,
    fk_idUserRole: erpUser.fk_idUserRole,
    roleType: typeof erpUser.fk_idUserRole
  });
  
  if (erpUser.isapproved === false || erpUser.isapproved === null) {
    console.warn('⏳ Usuario encontrado pero NO aprobado. isapproved:', erpUser.isapproved);
    return { 
      role: null, 
      approved: false, 
      error: 'Cuenta pendiente de aprobación.',
      debugInfo: { 
        isapproved: erpUser.isapproved,
        username: erpUser.username,
        email: erpUser.email 
      }
    };
  }
  
  if (!erpUser.fk_idUserRole) {
    console.error('❌ Usuario aprobado pero SIN rol asignado!');
    return {
      role: null,
      approved: true,
      error: 'Usuario sin rol asignado.',
      debugInfo: { fk_idUserRole: erpUser.fk_idUserRole }
    };
  }
  
  console.log('✅ fetchUserRole - usuario aprobado con rol:', erpUser.fk_idUserRole);
  return { 
    role: Number(erpUser.fk_idUserRole), 
    approved: true, 
    error: null,
    debugInfo: { username: erpUser.username, email: erpUser.email }
  };
};


export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [authStatus, setAuthStatus] = useState<'ok' | 'pending' | 'no-record' | 'error'>('ok');

 useEffect(() => {
    
    const checkInitialSession = async () => {
      console.log('🔄 Ejecutando checkInitialSession (Robusto)...');
      
      try {
        // 1. Obtener la sesión
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session ?? null;
        setSession(currentSession);

        if (currentSession?.user?.id) {
          // 2. Si hay sesión, buscamos el rol
          const userId = currentSession.user.id;
          const result = await fetchUserRole(userId);
          console.log('📊 Resultado de fetchUserRole en checkInitialSession:', result);
          if (result.error) {
            console.error("❌ Error al validar rol en checkInitialSession:", result.error);
            // Don't forcibly sign out — instead keep the session and surface a friendly message.
            if (result.error.includes('pendiente') || result.error.includes('aprob')) {
              setAuthStatus('pending');
            } else {
              setAuthStatus('no-record');
            }
            setRole(null);
          } else {
            setRole(result.role);
            setAuthStatus('ok');
          }
        } else {
          // No hay sesión - limpiar todos los estados
          console.log('❌ No hay sesión activa');
          setRole(null);
          setAuthStatus('ok');
        }
      } catch (e) {
        console.error("❌ Error inesperado en checkInitialSession:", e);
        // Manejo de errores fatales, por si acaso
      } finally {
        // ⭐ ESTO ES LA CLAVE: Garantiza que la carga termine.
        setLoading(false);
      }
    };

    checkInitialSession();
    
    // Listener para cambios de autenticación
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('🔔 Auth state change:', event);
      
      if (event === 'SIGNED_IN' && currentSession?.user?.id) {
        // Solo actualizar si realmente no tenemos un rol aún
        // Esto evita limpiar el rol cuando solo cambias de ventana
        if (role === null) {
          setSession(currentSession);
          
          const result = await fetchUserRole(currentSession.user.id);
          console.log('📊 Resultado de fetchUserRole en SIGNED_IN:', result);
          if (result.error) {
            // Surface status instead of immediate sign-out
            if (result.error.includes('pendiente') || result.error.includes('aprob')) {
              setAuthStatus('pending');
            } else {
              setAuthStatus('no-record');
            }
            setRole(null);
          } else {
            setRole(result.role);
            setAuthStatus('ok');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Limpiar TODOS los estados cuando se cierra sesión
        setSession(null);
        setRole(null);
        setAuthStatus('ok');
      } else if (event === 'TOKEN_REFRESHED') {
        // Solo actualizar la sesión, mantener el rol
        console.log('🔄 Token refrescado');
        setSession(currentSession);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [role]); // Agregar 'role' como dependencia

  // UI de Carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div>
          <div className="animate-spin mb-4 border-4 border-t-transparent border-emerald-400 rounded-full w-10 h-10 mx-auto" />
          <p className="text-center">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Ruta pública para reset password */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Rutas protegidas */}
      <Route
        path="/*"
        element={
          // No hay sesión -> Login
          !session ? (
            <AuthForm />
          ) : (
            // Si existe sesión pero no está OK (pendiente o sin registro), mostramos mensaje amable
            authStatus !== 'ok' ? (
              <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
                <div className="max-w-xl text-center">
                  {authStatus === 'pending' ? (
                    <>
                      <h2 className="text-2xl mb-4">Cuenta pendiente de aprobación</h2>
                      <p className="text-slate-300 mb-6">Tu cuenta está registrada pero aún debe ser aprobada por un administrador. Por favor, espera la confirmación por correo.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl mb-4">Cuenta no encontrada</h2>
                      <p className="text-slate-300 mb-6">No pudimos validar tu cuenta en el sistema. Contacta al soporte si crees que esto es un error.</p>
                    </>
                  )}
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={async () => {
                        await handleSignOut();
                        window.location.href = '/';
                      }}
                      className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // 2. Si hay sesión y rol -> renderizar según rol
              role === 6 || role === 8 ? (
                <MainLayout />
              ) : role === 7 ? (
                <AppUser />
              ) : (
                // Rol null -> Mostrar loading (evita parpadeo durante validación inicial)
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                  <div>
                    <div className="animate-spin mb-4 border-4 border-t-transparent border-emerald-400 rounded-full w-10 h-10 mx-auto" />
                    <p className="text-center">Validando acceso...</p>
                  </div>
                </div>
              )
            )
          )
        }
      />
    </Routes>
  );
}