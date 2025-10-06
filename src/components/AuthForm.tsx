import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Eye, EyeOff } from 'lucide-react';
import MainLayout from './MainLayout';
import AppUser from '../pages/user/AppUser'; 

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<number | null>(null); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Helper: crea perfil en la tabla public.erp_user
  const createProfile = async (authUserId: string) => {
    console.log('ID de usuario que se va a insertar:', authUserId);
    const payload = {
      username: form.username,
      email: form.email,
      fk_idAuthUser: authUserId,
      fk_idOwner: 10,
      fk_idEmployee: 37,
      fk_idUserRole: 5, // 🔹 por defecto los nuevos usuarios serán normales
    };

    const { error: insertError } = await supabase.from('erp_user').insert([payload]);
    if (insertError) throw new Error(`Error al crear perfil: ${insertError.message}`);
  };

  // 🔹 Nuevo helper: obtener rol del usuario autenticado
  const getUserRole = async (authUserId: string) => {
    const { data, error } = await supabase
      .from('erp_user')
      .select('fk_idUserRole')
      .eq('fk_idAuthUser', authUserId)
      .single();

    if (error) throw new Error('No se pudo obtener el rol del usuario.');
    return data.fk_idUserRole;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // 🔹 LOGIN
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }

        // ✅ Obtener el usuario actual y su rol
        const user = data.user;
        if (!user) {
          setError('No se pudo autenticar el usuario.');
          return;
        }

        const userRole = await getUserRole(user.id);
        setRole(userRole); // Guardar rol en estado local

      } else {
        // 🔹 REGISTRO
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        const user = (data as any)?.user ?? (data as any)?.session?.user ?? null;
        if (user?.id) {
          await createProfile(user.id);
          setError('✅ Registro y perfil creados con éxito. ¡Inicia sesión!');
          setForm({ username: '', email: '', password: '' });
          setIsLogin(true);
        } else {
          setError(
            '🎉 Registro exitoso. Revisa tu correo para confirmar la cuenta. El perfil se creará al iniciar sesión tras la confirmación.'
          );
          setForm({ username: '', email: '', password: '' });
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Ocurrió un error inesperado.');
    }
  };

  if (role === 4) {
    return <MainLayout />; // 🔸 vista de admin
  }
  if (role === 5) {
    return <AppUser />; // 🔸 vista de usuario normal
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">
          {isLogin ? 'Country Club' : 'Crear Cuenta'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg text-gray-400">👤</span>
              <input
                type="text"
                name="username"
                placeholder="Nombre de usuario"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition"
              />
            </div>
          )}

          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg text-gray-400">📧</span>
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg text-gray-400">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-0 bg-transparent border-none transition duration-150"
            >
              {showPassword ? (
                <Eye className="w-5 h-5 text-gray-400" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          {isLogin && (
            <div className="text-right text-sm pt-1">
              <a href="/reset-password" className="text-blue-400 hover:text-blue-500 transition duration-150 font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 ease-in-out shadow-md mt-6"
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

        <button
          onClick={() => setIsLogin(!isLogin)}
          type="button"
          className="w-full mt-4 text-sm text-gray-400 hover:text-blue-400 bg-transparent border-none py-2 px-0 transition duration-200"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}
