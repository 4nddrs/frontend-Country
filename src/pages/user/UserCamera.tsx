import { Video, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { useState } from 'react';
import UserHeader from '../../components/UserHeader';

interface CamaraEstabloProps {}

export function UserCamera(_: CamaraEstabloProps) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <UserHeader title="Cámara del Establo" />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Main Camera Feed */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700/50 backdrop-blur-sm">
          <div className="p-4 md:p-6">
            {/* Video Container */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
              {/* Mock Video Feed */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Video className="w-16 h-16 text-slate-700 mx-auto" />
                  <p className="text-slate-500 text-sm">Vista previa de cámara (mock)</p>
                </div>
              </div>

              {/* Live Indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white">EN VIVO</span>
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
                <button className="p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors">
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 text-center">
              Aquí se mostrará el streaming en tiempo real del establo de tu caballo.
            </p>
          </div>
        </Card>

        {/* Camera Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-2">Estado de la cámara</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-sm text-white">Activa</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-2">Ubicación</p>
              <p className="text-sm text-white">Box A-12</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-2">Calidad de conexión</p>
              <p className="text-sm text-cyan-400">HD 1080p</p>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 backdrop-blur-sm">
          <div className="p-4 md:p-6">
            <h3 className="text-sm text-slate-400 mb-4">Información</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Horario de transmisión</span>
                <span className="text-sm text-white">24/7</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Última actualización</span>
                <span className="text-sm text-cyan-400">Hace 2 minutos</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-300">Temperatura del establo</span>
                <span className="text-sm text-white">22°C</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

