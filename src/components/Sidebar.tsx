import { type ReactNode, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { handleSignOut } from '../utils/auth';
import {
  Home,
  Menu,
  X,
  ClipboardList,
  User,
  Briefcase,
  Package,
  Book,
  Layers,
  Flag,
  List,
  Calendar,
  Search,
  LogOut,
  Trophy,
  DollarSign,
  Syringe,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

type MenuItem = {
  label: string;
  icon: ReactNode;
  path: string;
  roles: number[];
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const ADMIN_ROLES = [6, 8];
const CABALLERIZO_ROLES = [9];
const VETERINARIO_ROLES = [10]; // Nuevo rol para veterinarios

// Sección: Caballos
const caballosSection: MenuItem[] = [
  { label: 'Caballos', icon: <Flag size={18} />, path: '/horses', roles: ADMIN_ROLES },
  { label: 'Razas', icon: <Layers size={18} />, path: '/races', roles: ADMIN_ROLES },
  { label: 'Planes Nutricionales', icon: <Book size={18} />, path: '/nutritional-plans', roles: ADMIN_ROLES },
  { label: 'Detalles Plan Nutricional', icon: <List size={18} />, path: '/nutritional-plan-details', roles: ADMIN_ROLES },
  { label: 'Asignacion de Caballos', icon: <ClipboardList size={18} />, path: '/HorseAssignmentsManagement', roles: ADMIN_ROLES },
  { label: 'Atención a Caballos', icon: <Trophy size={18} />, path: '/attentionHorses', roles: ADMIN_ROLES },
];

// Sección: Empleados
const empleadosSection: MenuItem[] = [
  { label: 'Empleados', icon: <User size={18} />, path: '/employee', roles: ADMIN_ROLES },
  { label: 'Posiciones', icon: <Briefcase size={18} />, path: '/positions', roles: ADMIN_ROLES },
  { label: 'Ausencias de Empleados', icon: <Calendar size={18} />, path: '/employee-absences', roles: ADMIN_ROLES },
  { label: 'Tipos de Turno', icon: <Calendar size={18} />, path: '/shiftTypes', roles: ADMIN_ROLES },
  { label: 'Empleados por Turno', icon: <Calendar size={18} />, path: '/shiftEmployees', roles: ADMIN_ROLES },
  { label: 'Turnos de Empleados', icon: <Calendar size={18} />, path: '/EmployeesShiftem', roles: ADMIN_ROLES },
  { label: 'Categorias de Tareas', icon: <List size={18} />, path: '/task-categories', roles: ADMIN_ROLES },
  { label: 'Tareas', icon: <Calendar size={18} />, path: '/tasks', roles: ADMIN_ROLES },
];

// Sección: Propietarios
const propietariosSection: MenuItem[] = [
  { label: 'Propietarios', icon: <Users size={18} />, path: '/owners', roles: ADMIN_ROLES },
  { label: 'Usuarios Pendientes', icon: <User size={18} />, path: '/PendingUsers', roles: ADMIN_ROLES },
  { label: 'Reportes Mensuales de Propietario', icon: <ClipboardList size={18} />, path: '/OwnerReportMonth', roles: ADMIN_ROLES },
];

// Sección: Finanzas
const finanzasSection: MenuItem[] = [
  { label: 'Ingresos', icon: <DollarSign size={18} />, path: '/Income', roles: ADMIN_ROLES },
  { label: 'Egresos', icon: <DollarSign size={18} />, path: '/Expenses', roles: ADMIN_ROLES },
  { label: 'Pagos de Salarios', icon: <DollarSign size={18} />, path: '/SalaryPayments', roles: ADMIN_ROLES },
  { label: 'Pago de Propinas', icon: <DollarSign size={18} />, path: '/TipPayment', roles: ADMIN_ROLES },
  { label: 'Control Total', icon: <ClipboardList size={18} />, path: '/TotalControl', roles: ADMIN_ROLES },
];

// Sección: Salud y Sanidad
const saludSection: MenuItem[] = [
  { label: 'Medicamentos', icon: <Syringe size={18} />, path: '/medicines', roles: [...ADMIN_ROLES, ...VETERINARIO_ROLES] },
  { label: 'Gestión del Plan Sanitario (Vacunas)', icon: <Syringe size={18} />, path: '/VaccinationPlan', roles: [...ADMIN_ROLES, ...VETERINARIO_ROLES] },
  { label: 'Ejecución del Plan Sanitario (Vacunas)', icon: <Syringe size={18} />, path: '/VaccinationPlanApplication', roles: [...ADMIN_ROLES, ...VETERINARIO_ROLES] },
  { label: 'Procedimientos Sanitarios Programados', icon: <Syringe size={18} />, path: '/scheduled-procedures', roles: [...ADMIN_ROLES, ...VETERINARIO_ROLES] },
  { label: 'Ejecución de Procedimientos Sanitarios', icon: <Syringe size={18} />, path: '/application-procedures', roles: [...ADMIN_ROLES, ...VETERINARIO_ROLES] },
];

// Sección: Alimentación
const alimentacionSection: MenuItem[] = [
  { label: 'Proveedores de Comida', icon: <Package size={18} />, path: '/food-providers', roles: ADMIN_ROLES },
  { label: 'Stock de Comida', icon: <ClipboardList size={18} />, path: '/food-stocks', roles: ADMIN_ROLES },
  { label: 'Control de Alfalfa', icon: <Package size={18} />, path: '/alfalfa-control', roles: ADMIN_ROLES },
  { label: 'Control de Consumo de Alfalfa', icon: <Package size={18} />, path: '/AlphaConsumptionControl', roles: ADMIN_ROLES },
];

// Sección: Sistema
const sistemaSection: MenuItem[] = [
  { label: 'Usuarios ERP', icon: <User size={18} />, path: '/ErpUsers', roles: ADMIN_ROLES },
  { label: 'Roles de Usuario ERP', icon: <Briefcase size={18} />, path: '/UserRole', roles: ADMIN_ROLES },
];

// Sección: Caballos (vista limitada para veterinarios)
const caballosVetSection: MenuItem[] = [
  { label: 'Caballos', icon: <Flag size={18} />, path: '/horses', roles: VETERINARIO_ROLES },
  { label: 'Atención a Caballos', icon: <Trophy size={18} />, path: '/attentionHorses', roles: VETERINARIO_ROLES },
];

const veterinarioMenuSections: MenuSection[] = [
  { title: 'Caballos', items: caballosVetSection },
  { title: 'Salud y Sanidad', items: saludSection },
];

const adminMenuSections: MenuSection[] = [
  { title: 'Caballos', items: caballosSection },
  { title: 'Empleados', items: empleadosSection },
  { title: 'Propietarios', items: propietariosSection },
  { title: 'Finanzas', items: finanzasSection },
  { title: 'Salud y Sanidad', items: saludSection },
  { title: 'Alimentación', items: alimentacionSection },
  { title: 'Sistema', items: sistemaSection },
];

const caballerizoMenuItemsBase: MenuItem[] = [
  { label: 'Perfil', icon: <User size={18} />, path: '/caballerizo/perfil', roles: CABALLERIZO_ROLES },
  { label: 'Tareas asignadas', icon: <ClipboardList size={18} />, path: '/caballerizo/tareas', roles: CABALLERIZO_ROLES },
  { label: 'Caballos asignados', icon: <Trophy size={18} />, path: '/caballerizo/caballos', roles: CABALLERIZO_ROLES },
];

const homeMenuItem: MenuItem = { label: 'Home', icon: <Home size={18} />, path: '/', roles: [...ADMIN_ROLES, ...VETERINARIO_ROLES] };

const menuItems: MenuItem[] = [
  homeMenuItem,
  ...adminMenuSections.flatMap(section => section.items),
  ...veterinarioMenuSections.flatMap(section => section.items),
  ...caballerizoMenuItemsBase,
];

type SidebarProps = {
  userRole?: number | null;
};

const Sidebar = ({ userRole }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const location = useLocation();

  const closeSidebar = () => setIsOpen(false);
  const logoUrl = `${import.meta.env.BASE_URL}image/Logo9.png`;

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const availableMenuItems = useMemo(() => {
    if (!userRole) {
      return menuItems;
    }
    return menuItems.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const availableMenuSections = useMemo(() => {
    if (!userRole) {
      return [];
    }
    
    // Para veterinarios, mostrar solo sus secciones
    if (VETERINARIO_ROLES.includes(userRole)) {
      return veterinarioMenuSections.map(section => ({
        ...section,
        items: section.items.filter(item => item.roles.includes(userRole))
      })).filter(section => section.items.length > 0);
    }
    
    // Para admin, mostrar secciones de admin
    if (ADMIN_ROLES.includes(userRole)) {
      return adminMenuSections.map(section => ({
        ...section,
        items: section.items.filter(item => item.roles.includes(userRole))
      })).filter(section => section.items.length > 0);
    }
    
    return [];
  }, [userRole]);

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) {
      return availableMenuItems;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return availableMenuItems.filter((item) => item.label.toLowerCase().includes(lowerCaseSearch));
  }, [availableMenuItems, searchTerm]);

  const filteredMenuSections = useMemo(() => {
    if (!searchTerm) {
      return availableMenuSections;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    return availableMenuSections.map(section => ({
      ...section,
      items: section.items.filter(item => item.label.toLowerCase().includes(lowerCaseSearch))
    })).filter(section => section.items.length > 0);
  }, [availableMenuSections, searchTerm]);

  const searchWrapperClassName =
    userRole === 9 ? 'relative px-6 pb-4 -mt-24' : 'relative px-6 pb-2 mt-[-6.2rem]';
  const navSectionsClassName =
    userRole === 9 ? 'space-y-4' : VETERINARIO_ROLES.includes(userRole ?? 0) ? 'space-y-6' : 'space-y-6';

  return (
    <>
      <div className="fixed right-4 top-4 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-2xl bg-sidebar-gradient px-4 py-2 text-sm font-semibold text-white shadow-sidebar-pill transition hover:bg-sidebar-surface/80"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
          <span>{isOpen ? 'Cerrar' : 'Menu'}</span>
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[19rem] max-w-[20rem] transform flex-col px-3 py-5 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-sidebar-gradient text-white shadow-sidebar-inner ring-1 ring-white/5 shadow-[0_0_60px_rgba(48,217,151,0.25),0_0_90px_rgba(31,165,255,0.25)]">
          <div className="pointer-events-none absolute inset-[-32px] opacity-95">
            <div className="h-full w-full bg-sidebar-glow" />
          </div>

          <div className="relative flex flex-col items-center scale-65 translate-y-[-3.5rem]">
            {/* LOGO */}
            <div className="flex justify-center px-8 pb-2 pt-3">
              <img
                src={logoUrl}
                alt="Country Club Hipica"
                className="h-[15rem] w-[15rem] rounded-[60px] object-cover shadow-sidebar-pill"
              />
            </div>

            {/* TEXTO */}
            <div className="text-center">
              <h2 className="text-[2.6rem] font-semibold tracking-[0.25em] bg-gradient-to-r from-[#F8F4E3] via-[#EED9A5] to-[#C9A34E] bg-clip-text text-transparent leading-tight">
                COUNTRY CLUB
              </h2>
              <h2 className="text-[1rem] font-medium tracking-[0.22em] bg-gradient-to-r from-[#F3EAD0] via-[#E7CA84] to-[#C8A13A] bg-clip-text text-transparent mt-1">
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
              {/* Home - Siempre visible para admin */}
              {userRole && ADMIN_ROLES.includes(userRole) && !searchTerm && (
                <div className="rounded-[32px] border border-white/10 bg-white/5 px-4 py-5 backdrop-blur-2xl shadow-inner shadow-black/20 mb-5">
                  <ul className="space-y-3">
                    {(() => {
                      const isActive = location.pathname === homeMenuItem.path;
                      return (
                        <li key={homeMenuItem.path} className="group flex items-center">
                          <span
                            className={`relative z-10 flex h-11 w-11 shrink-0 -translate-x-1 items-center justify-center rounded-full border transition-all duration-300 ${
                              isActive
                                ? 'border-[#3CC9F6] bg-[#3CC9F6]/15 text-[#3CC9F6] shadow-[0_0_20px_#3CC9F6]'
                                : 'border-white/12 bg-sidebar-pill/60 text-sidebar-icon group-hover:-translate-x-0.5 group-hover:border-sidebar-active-green/80 group-hover:bg-sidebar-active-green/10 group-hover:text-sidebar-active-green group-hover:shadow-sidebar-pill'
                            }`}
                          >
                            {homeMenuItem.icon}
                          </span>
                          <Link
                            to={homeMenuItem.path}
                            onClick={closeSidebar}
                            className={`group relative ml-[-0.2rem] flex-1 rounded-[23px] border pl-3 pr-4 py-3 transition-all duration-300 ${
                              isActive
                                ? 'border-[#3CC9F6] bg-[#3CC9F6]/10 text-[#3CC9F6] shadow-[0_0_25px_#3CC9F6] ring-1 ring-[#3CC9F6]/40'
                                : 'border-transparent bg-sidebar-surface/70 text-sidebar-muted transition-transform hover:scale-[1.05] hover:border-[#08f2ff]/80 hover:bg-sidebar-surface/80'
                            }`}
                          >
                            <span
                              className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${
                                isActive
                                  ? 'text-[#3CC9F6]'
                                  : 'text-[#ffffff] group-hover:text-[#3CC9F6]'
                              }`}
                            >
                              {homeMenuItem.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })()}
                  </ul>
                </div>
              )}

              {/* Secciones agrupadas para admin y veterinario */}
              {userRole && (ADMIN_ROLES.includes(userRole) || VETERINARIO_ROLES.includes(userRole)) && !searchTerm ? (
                filteredMenuSections.map((section, sectionIndex) => {
                  const isExpanded = expandedSections[section.title] ?? false;
                  return (
                    <div key={sectionIndex} className="rounded-[32px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-2xl shadow-inner shadow-black/20">
                      {/* Header del bloque - clickeable */}
                      <button
                        onClick={() => toggleSection(section.title)}
                        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <h3 className="text-xs font-bold tracking-[0.2em] text-[#bdab62] uppercase">
                          {section.title}
                        </h3>
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-[#bdab62] transition-transform duration-300" />
                        ) : (
                          <ChevronRight size={16} className="text-[#bdab62] transition-transform duration-300" />
                        )}
                      </button>

                      {/* Contenido desplegable */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isExpanded ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <ul className="space-y-3">
                          {section.items.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                              <li key={item.path} className="group flex items-center">
                                <span
                                  className={`relative z-10 flex h-11 w-11 shrink-0 -translate-x-1 items-center justify-center rounded-full border transition-all duration-300 ${
                                    isActive
                                      ? 'border-[#3CC9F6] bg-[#3CC9F6]/15 text-[#3CC9F6] shadow-[0_0_20px_#3CC9F6]'
                                      : 'border-white/12 bg-sidebar-pill/60 text-sidebar-icon group-hover:-translate-x-0.5 group-hover:border-sidebar-active-green/80 group-hover:bg-sidebar-active-green/10 group-hover:text-sidebar-active-green group-hover:shadow-sidebar-pill'
                                  }`}
                                >
                                  {item.icon}
                                </span>
                                <Link
                                  to={item.path}
                                  onClick={closeSidebar}
                                  className={`group relative ml-[-0.2rem] flex-1 rounded-[23px] border pl-3 pr-4 py-3 transition-all duration-300 ${
                                    isActive
                                      ? 'border-[#3CC9F6] bg-[#3CC9F6]/10 text-[#3CC9F6] shadow-[0_0_25px_#3CC9F6] ring-1 ring-[#3CC9F6]/40'
                                      : 'border-transparent bg-sidebar-surface/70 text-sidebar-muted transition-transform hover:scale-[1.05] hover:border-[#08f2ff]/80 hover:bg-sidebar-surface/80'
                                  }`}
                                >
                                  <span
                                    className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${
                                      isActive
                                        ? 'text-[#3CC9F6]'
                                        : 'text-[#ffffff] group-hover:text-[#3CC9F6]'
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Lista plana para búsqueda o caballerizo */
                <div className="rounded-[32px] border border-white/10 bg-white/5 px-4 py-5 backdrop-blur-2xl shadow-inner shadow-black/20">
                  <ul className="space-y-3">
                    {filteredMenuItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <li key={item.path} className="group flex items-center">
                          <span
                            className={`relative z-10 flex h-11 w-11 shrink-0 -translate-x-1 items-center justify-center rounded-full border transition-all duration-300 ${
                              isActive
                                ? 'border-[#3CC9F6] bg-[#3CC9F6]/15 text-[#3CC9F6] shadow-[0_0_20px_#3CC9F6]'
                                : 'border-white/12 bg-sidebar-pill/60 text-sidebar-icon group-hover:-translate-x-0.5 group-hover:border-sidebar-active-green/80 group-hover:bg-sidebar-active-green/10 group-hover:text-sidebar-active-green group-hover:shadow-sidebar-pill'
                            }`}
                          >
                            {item.icon}
                          </span>
                          <Link
                            to={item.path}
                            onClick={closeSidebar}
                            className={`group relative ml-[-0.2rem] flex-1 rounded-[23px] border pl-3 pr-4 py-3 transition-all duration-300 ${
                              isActive
                                ? 'border-[#3CC9F6] bg-[#3CC9F6]/10 text-[#3CC9F6] shadow-[0_0_25px_#3CC9F6] ring-1 ring-[#3CC9F6]/40'
                                : 'border-transparent bg-sidebar-surface/70 text-sidebar-muted transition-transform hover:scale-[1.05] hover:border-[#08f2ff]/80 hover:bg-sidebar-surface/80'
                            }`}
                          >
                            <span
                              className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${
                                isActive
                                  ? 'text-[#3CC9F6]'
                                  : 'text-[#ffffff] group-hover:text-[#3CC9F6]'
                              }`}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </nav>

          <div className="relative mt-auto px-6 pb-3 pt-5">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-3 rounded-2xl 
                        border border-[#167C79] bg-transparent px-4 py-3 text-sm font-semibold 
                        text-[#EFFFFF] shadow-[0_0_16px_#167C79,0_0_28px_rgba(22,124,121,0.7)] 
                        transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_22px_#167C79,0_0_38px_rgba(22,124,121,0.85)]"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.35em] text-sidebar-muted">
              Copyright {new Date().getFullYear()} Country Club Hipica
            </p>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={closeSidebar} />
      )}
    </>
  );
};

export default Sidebar;
