// src/utils/auth.ts
import { supabase } from '../supabaseClient';

/**
 * Cierra la sesión del usuario y limpia completamente el cache de Supabase
 * 
 * Esta función:
 * 1. Cierra la sesión en Supabase (llama a supabase.auth.signOut())
 * 2. Elimina TODOS los tokens de autenticación del localStorage
 * 3. Elimina TODOS los tokens de autenticación del sessionStorage
 * 
 * Esto resuelve el problema de que el token `sb-{project-ref}-auth-token` 
 * se quede guardado en el navegador después de cerrar sesión.
 * 
 * @example
 * ```tsx
 * import { handleSignOut } from '../utils/auth';
 * 
 * // En tu componente:
 * <button onClick={async () => {
 *   await handleSignOut();
 *   window.location.reload(); // Opcional: recargar para reflejar cambios
 * }}>
 *   Cerrar sesión
 * </button>
 * ```
 */
export const handleSignOut = async () => {
  console.log('🚪 Cerrando sesión y limpiando cache...');
  
  // 1. Cerrar sesión en Supabase
  await supabase.auth.signOut();
  
  // 2. Limpiar TODOS los tokens de Supabase del localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log('🗑️ Eliminado del cache:', key);
    }
  });
  
  // 3. Limpiar sessionStorage también (por si acaso)
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ Cache limpiado completamente');
};
