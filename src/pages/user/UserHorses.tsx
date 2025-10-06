import React from "react";

const UserHorses = () => {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">Mi Caballo</h1>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl">
        <p><strong>Nombre:</strong> Relámpago</p>
        <p><strong>Raza:</strong> Pura Sangre Inglés</p>
        <p><strong>Edad:</strong> 7 años</p>
        <p><strong>Estado de Salud:</strong> Óptimo</p>
        <p><strong>Plan Nutricional:</strong> Balanceado - Alto rendimiento</p>
        <p><strong>Última revisión veterinaria:</strong> 20/09/2025</p>
      </div>
    </div>
  );
};

export default UserHorses;
