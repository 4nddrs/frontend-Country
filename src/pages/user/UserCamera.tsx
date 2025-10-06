import React from "react";

const UserCamera = () => {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">Cámara del Establo</h1>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 text-center">
        <div className="bg-black rounded-md w-full h-96 flex items-center justify-center text-gray-500">
          🎥 Vista previa de cámara (mock)
        </div>
        <p className="mt-4 text-gray-400">
          Aquí se mostrará el streaming en tiempo real del establo de tu caballo.
        </p>
      </div>
    </div>
  );
};

export default UserCamera;
