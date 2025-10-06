import React from "react";

const UserPayments = () => {
  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">Mis Pagos y Estado Económico</h1>
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-700">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-600">
              <th className="p-3">Fecha</th>
              <th className="p-3">Concepto</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-slate-700">
              <td className="p-3">05/10/2025</td>
              <td className="p-3">Mantenimiento mensual</td>
              <td className="p-3 text-green-400">$250</td>
              <td className="p-3 text-emerald-400">Pagado</td>
            </tr>
            <tr className="hover:bg-slate-700">
              <td className="p-3">01/09/2025</td>
              <td className="p-3">Veterinario</td>
              <td className="p-3 text-red-400">$120</td>
              <td className="p-3 text-yellow-400">Pendiente</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserPayments;
