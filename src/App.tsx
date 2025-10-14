// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import MainLayout from './components/MainLayout';
import AuthForm from './components/AuthForm';
import AppUser from './pages/user/AppUser';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);
  const [role, setRole] = useState<number | null>(null);

  useEffect(() => {
    // función que obtiene sesión y rol
    const bootstrap = async () => {
      try {
        console.log('🔄 Inicializando sesión...');
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session ?? null;
        setSession(currentSession);
        console.log('🟢 Sesión actual:', currentSession);

        if (!currentSession?.user?.id) {
          setLoading(false);
          return;
        }

        // Obtener rol e isapproved desde erp_user
        const userId = currentSession.user.id;
        console.log('🔎 Consultando erp_user para:', userId);

        const { data: erpUser, error } = await supabase
          .from('erp_user')
          .select('fk_idUserRole, isapproved')
          .eq('uid', userId)
          .maybeSingle(); // evita error si no existe

        if (error) {
          console.error('❌ Error consultando erp_user:', error);
        } else {
          console.log('📄 erp_user result:', erpUser);
          if (!erpUser) {
            // no hay registro en erp_user -> desalojamos sesión para evitar acceso
            console.warn('⚠️ Usuario sin registro en erp_user. Se cerrará la sesión.');
            await supabase.auth.signOut();
            setSession(null);
            setRole(null);
            alert('Tu usuario no está registrado en el sistema. Contacta al administrador.');
            setLoading(false);
            return;
          }

          // si existe pero no aprobado -> cerrar sesión
          if (erpUser.isapproved === false) {
            console.warn('⏳ Usuario encontrado pero NO aprobado. Cerrando sesión.');
            await supabase.auth.signOut();
            setSession(null);
            setRole(null);
            alert('Tu cuenta aún no fue aprobada por un administrador.');
            setLoading(false);
            return;
          }

          // en este punto está aprobado -> setear rol
          setRole(Number(erpUser.fk_idUserRole));
        }
      } catch (err) {
        console.error('❌ Error en bootstrap de sesión:', err);
        // no rompemos la app: mostramos login
        setSession(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    // listener para cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔔 onAuthStateChange event:', _event, session);
      setSession(session);

      // si hay sesión, reconsultar rol en erp_user
      if (session?.user?.id) {
        try {
          const { data: erpUser, error } = await supabase
            .from('erp_user')
            .select('fk_idUserRole, isapproved')
            .eq('uid', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('❌ Error consultando erp_user en listener:', error);
            setRole(null);
            return;
          }

          if (!erpUser) {
            console.warn('⚠️ Listener: usuario no existe en erp_user. Cerrando sesión.');
            await supabase.auth.signOut();
            setSession(null);
            setRole(null);
            alert('Tu usuario no está registrado en el sistema. Contacta al administrador.');
            return;
          }

          if (erpUser.isapproved === false) {
            console.warn('⏳ Listener: usuario no aprobado. Cerrando sesión.');
            await supabase.auth.signOut();
            setSession(null);
            setRole(null);
            alert('Tu cuenta aún no fue aprobada por un administrador.');
            return;
          }

          setRole(Number(erpUser.fk_idUserRole));
        } catch (err) {
          console.error('❌ Error en listener al consultar rol:', err);
          setRole(null);
        }
      } else {
        // no hay sesión -> limpiar datos
        setRole(null);
      }
    });

    return () => {
      // cleanup listener
      listener.subscription.unsubscribe();
    };
  }, []);

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

  // Si no hay sesión -> login
  if (!session) return <AuthForm />;

  // Si hay sesión y rol -> renderizar según rol
  if (role === 6) {
    return <MainLayout />;
  } else if (role === 7) {
    return <AppUser />;
  } else {
    // Rol desconocido -> desalojar por seguridad
    console.warn('⚠️ Rol desconocido:', role);
    // opcional: hacer signOut por si acaso
    supabase.auth.signOut().catch(() => {});
    return <AuthForm />;
  }
}
