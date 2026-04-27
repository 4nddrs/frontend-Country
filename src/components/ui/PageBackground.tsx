import React from 'react';

interface PageBackgroundProps {
  children: React.ReactNode;
}

const PageBackground = ({ children }: PageBackgroundProps) => (
  <div
    className="relative overflow-hidden rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-[#F8F4E3]"
    style={{ background: '#020d1a' }}
  >
    <style>{`
      @keyframes pbFloatA {
        0%,100% { transform: translate(0,0) scale(1); }
        33% { transform: translate(60px,-80px) scale(1.12); }
        66% { transform: translate(-40px,50px) scale(0.92); }
      }
      @keyframes pbFloatB {
        0%,100% { transform: translate(0,0) scale(1); }
        33% { transform: translate(-70px,90px) scale(1.18); }
        66% { transform: translate(80px,-50px) scale(0.88); }
      }
      @keyframes pbFloatC {
        0%,100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(50px,70px) scale(1.08); }
      }
      @keyframes pbFloatD {
        0%,100% { transform: translate(0,0) scale(1); }
        40% { transform: translate(-60px,-40px) scale(1.1); }
        80% { transform: translate(40px,60px) scale(0.95); }
      }
      @keyframes pbGlow {
        0%,100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      @keyframes pbShimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
    `}</style>

    {/* Orb 1 - top left */}
    <div style={{
      position: 'absolute', top: '-15%', left: '-8%',
      width: '50%', height: '70%',
      background: 'radial-gradient(ellipse at center, #0c2d5c28 0%, transparent 70%)',
      filter: 'blur(130px)',
      animation: 'pbFloatA 28s ease-in-out infinite, pbGlow 12s ease-in-out infinite',
      pointerEvents: 'none',
    }} />

    {/* Orb 2 - top right */}
    <div style={{
      position: 'absolute', top: '-10%', right: '-10%',
      width: '45%', height: '60%',
      background: 'radial-gradient(ellipse at center, #0f3d6e24 0%, transparent 70%)',
      filter: 'blur(140px)',
      animation: 'pbFloatB 34s ease-in-out infinite, pbGlow 14s ease-in-out infinite 3s',
      pointerEvents: 'none',
    }} />

    {/* Orb 3 - center */}
    <div style={{
      position: 'absolute', top: '40%', left: '25%',
      width: '55%', height: '50%',
      background: 'radial-gradient(ellipse at center, #1a3a6820 0%, transparent 70%)',
      filter: 'blur(150px)',
      animation: 'pbFloatC 20s ease-in-out infinite, pbGlow 10s ease-in-out infinite 1s',
      pointerEvents: 'none',
    }} />

    {/* Orb 4 - bottom left */}
    <div style={{
      position: 'absolute', bottom: '-10%', left: '-5%',
      width: '42%', height: '55%',
      background: 'radial-gradient(ellipse at center, #0e305e1e 0%, transparent 70%)',
      filter: 'blur(120px)',
      animation: 'pbFloatD 26s ease-in-out infinite, pbGlow 16s ease-in-out infinite 4s',
      pointerEvents: 'none',
    }} />

    {/* Orb 5 - bottom right */}
    <div style={{
      position: 'absolute', bottom: '-5%', right: '-8%',
      width: '40%', height: '50%',
      background: 'radial-gradient(ellipse at center, #0b274e1a 0%, transparent 70%)',
      filter: 'blur(110px)',
      animation: 'pbFloatA 32s ease-in-out infinite 6s, pbGlow 18s ease-in-out infinite 2s',
      pointerEvents: 'none',
    }} />

    <div className="relative z-10 p-6">{children}</div>
  </div>
);

export default PageBackground;
