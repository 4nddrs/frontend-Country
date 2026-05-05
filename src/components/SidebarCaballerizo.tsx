import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { handleSignOut } from "../utils/auth";
import {
  ClipboardList,
  LogOut,
  Menu,
  Trophy,
  User,
  X,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const menuItems = [
  { label: "Perfil", icon: User, path: "/caballerizo/perfil" },
  {
    label: "Tareas asignadas",
    icon: ClipboardList,
    path: "/caballerizo/tareas",
  },
  {
    label: "Caballos asignados",
    icon: Trophy,
    path: "/caballerizo/caballos",
  },
];

export default function SidebarCaballerizo() {
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
      {/* Boton hamburguesa movil (flotante) */}
      <div className="lg:hidden fixed top-4 right-4 z-60">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/15 transition-all hover:from-emerald-600 hover:to-emerald-700"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop movil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar principal */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border-r border-slate-800/50 z-40 transition-transform duration-300 flex flex-col shadow-[0_0_24px_rgba(16,185,129,0.12)] ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <h2 className="text-xl text-white tracking-wide font-semibold">
            Área Caballerizo
          </h2>
        </div>

        {/* ROL BADGE */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest
                        bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 
                        text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)] backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Caballerizo
          </span>
        </div>

        {/* Buscador */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="relative">
            <Input
              placeholder="Buscar seccion..."
              className="pl-4 bg-slate-800/40 border-slate-700/40 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/40"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {/* Navegacion */}
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
                      ? "bg-gradient-to-r from-emerald-500/16 to-emerald-600/16 text-emerald-300 border border-emerald-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/35"
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
          <Button
            onClick={handleSignOut}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/15"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  );
}



