// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import MainLayout from './components/MainLayout';
import AuthForm from './components/AuthForm';

export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Obtener sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios de sesión (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup listener
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Si hay sesión activa, mostrar dashboard
  if (session) {
    return <MainLayout />;
  }

  // Si no hay sesión, mostrar login
  return <AuthForm />;
}
