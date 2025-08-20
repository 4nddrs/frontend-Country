// src/components/Sidebar.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Menu,
  X,
  ClipboardList,
  User,
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Botón para abrir el menú en móviles */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white bg-gray-800 rounded-md"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex-shrink-0`}
      >
        <nav className="p-4">
          <div className="flex items-center justify-between mb-8 lg:block">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 text-white bg-gray-700 rounded-md"
            >
              <X size={24} />
            </button>
          </div>
          <ul className="space-y-2">
            <li>
              {/* Este enlace ahora va a la ruta principal, que es el Dashboard */}
              <Link
                to="/"
                onClick={closeSidebar}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 transition"
              >
                <Home size={20} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              {/* Este enlace va a la ruta /crud */}
              <Link
                to="/crud"
                onClick={closeSidebar}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 transition"
              >
                <ClipboardList size={20} />
                <span>CRUD</span>
              </Link>
            </li>
            <li>
              <Link
                to="/employee"
                onClick={closeSidebar}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 transition"
              >
                <User size={20} />
                <span>CRUD de Empleados</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Overlay para cerrar el menú en móviles */}
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
