import React from "react";
import { Flag, Video, DollarSign } from "lucide-react";

const UserHome = () => {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">
        Bienvenido
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Caballo */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 flex items-center gap-4">
          <Flag size={32} className="text-teal-400" />
          <div>
            <h2 className="text-xl font-semibold">Relámpago</h2>
            <p className="text-gray-400 text-sm">Pura Sangre Inglés - 7 años</p>
          </div>
        </div>

        {/* Cámara */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 flex items-center gap-4">
          <Video size={32} className="text-teal-400" />
          <div>
            <h2 className="text-xl font-semibold">Cámara activa</h2>
            <p className="text-gray-400 text-sm">Monitoreo en tiempo real</p>
          </div>
        </div>

        {/* Pagos */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 flex items-center gap-4">
          <DollarSign size={32} className="text-teal-400" />
          <div>
            <h2 className="text-xl font-semibold">Estado financiero</h2>
            <p className="text-gray-400 text-sm">Último pago: 05/10/2025</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h2 className="text-2xl font-semibold mb-4 text-teal-400">
          Noticias del Club
        </h2>
        <ul className="space-y-2 text-gray-300">
          <li>🏇 Nuevo torneo ecuestre el 20 de octubre.</li>
          <li>🌿 Se renovaron las áreas verdes del establo principal.</li>
          <li>💧 Mantenimiento del sistema de agua el próximo fin de semana.</li>
        </ul>
      </div>
    </div>
  );
};

export default UserHome;
