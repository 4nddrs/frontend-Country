// src/utils/auth.ts
import { supabase } from '../supabaseClient';

// Variable para prevenir múltiples ejecuciones simultáneas
let isSigningOut = false;

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
  console.log('🚪 Cerrando sesión y limpiando cache...');
  
  try {
    // 1. Cerrar sesión en Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Error al cerrar sesión en Supabase:', error);
    }
    
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
    
    // 4. Forzar redirección a la página principal
    // Usamos replace para que no se pueda volver atrás con el botón del navegador
    window.location.replace('/');
    
  } catch (error) {
    console.error('❌ Error inesperado al cerrar sesión:', error);
    // Incluso si hay error, limpiar y redirigir
    window.location.replace('/');
  } finally {
    // Resetear el flag después de un breve delay
    setTimeout(() => {
      isSigningOut = false;
    }, 1000);
  }
};
