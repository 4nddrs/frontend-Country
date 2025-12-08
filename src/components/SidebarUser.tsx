import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { handleSignOut } from "../utils/auth";
import { useCurrentUser, useOwnerData } from "../hooks/useUserData";
import { decodeBackendImage } from "../utils/imageHelpers";
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
  const logoUrl = `${import.meta.env.BASE_URL}image/Logo9.png`;

  // Usar hooks optimizados con React Query
  const { data: user } = useCurrentUser();
  const { data: ownerData, isLoading: loading } = useOwnerData(user?.id);

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return menuItems;
    const lower = searchTerm.toLowerCase();
    return menuItems.filter((item) => item.label.toLowerCase().includes(lower));
  }, [searchTerm]);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Botón hamburguesa móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white border border-slate-700/50 shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Backdrop móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar principal */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#0A0F1E] z-50 transition-transform duration-300 flex flex-col shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header con Logo */}
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl} 
              alt="Logo Country Club" 
              className="w-10 h-10 object-contain"
            />
            <h2 className="text-lg text-white font-bold tracking-wide">
              MI ESPACIO
            </h2>
          </div>
        </div>

        {/* Buscador */}
        <div className="px-4 py-3 border-b border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar..."
              className="pl-9 h-9 bg-slate-900/50 border-slate-700/50 text-slate-200 text-sm placeholder:text-slate-500 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500 pl-2.5"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50 hover:pl-2.5 border-l-2 border-transparent"
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-cyan-400' : ''
                  }`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer con perfil de usuario */}
        <div className="p-4 border-t border-slate-800/50 space-y-3">
          {/* Perfil del Owner */}
          {!loading && ownerData && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
              {ownerData.ownerPhoto ? (
                <img 
                  src={decodeBackendImage(ownerData.ownerPhoto)} 
                  alt={ownerData.name || ownerData.FirstName || 'Owner'} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                  {(ownerData.name || ownerData.FirstName || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">
                  {ownerData.name || `${ownerData.FirstName || ''} ${ownerData.SecondName || ''}`.trim()}
                </p>
                <p className="text-xs text-slate-400">Propietario</p>
              </div>
            </div>
          )}

          {/* Botón Cerrar Sesión */}
          <Button
            onClick={async () => {
              await handleSignOut();
              window.location.href = '/login';
            }}
            className="w-full h-10 bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-lg hover:shadow-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
