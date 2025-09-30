import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Menu,
  X,
  ClipboardList,
  User,
  Briefcase,
  Shield,
  Package,
  Book,
  Layers,
  Flag,
  List,
  Calendar,
  Search,
} from 'lucide-react';

const menuItems = [
    { label: 'Home', icon: <Home size={20} />, path: '/' },
    { label: 'Empleados', icon: <User size={20} />, path: '/employee' },
    { label: 'Posiciones', icon: <Briefcase size={20} />, path: '/positions' },
    { label: 'Proveedores de Comida', icon: <Package size={20} />, path: '/food-providers' },
    { label: 'Stock de Comida', icon: <ClipboardList size={20} />, path: '/food-stocks' },
    { label: 'Propietarios', icon: <User size={20} />, path: '/owners' },
    { label: 'Razas', icon: <Layers size={20} />, path: '/races' },
    { label: 'Caballos', icon: <Flag size={20} />, path: '/horses' },
    { label: 'Planes Nutricionales', icon: <Book size={20} />, path: '/nutritional-plans' },
    { label: 'Detalles Plan Nutricional', icon: <List size={20} />, path: '/nutritional-plan-details' },
    { label: 'Categorías de Tareas', icon: <List size={20} />, path: '/task-categories' },
    { label: 'Tareas', icon: <Calendar size={20} />, path: '/tasks' },
    { label: 'Control de Alfalfa', icon: <Calendar size={20} />, path: '/alfalfa-control' },
    { label: 'Procedimientos Programados', icon: <Calendar size={20} />, path: '/scheduled-procedures' },
    { label: 'Procedimiento de Solicitud', icon: <Calendar size={20} />, path: '/application-procedures' },
    { label: 'Medicamentos', icon: <Calendar size={20} />, path: '/medicines' },
    { label: 'Atención a Caballos', icon: <Calendar size={20} />, path: '/attentionHorses' },
    { label: 'Ausencias de Empleados', icon: <Calendar size={20} />, path: '/employee-absences' },
    { label: 'Tipos de Turno', icon: <Calendar size={20} />, path: '/shiftTypes' },
    { label: 'Empleados por Turno', icon: <Calendar size={20} />, path: '/shiftEmployees' },
    { label: 'Turnos de Empleados', icon: <Calendar size={20} />, path: '/EmployeesShiftem' },
    { label: 'Usuarios ERP', icon: <Calendar size={20} />, path: '/ErpUsers' },
    { label: 'Roles de Usuario ERP', icon: <Calendar size={20} />, path: '/UserRole' },
    { label: 'Gastos', icon: <Calendar size={20} />, path: '/Expenses' },
    { label: 'Ingresos', icon: <Calendar size={20} />, path: '/Income' },
    { label: 'Reportes Mensuales de Propietario', icon: <Calendar size={20} />, path: '/OwnerReportMonth' },
    { label: 'Control Total', icon: <Calendar size={20} />, path: '/TotalControl' },
    { label: 'Control de Vacunación', icon: <Calendar size={20} />, path: '/VaccinationPlan' },
    { label: 'Aplicación de Vacunación', icon: <Calendar size={20} />, path: '/VaccinationPlanApplication' }
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 
  const location = useLocation();

  const closeSidebar = () => setIsOpen(false);

   const filteredMenuItems = useMemo(() => {
        if (!searchTerm) {
            return menuItems;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        return menuItems.filter(item => 
            item.label.toLowerCase().includes(lowerCaseSearch)
        );
    }, [searchTerm]);

  return (
    <>
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white bg-gray-800 rounded-md"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

    
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
        <div className="flex items-center justify-between h-20 px-4 border-b border-gray-700">
          <span className="text-2xl font-bold tracking-wide">PANEL DE CONTROL</span>
        </div>
        
         <div className="p-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full py-2 pl-10 pr-4 bg-gray-900 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
          </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredMenuItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-6 py-3 rounded-md hover:bg-gray-900 transition ${
                    location.pathname === item.path ? 'bg-gray-900 font-semibold' : ''
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
          &copy; {new Date().getFullYear()} Country Club - Hipica
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

export default Sidebar;
