// src/config/app.ts
// Configuración centralizada de la aplicación

/**
 * URL base de la aplicación
 * En desarrollo usa localhost, en producción usa el dominio de Vercel
 */
export const APP_URL = import.meta.env.PROD 
  ? 'https://hipicacc.vercel.app'
  : 'http://localhost:5173';

/**
 * URLs de redirección para flujos de autenticación
 */
export const AUTH_REDIRECT_URLS = {
  resetPassword: `${APP_URL}/reset-password`,
  emailConfirm: `${APP_URL}/`,
  signIn: `${APP_URL}/`,
} as const;

/**
 * Configuración de la aplicación
 */
export const APP_CONFIG = {
  name: 'Country Club',
  shortName: 'CC',
  description: 'Sistema de gestión Country Club',
} as const;
