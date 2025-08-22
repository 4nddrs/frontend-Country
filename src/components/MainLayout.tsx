import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employee';
import ProductManagement from '../App';

import PositionManagement from '../pages/PositionManagment'; 
import RoleManagement from '../pages/RoleManagment';        
import FoodProvidersManagement from '../pages/FoodProviders';
import FoodStocksManagement from '../pages/FoodStocks';
import VaccinesManagement from '../pages/Vaccines';
import OwnersManagement from '../pages/Owners';
import RacesManagement from '../pages/Races';
import HorsesManagement from '../pages/Horses';
import NutritionalPlansManagement from '../pages/NutritionalPlans';
import NutritionalPlanHorsesManagement from '../pages/NutritionalPlanHorses';
import NutritionalPlanDetailsManagement from '../pages/NutritionalPlanDetails';
import TaskCategoriesManagement from '../pages/TaskCategories';
import TasksManagement from '../pages/Tasks';

const MainLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crud" element={<ProductManagement />} />
          <Route path="/employee" element={<Employees />} />
          <Route path="/positions" element={<PositionManagement />} />
          <Route path="/roles" element={<RoleManagement />} />
          <Route path="/food-providers" element={<FoodProvidersManagement />} />
          <Route path="/food-stocks" element={<FoodStocksManagement />} />
          <Route path="/vaccines" element={<VaccinesManagement />} />
          <Route path="/owners" element={<OwnersManagement />} />
          <Route path="/races" element={<RacesManagement />} />
          <Route path="/horses" element={<HorsesManagement />} />
          <Route path="/nutritional-plans" element={<NutritionalPlansManagement />} />
          <Route path="/nutritional-plan-horses" element={<NutritionalPlanHorsesManagement />} />
          <Route path="/nutritional-plan-details" element={<NutritionalPlanDetailsManagement />} />
          <Route path="/task-categories" element={<TaskCategoriesManagement />} />
          <Route path="/tasks" element={<TasksManagement />} />
          {/* Agrega aquí más rutas si tienes más páginas */}
        </Routes>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default MainLayout;