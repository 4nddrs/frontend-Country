import { User, Mail, Phone, MapPin, Edit2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import UserHeader from '../../components/UserHeader';

interface PerfilProps {}

export function UserProfile(_: PerfilProps) {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Mi Perfil" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl text-white mb-1">Hugo Bolívar</h2>
                  <p className="text-sm text-slate-400">Propietario desde 2021</p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/20 w-full sm:w-auto">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar perfil
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="text-sm text-white break-all">hugo@ejemplo.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Teléfono</p>
                    <p className="text-sm text-white">+591 71234567</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Propietario desde</p>
                    <p className="text-sm text-white">7051</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Membership Info */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg text-white mb-6">Información de membresía</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Tipo de membresía</span>
                <span className="text-sm text-cyan-400">Premium</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Fecha de inicio</span>
                <span className="text-sm text-white">01/03/2021</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Estado</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-emerald-400">Activa</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Renovación próxima</span>
                <span className="text-sm text-white">01/03/2026</span>
              </div>
            </div>
          </div>
        </Card>

        {/* My Horses */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg text-white mb-6">Mis caballos</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors cursor-pointer">
                <div>
                  <p className="text-sm text-white mb-1">Relámpago</p>
                  <p className="text-xs text-slate-400">Pura Sangre Inglés · Box A-12</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-400">Activo</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg text-white mb-6">Preferencias</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Notificaciones por email</span>
                <span className="text-sm text-cyan-400">Activadas</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Idioma</span>
                <span className="text-sm text-white">Español</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Zona horaria</span>
                <span className="text-sm text-white">GMT-4</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
