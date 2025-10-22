// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import MainLayout from './components/MainLayout';
import AuthForm from './components/AuthForm';
import AppUser from './pages/user/AppUser';

// Función auxiliar para obtener el rol (reutilizable)
const fetchUserRole = async (userId: string) => {
  const { data: erpUser, error } = await supabase
    .from('erp_user')
    .select('fk_idUserRole, isapproved')
    .eq('uid', userId) 
    .maybeSingle(); 
  
  if (error) {
    console.error('❌ Error consultando erp_user:', error);
    return { role: null, approved: false, error: error.message };
  }

  if (!erpUser) {
    console.warn('⚠️ Usuario sin registro en erp_user.');
    return { role: null, approved: false, error: 'Usuario no registrado.' };
  }
  
  if (erpUser.isapproved === false) {
    console.warn('⏳ Usuario encontrado pero NO aprobado.');
    return { role: null, approved: false, error: 'Cuenta pendiente de aprobación.' };
  }
  
  return { role: Number(erpUser.fk_idUserRole), approved: true, error: null };
};


export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [role, setRole] = useState<number | null>(null);

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
          
          if (result.error) {
            console.error("❌ Error al validar rol en checkInitialSession:", result.error);
            // Esto dispara el SIGNED_OUT, el listener lo manejará
            await supabase.auth.signOut(); 
          } else {
            setRole(result.role);
          }
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
    
    // ... (El Listener onAuthStateChange sigue aquí)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // ... (El listener es idéntico a tu versión actual)
      // ... (El listener maneja SIGNED_IN, SIGNED_OUT, etc.)
    });

    // ... (Retorno del useEffect)
  }, []);

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

  // 1. Si no hay sesión -> Login
  if (!session) return <AuthForm />;

  // 2. Si hay sesión y rol -> renderizar según rol
  if (role === 6 || role === 8) {
    return <MainLayout />;
  } else if (role === 7) {
    return <AppUser />;
  } else {
    // Rol desconocido o nulo -> cerrar sesión
    console.warn('⚠️ Rol desconocido/nulo:', role);
    supabase.auth.signOut().catch(() => {});
    return <AuthForm />;
  }
}