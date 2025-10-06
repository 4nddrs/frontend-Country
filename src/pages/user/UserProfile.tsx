import React from "react";

const UserProfile = () => {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">Mi Perfil</h1>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700 space-y-4">
        <p><strong>Nombre:</strong> Hugo Ballivián</p>
        <p><strong>Email:</strong> hugo@ejemplo.com</p>
        <p><strong>Teléfono:</strong> +591 71234567</p>
        <p><strong>Propietario desde:</strong> 2021</p>
      </div>
    </div>
  );
};

export default UserProfile;
