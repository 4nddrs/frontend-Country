// src/utils/auth.ts
import { supabase } from '../supabaseClient';

// Variable para prevenir múltiples ejecuciones simultáneas
let isSigningOut = false;
const SIGN_OUT_TIMEOUT_MS = 6000;

const SUPABASE_AUTH_KEY_PATTERNS = [
  /^sb-.*-auth-token$/,
  /^sb-auth-token$/,
  /^supabase\.auth\.token$/,
];

const isSupabaseAuthKey = (key: string) =>
  SUPABASE_AUTH_KEY_PATTERNS.some((pattern) => pattern.test(key));

const clearSupabaseAuthStorage = () => {
  Object.keys(localStorage).forEach((key) => {
    if (isSupabaseAuthKey(key)) {
      localStorage.removeItem(key);
      console.log('🗑️ Eliminado del localStorage:', key);
    }
  });

  Object.keys(sessionStorage).forEach((key) => {
    if (isSupabaseAuthKey(key)) {
      sessionStorage.removeItem(key);
      console.log('🗑️ Eliminado del sessionStorage:', key);
    }
  });
};

const signOutWithTimeout = async () => {
  const timeoutPromise = new Promise<{ error: Error }>((resolve) => {
    setTimeout(() => {
      resolve({
        error: new Error(`Timeout al cerrar sesión (${SIGN_OUT_TIMEOUT_MS}ms)`),
      });
    }, SIGN_OUT_TIMEOUT_MS);
  });

  const signOutPromise = supabase.auth.signOut({ scope: 'local' });
  const result = await Promise.race([signOutPromise, timeoutPromise]);
  return result;
};

/**
 * Cierra la sesión del usuario y limpia completamente el cache de Supabase
 * 
 * Esta función:
 * 1. Previene múltiples ejecuciones simultáneas
 * 2. Cierra la sesión en Supabase (llama a supabase.auth.signOut())
 * 3. Elimina TODOS los tokens de autenticación del localStorage
 * 4. Elimina TODOS los tokens de autenticación del sessionStorage
 * 5. Fuerza la redirección a la página principal
 * 
 * Esto resuelve el problema de que el token `sb-{project-ref}-auth-token` 
 * se quede guardado en el navegador después de cerrar sesión.
 * 
 * @example
 * ```tsx
 * import { handleSignOut } from '../utils/auth';
 * 
 * // En tu componente:
 * <button onClick={handleSignOut}>
 *   Cerrar sesión
 * </button>
 * ```
 */
export const handleSignOut = async () => {
  // Prevenir múltiples ejecuciones
  if (isSigningOut) {
    console.log('⚠️ Ya se está cerrando sesión, por favor espera...');
    return;
  }

  isSigningOut = true;
  window.dispatchEvent(new CustomEvent('signout-start')); 
  console.log('🚪 Cerrando sesión y limpiando cache...');
  const baseUrl = import.meta.env.BASE_URL || '/';
  
  try {
    // 1. Cerrar sesión en Supabase
    // Si Supabase tarda demasiado, continuamos con logout local para no bloquear la UI.
    const { error } = await signOutWithTimeout();
    if (error) {
      console.warn('⚠️ No se confirmó signOut remoto, continuando con logout local:', error.message);
    }
    
    // 2. Limpiar tokens de autenticación en local/session storage
    clearSupabaseAuthStorage();
    
    console.log('✅ Cache limpiado completamente');
    
    // 3. Forzar redirección a la base configurada de la app
    // Usamos replace para que no se pueda volver atrás con el botón del navegador
    window.location.replace(baseUrl);
    
  } catch (error) {
    console.error('❌ Error inesperado al cerrar sesión:', error);
    // Incluso si hay error, limpiar y redirigir
    clearSupabaseAuthStorage();
    window.location.replace(baseUrl);
  } finally {
    // Resetear el flag después de un breve delay
    setTimeout(() => {
      isSigningOut = false;
    }, 1000);
  }
};
