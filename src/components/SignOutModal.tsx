// src/components/SignOutModal.tsx
import { useEffect, useState } from 'react';

export default function SignOutModal() {
  const [visible, setVisible] = useState(false);
  const [dots, setDots] = useState('');
  const logoUrl = `${import.meta.env.BASE_URL}image/Logo9.png`;

  // Escuchar el evento global disparado por auth.ts
  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener('signout-start', show);
    return () => window.removeEventListener('signout-start', show);
  }, []);

  // Animación de puntos suspensivos
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 420);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop con blur */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

      {/* Tarjeta modal */}
      <div
        className="
          relative flex flex-col items-center gap-6
          w-[22rem] rounded-[2rem] px-10 py-10
          bg-gradient-to-b from-slate-800/90 to-slate-900/95
          border border-white/10
          shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_32px_64px_rgba(0,0,0,0.6),0_0_40px_rgba(48,217,151,0.08),0_0_60px_rgba(31,165,255,0.08)]
          backdrop-blur-2xl
          animate-fade-in-scale
        "
      >
        {/* Resplandor interno superior */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full bg-cyan-400/10 blur-2xl" />

        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 blur-xl scale-150" />
          <img
            src={logoUrl}
            alt="Country Club Hípica"
            className="relative h-20 w-20 rounded-[1.5rem] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)]"
          />
        </div>

        {/* Spinner */}
        <div className="relative flex items-center justify-center space-y-[-1.5rem]">
          {/* Anillo exterior giratorio */}
          <div className="absolute w-14 h-14 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400/40 animate-spin" />
          {/* Anillo interior giratorio inverso */}
          <div className="absolute w-9 h-9 rounded-full border-2 border-transparent border-b-emerald-400 border-l-emerald-400/40 animate-[spin_1.2s_linear_infinite_reverse]" />
          {/* Punto central */}
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </div>

        {/* Texto */}
        <div className="text-center space-y-2.5 mt-6">
          <p className="text-base font-semibold tracking-wide text-white/90">
            Cerrando sesión{dots}
          </p>
          <p className="text-xs tracking-[0.15em] text-slate-400 uppercase">
            Por favor espera un momento
          </p>
        </div>
      </div>

      {/* Animaciones personalizadas en style tag */}
      <style>{`
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0px); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes progress-bar {
          0%   { transform: translateX(-100%); width: 60%; }
          50%  { transform: translateX(80%);   width: 60%; }
          100% { transform: translateX(-100%); width: 60%; }
        }
        .animate-progress-bar {
          animation: progress-bar 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}