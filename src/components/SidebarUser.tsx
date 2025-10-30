import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { handleSignOut } from "../utils/auth";
import {
  Home,
  Menu,
  X,
  Video,
  Flag,
  DollarSign,
  User,
  Search,
  LogOut,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const menuItems = [
  { label: "Inicio", icon: Home, path: "/user/home" },
  { label: "Mi Caballo", icon: Flag, path: "/user/horses" },
  { label: "Cámara del Establo", icon: Video, path: "/user/camera" },
  { label: "Pagos y Estado Económico", icon: DollarSign, path: "/user/payments" },
  { label: "Perfil", icon: User, path: "/user/profile" },
];

export default function SidebarUser() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return menuItems;
    const lower = searchTerm.toLowerCase();
    return menuItems.filter((item) => item.label.toLowerCase().includes(lower));
  }, [searchTerm]);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
  {/* Botón hamburguesa móvil (flotante) */}
  <div className="lg:hidden fixed top-4 right-4 z-60">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-600 hover:to-emerald-700"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar principal */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border-r border-slate-800/50 z-40 transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <h2 className="text-xl text-white tracking-wide font-semibold">
            MI ESPACIO
          </h2>
          {/* internal close removed to avoid duplicate controls on mobile; use floating button */}
        </div>

        {/* Buscador */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar..."
              className="pl-10 bg-slate-800/40 border-slate-700/40 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-inner"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="mb-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">Country Club</p>
            <p className="text-sm text-slate-300">Usuario</p>
          </div>

          <Button
            onClick={async () => {
              await handleSignOut();
              // No necesitamos window.location.reload()
              // El onAuthStateChange en App.tsx maneja la redirección automáticamente
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
