import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  Home,
  Menu,
  X,
  Video,
  Flag,
  DollarSign,
  User,
  Search
} from "lucide-react";

const menuItems = [
  { label: "Inicio", icon: <Home size={20} />, path: "/user/home" },
  { label: "Mi Caballo", icon: <Flag size={20} />, path: "/user/horses" },
  { label: "Cámara del Establo", icon: <Video size={20} />, path: "/user/camera" },
  { label: "Pagos y Estado Económico", icon: <DollarSign size={20} />, path: "/user/payments" },
  { label: "Perfil", icon: <User size={20} />, path: "/user/profile" },
];

const SidebarUser = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  const closeSidebar = () => setIsOpen(false);

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return menuItems;
    const lower = searchTerm.toLowerCase();
    return menuItems.filter((item) => item.label.toLowerCase().includes(lower));
  }, [searchTerm]);

  return (
    <>
      {/* Botón hamburguesa */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white bg-gray-800 rounded-md"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-700">
          <span className="text-2xl font-bold tracking-wide">MI ESPACIO</span>
        </div>

        {/* Buscar */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full py-2 pl-10 pr-4 bg-gray-900 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {/* Menú */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-6 py-3 rounded-md hover:bg-gray-900 transition ${
                    location.pathname === item.path ? "bg-gray-900 font-semibold" : ""
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto p-4 text-xs text-gray-400 border-t border-gray-700">
          &copy; {new Date().getFullYear()} Country Club - Usuario
          <button
            onClick={async () => await supabase.auth.signOut()}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md mt-4 w-full"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}
    </>
  );
};

export default SidebarUser;
