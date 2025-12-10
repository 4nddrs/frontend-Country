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

const menuItems = [
  { label: "Inicio", icon: Home, path: "/user/home" },
  { label: "Mi Caballo", icon: Flag, path: "/user/horses" },
  { label: "Cámara del Establo", icon: Video, path: "/user/camera" },
  { label: "Pagos y Estado Económico", icon: DollarSign, path: "/user/payments" },
  { label: "Perfil", icon: User, path: "/user/profile" },
];

const searchWrapperClassName = "relative px-6 pb-4 translate-y-[-1.5rem]";
const navSectionsClassName = "space-y-5";

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
      {/* MOBILE TOGGLE */}
      <div className="absolute left-4 top-4 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-2xl bg-sidebar-gradient px-4 py-2 text-sm font-semibold text-white shadow-sidebar-pill transition hover:bg-sidebar-surface/80"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
          <span>{isOpen ? 'Cerrar' : 'Menu'}</span>
        </button>
      </div>

      {/* Backdrop móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[19rem] max-w-[20rem] transform flex-col px-3 py-5 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-sidebar-gradient text-white shadow-sidebar-inner ring-1 ring-white/5 shadow-[0_0_60px_rgba(48,217,151,0.25),0_0_90px_rgba(31,165,255,0.25)]">
          <div className="pointer-events-none absolute inset-[-32px] opacity-95">
            <div className="h-full w-full bg-sidebar-glow" />
          </div>

          <div className="relative flex flex-col items-center scale-[0.8] translate-y-[-2rem]">
            {/* LOGO */}
            <div className="flex justify-center px-8 pb-2 pt-3">
              <img
                src={logoUrl}
                alt="Country Club Hipica"
                className="h-[9rem] w-[9rem] rounded-[38px] object-cover shadow-sidebar-pill"
              />
            </div>

            {/* TEXTO */}
            <div className="text-center">
              <h2 className="text-[1.6rem] font-semibold tracking-[0.25em] bg-gradient-to-r from-[#F8F4E3] via-[#EED9A5] to-[#C9A34E] bg-clip-text text-transparent leading-tight">
                COUNTRY CLUB
              </h2>
              <h2 className="text-[0.65rem] font-medium tracking-[0.22em] bg-gradient-to-r from-[#F3EAD0] via-[#E7CA84] to-[#C8A13A] bg-clip-text text-transparent mt-1">
                COCHABAMBA
              </h2>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className={searchWrapperClassName}>
            <div className="group relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar opción..."
                className="w-full rounded-[18px] border border-white/15 bg-white/5 py-3 pl-12 pr-5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] outline-none transition placeholder:text-white/50 focus:border-[#3CC9F6] focus:bg-white/10 focus:shadow-[0_0_20px_rgba(60,201,246,0.45)]"
              />
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sidebar-muted transition group-focus-within:text-sidebar-active"
              />
            </div>
          </div>

          <nav className="relative flex-1 overflow-y-auto px-0 pb-8 soft-scrollbar">
            <div className={navSectionsClassName}>
              <div className="rounded-[32px] border border-white/10 bg-white/5 px-4 py-5 backdrop-blur-2xl shadow-inner shadow-black/20">
                <ul className="space-y-3">
                  {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={closeSidebar}
                          className={`group flex items-center gap-3.5 rounded-[18px] px-4 py-3 font-medium transition-all ${
                            isActive
                              ? "bg-sidebar-active text-white shadow-sidebar-pill"
                              : "text-sidebar-muted hover:bg-sidebar-surface hover:text-white"
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </nav>

          {/* FOOTER - Perfil de Usuario */}
          <div className="relative border-t border-white/10 bg-sidebar-surface/30 px-5 py-5">
            {!loading && ownerData && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3 backdrop-blur-sm border border-white/10">
                {ownerData.ownerPhoto ? (
                  <img 
                    src={decodeBackendImage(ownerData.ownerPhoto)} 
                    alt={ownerData.name || ownerData.FirstName || 'Owner'} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/40 shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {(ownerData.name || ownerData.FirstName || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-semibold truncate">
                    {ownerData.name || `${ownerData.FirstName || ''} ${ownerData.SecondName || ''}`.trim()}
                  </p>
                  <p className="text-xs text-sidebar-muted">Propietario</p>
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="group flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-red-500/90 to-red-600/90 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-red-600 hover:to-red-700 hover:shadow-red-500/30"
            >
              <LogOut size={18} className="transition group-hover:scale-110" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
