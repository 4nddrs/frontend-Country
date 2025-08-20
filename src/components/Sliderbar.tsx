import { useState } from "react";
import { Menu, X, Home, BarChart2, Settings } from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botón para móviles */}
      <button
        className="md:hidden p-2 text-gray-700"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full bg-gray-900 text-white p-4 w-64 transform 
        ${open ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
      >
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <nav className="space-y-4">
          <a href="#" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded">
            <Home size={20} /> Inicio
          </a>
          <a href="#" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded">
            <BarChart2 size={20} /> Estadísticas
          </a>
          <a href="#" className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded">
            <Settings size={20} /> Configuración
          </a>
        </nav>
      </aside>
    </>
  );
}
