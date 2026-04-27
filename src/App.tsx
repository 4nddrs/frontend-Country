// src/App.tsx
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';
import MainLayout from './components/MainLayout';
import AuthForm from './components/AuthForm';
import AppUser from './pages/user/AppUser';
import ResetPassword from './pages/ResetPassword';
import { handleSignOut } from './utils/auth';
import CaballerizoDashboard from './pages/caballerizo/CaballerizoDashboard';
import SignOutModal from './components/SignOutModal';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [role, setRole] = useState<number | null>(null);
  const [authStatus, setAuthStatus] = useState<'ok' | 'pending' | 'no-record' | 'error'>('ok');
  const hasRedirectedRef = useRef(false);

 useEffect(() => {
    let isSubscribed = true;
    let isInitialCheckDone = false;
    
    // BroadcastChannel para sincronizar entre pestañas
    const tabSyncChannel = new BroadcastChannel('auth-sync');
    
    // Listener para mensajes de otras pestañas
    tabSyncChannel.onmessage = (event) => {
      if (!isSubscribed) return;
      
      console.log('📡 Mensaje de otra pestaña:', event.data);
      
      if (event.data.type === 'SIGN_OUT') {
        // Otra pestaña cerró sesión, sincronizar
        console.log('🔄 Sincronizando cierre de sesión desde otra pestaña');
        setSession(null);
        setRole(null);
        setAuthStatus('ok');
        setLoading(false);
      } else if (event.data.type === 'SIGN_IN' && event.data.role) {
        // Otra pestaña inició sesión, sincronizar
        console.log('🔄 Sincronizando inicio de sesión desde otra pestaña');
        setRole(event.data.role);
        setAuthStatus('ok');
        setLoading(false);
      } else if (event.data.type === 'ROLE_UPDATE' && event.data.role) {
        // Otra pestaña actualizó el rol
        console.log('🔄 Sincronizando actualización de rol desde otra pestaña');
        setRole(event.data.role);
        setAuthStatus('ok');
      }
    };
    
    const checkInitialSession = async () => {
      console.log('🔄 Ejecutando checkInitialSession...');
      
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session ?? null;
        
        if (!isSubscribed) return;
        
        setSession(currentSession);

        if (currentSession?.user?.id) {
          const userId = currentSession.user.id;
          const result = await fetchUserRole(userId);
          console.log('📊 Resultado de fetchUserRole en checkInitialSession:', result);
          
          if (!isSubscribed) return;
          
          if (result.error) {
            console.error("❌ Error al validar rol en checkInitialSession:", result.error);
            if (result.error.includes('pendiente') || result.error.includes('aprob')) {
              setAuthStatus('pending');
            } else {
              setAuthStatus('no-record');
            }
            setRole(null);
          } else {
            setRole(result.role);
            setAuthStatus('ok');
            // Notificar a otras pestañas
            tabSyncChannel.postMessage({ 
              type: 'SIGN_IN', 
              role: result.role 
            });
          }
        } else {
          console.log('❌ No hay sesión activa');
          setRole(null);
          setAuthStatus('ok');
          // Resetear el flag de redirección
          hasRedirectedRef.current = false;
        }
      } catch (e) {
        console.error("❌ Error inesperado en checkInitialSession:", e);
        if (!isSubscribed) return;
        setRole(null);
        setAuthStatus('ok');
      } finally {
        if (isSubscribed) {
          console.log('✅ Finalizando carga inicial');
          isInitialCheckDone = true;
          setLoading(false);
        }
      }
    };

    checkInitialSession();
    
    // Listener para cambios de autenticación
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('🔔 Auth state change:', event, 'Session exists:', !!currentSession);
      
      if (!isSubscribed) return;
      
      // Si es SIGNED_IN pero aún no termina checkInitialSession, ignorar
      if (event === 'SIGNED_IN' && !isInitialCheckDone) {
        console.log('⏭️ Ignorando SIGNED_IN - checkInitialSession aún en progreso');
        return;
      }
      
      if (event === 'SIGNED_IN' && currentSession?.user?.id) {
        setSession(currentSession);
        
        const result = await fetchUserRole(currentSession.user.id);
        console.log('📊 Resultado de fetchUserRole en SIGNED_IN:', result);
        
        if (!isSubscribed) return;
        
        if (result.error) {
          if (result.error.includes('pendiente') || result.error.includes('aprob')) {
            setAuthStatus('pending');
          } else {
            setAuthStatus('no-record');
          }
          setRole(null);
        } else {
          setRole(result.role);
          setAuthStatus('ok');
          // Notificar a otras pestañas
          tabSyncChannel.postMessage({ 
            type: 'SIGN_IN', 
            role: result.role 
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setRole(null);
        setAuthStatus('ok');
        setLoading(false);
        // Resetear el flag de redirección para el próximo login
        hasRedirectedRef.current = false;
        // Notificar a otras pestañas que se cerró sesión
        tabSyncChannel.postMessage({ type: 'SIGN_OUT' });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refrescado');
        if (isSubscribed && currentSession) {
          setSession(currentSession);
        }
      } else if (event === 'INITIAL_SESSION') {
        console.log('⏭️ Ignorando INITIAL_SESSION - ya manejado en checkInitialSession');
      }
    });

    return () => {
      isSubscribed = false;
      listener?.subscription.unsubscribe();
      tabSyncChannel.close(); // Cerrar el canal de sincronización
    };
  }, []);

  // Efecto para redirigir automáticamente después del login según el rol
  useEffect(() => {
    // Solo ejecutar si:
    // 1. Ya no está cargando
    // 2. Hay sesión activa
    // 3. Hay un rol válido
    // 4. El estado de autenticación es OK
    if (!loading && session && role && authStatus === 'ok' && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      
      console.log(`✅ Login detectado - Redirigiendo al home del rol ${role}`);
      
      // Redirigir según el rol
      if (role === 6 || role === 8) {
        // Admin o Staff -> Dashboard administrativo
        navigate('/', { replace: true });
      } else if (role === 7) {
        // Usuario Propietario -> Home de usuario
        navigate('/user/home', { replace: true });
      } else if (role === 9) {
        // Caballerizo -> Perfil del caballerizo
        navigate('/caballerizo/perfil', { replace: true });
      }
    }
  }, [loading, session, role, authStatus, navigate]);

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
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#34d399', secondary: '#1e293b' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#1e293b' } },
          duration: 3000,
        }}
      />
      <SignOutModal />
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
                        onClick={handleSignOut}
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
                  <MainLayout userRole={role} />
                ) : role === 7 ? (
                  <AppUser />
                ) : role === 9 ? (
                  <CaballerizoDashboard />    
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
    </>
  );
}
