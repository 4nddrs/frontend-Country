import { Heart, Calendar, Activity, Apple } from 'lucide-react';
import { Card } from '../../components/ui/card';
import UserHeader from '../../components/UserHeader';

interface MiCaballoProps {}

export function UserHorses(_: MiCaballoProps) {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <UserHeader title="Mi Caballo" />

      <div className="max-w-4xl mx-auto space-y-5">
        {/* Main Info Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl md:text-2xl text-cyan-400">Relámpago</h2>
              <Heart className="w-6 h-6 text-slate-400 hover:text-red-400 cursor-pointer transition-colors" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Nombre</p>
                <p className="text-white">Relámpago</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Raza</p>
                <p className="text-white">Pura Sangre Inglés</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Edad</p>
                <p className="text-white">7 años</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Estado de Salud</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-emerald-400">Óptimo</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {/* Plan Nutricional */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
            <div className="p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                <Apple className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Plan Nutricional</p>
              <p className="text-sm text-white">Balanceado</p>
              <p className="text-xs text-cyan-400 mt-1">Alto rendimiento</p>
            </div>
          </Card>

          {/* Última Revisión */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
            <div className="p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Última revisión</p>
              <p className="text-sm text-white">20/09/2025</p>
              <p className="text-xs text-slate-400 mt-1">Veterinaria</p>
            </div>
          </Card>

          {/* Actividad */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
            <div className="p-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 mb-2">Actividad</p>
              <p className="text-sm text-white">Regular</p>
              <p className="text-xs text-emerald-400 mt-1">5 días/semana</p>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-4 md:p-6">
            <h3 className="text-sm text-slate-400 mb-4">Información adicional</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Próxima vacunación</span>
                <span className="text-sm text-cyan-400">15/11/2025</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Entrenador asignado</span>
                <span className="text-sm text-white">Carlos Méndez</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Box número</span>
                <span className="text-sm text-white">A-12</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
