import React from 'react';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  className?: string;
  contentClass?: string;
}

const AnimatedBackground = ({ children, className = '', contentClass = 'p-5' }: AnimatedBackgroundProps) => (
  <div className={`relative overflow-hidden ${className}`} style={{ background: '#020c1b' }}>
    <style>{`
      @keyframes floatA {
        0%,100% { transform: translate(0,0) scale(1); }
        33% { transform: translate(40px,-60px) scale(1.15); }
        66% { transform: translate(-30px,40px) scale(0.9); }
      }
      @keyframes floatB {
        0%,100% { transform: translate(0,0) scale(1); }
        33% { transform: translate(-50px,70px) scale(1.2); }
        66% { transform: translate(60px,-40px) scale(0.85); }
      }
      @keyframes floatC {
        0%,100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(30px,50px) scale(1.1); }
      }
      @keyframes glowPulse {
        0%,100% { opacity: 0.55; }
        50% { opacity: 0.9; }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
    `}</style>

    {/* Orb A */}
    <div style={{
      position: 'absolute', top: '-20%', left: '-10%',
      width: '55%', height: '180%',
      background: 'radial-gradient(ellipse at center, #1e40af44 0%, transparent 70%)',
      filter: 'blur(80px)',
      animation: 'floatA 18s ease-in-out infinite, glowPulse 6s ease-in-out infinite',
      pointerEvents: 'none',
    }} />

    {/* Orb B */}
    <div style={{
      position: 'absolute', top: '30%', right: '-15%',
      width: '50%', height: '160%',
      background: 'radial-gradient(ellipse at center, #2563eb3a 0%, transparent 70%)',
      filter: 'blur(90px)',
      animation: 'floatB 22s ease-in-out infinite, glowPulse 8s ease-in-out infinite 2s',
      pointerEvents: 'none',
    }} />

    {/* Orb C */}
    <div style={{
      position: 'absolute', bottom: '-10%', left: '30%',
      width: '45%', height: '120%',
      background: 'radial-gradient(ellipse at center, #0ea5e930 0%, transparent 70%)',
      filter: 'blur(70px)',
      animation: 'floatC 14s ease-in-out infinite, glowPulse 5s ease-in-out infinite 1s',
      pointerEvents: 'none',
    }} />

    <div className={`relative z-10 ${contentClass}`}>{children}</div>
  </div>
);

export default AnimatedBackground;
