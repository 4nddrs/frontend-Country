import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Importa tus componentes de página
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employee';
import ProductManagement from '../App'; // Asegúrate de que el nombre del componente coincida

// ⚠️ Usamos un nuevo componente para la gestión de productos,
// y separamos la lógica de Employees en su propio archivo
// para tener un código más limpio y modular.

const MainLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* ⚠️ Aquí renderizamos el componente de productos */}
          <Route path="/crud" element={<ProductManagement />} />
          {/* ⚠️ Y aquí el de empleados */}
          <Route path="/employee" element={<Employees />} />
        </Routes>
      </main>
      {/* ⚠️ El Toaster debe estar fuera de las rutas para que sea accesible en toda la aplicación */}
      <Toaster position="bottom-right" />
    </div>
  );
};

export default MainLayout;
