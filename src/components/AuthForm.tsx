// src/components/AuthForm.tsx
import React, { useState } from 'react';
import { supabase, supabaseAdmin } from '../supabaseClient';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import MainLayout from './MainLayout';
import AppUser from '../pages/user/AppUser';

// Define el ícono de logo verde (como un componente simple)
const LogoIcon = () => (
  <div className="p-2 bg-emerald-500 rounded-lg shadow-lg">
    <svg 
      className="w-6 h-6 text-white" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Icono simple, puedes reemplazarlo con el logo real */}
      <path d="M12 2l10 5.5v11L12 22 2 17.5v-11L12 2z" /> 
    </svg>
  </div>
);

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // 🔹 LOGIN
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
          setTimeout(() => {
            window.location.reload(); 
        }, 100);
        
      } else {
        // 🔹 REGISTRO (pendiente de aprobación)
        const { data, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: form.email,
          password: form.password,
          email_confirm: false,
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        const user = data.user;

        if (user?.id) {
          // Asignar siempre el rol "user" con id = 7
          const roleId = 7;

          const { error: insertError } = await supabaseAdmin.from('erp_user').insert([
            {
              uid: user.id,
              username: form.username,
              email: form.email,
              isapproved: false, // pendiente de aprobación
              fk_idUserRole: roleId,
              approved_at: null,
            },
          ]);

          if (insertError) throw new Error(insertError.message);

          setError('✅ Tu cuenta fue creada y está pendiente de aprobación por un administrador.');
          setForm({ username: '', email: '', password: '' });
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error inesperado.');
    }
  };

  // 🔸 Mostrar vistas según rol
 

  // 🔸 Formulario base
  return (
    // Fondo con gradiente oscuro para simular el diseño
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4" 
         style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 150, 136, 0.08) 0%, rgba(6, 18, 25, 1) 40%)' }}>
      
      {/* Contenedor del formulario - Estilo más oscuro y redondeado */}
      <div className="bg-[#0b141a] p-8 rounded-xl shadow-2xl w-full max-w-sm">
        
        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center mb-8">
          <LogoIcon /> {/* El ícono verde */}
          <h2 className="text-3xl font-bold mt-4 text-white">
            Country Club
          </h2>
          {isLogin && (
            <p className="text-sm text-gray-400 mt-1">
              Bienvenido al panel de gestión
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campo de Nombre de usuario (solo en registro) */}
          {!isLogin && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Nombre de usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#111c24] border border-[#1f3747] rounded-lg text-white
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 transition placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {/* Campo de Correo electrónico */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-[#111c24] border border-[#1f3747] rounded-lg text-white
                focus:outline-none focus:ring-2 focus:ring-emerald-500 transition placeholder-gray-500"
              />
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-12 py-3 bg-[#111c24] border border-[#1f3747] rounded-lg text-white
                focus:outline-none focus:ring-2 focus:ring-emerald-500 transition placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-emerald-400 bg-transparent border-none"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="text-right text-sm">
              <a 
                href="/reset-password" 
                // ✨ CAMBIO: Aseguramos que el color sea emerald-400 aquí
                className="text-emerald-400 hover:text-emerald-300 transition duration-150 font-medium"
              >
                ¿Olvidaste la contraseña?
              </a>
            </div>
          )}

  
          <button
            type="submit"
            
            className={`w-full ${isLogin ? 'mt-0' : 'mt-4'} bg-emerald-500 hover:bg-emerald-600  font-semibold py-3 rounded-lg transition duration-200 ease-in-out shadow-md shadow-emerald-500/30`}
          >
            {isLogin ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        {error && (
          <div
            className={`mt-6 p-3 rounded-lg text-sm text-center font-medium ${
              error.startsWith('✅') || error.startsWith('🎉')
                ? 'bg-green-700 text-white'
                : 'bg-red-700 text-white'
            }`}
          >
            {error}
          </div>
        )}

        {/* Enlace para cambiar entre Login y Registro */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          {isLogin ? (
            <span>
              ¿No tienes cuenta?{' '}
              <a
                onClick={() => setIsLogin(false)}
                // ✨ CAMBIO: Aseguramos que el color sea emerald-400 aquí
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Regístrate
              </a>
            </span>
          ) : (
            <span>
              ¿Ya tienes cuenta?{' '}
              <a
                onClick={() => {
                  setIsLogin(true);
                  window.location.reload();
                }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Inicia sesión
              </a>
            </span>
          )}
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-8">
          COPYRIGHT 2025 COUNTRY CLUB HÍPICA
        </p>
      </div>
    </div>
  );
}