import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employee';


import PositionManagement from '../pages/PositionManagment';    
import FoodProvidersManagement from '../pages/FoodProviders';
import FoodStocksManagement from '../pages/FoodStocks';
import OwnersManagement from '../pages/Owners';
import RacesManagement from '../pages/Races';
import HorsesManagement from '../pages/Horses';
import NutritionalPlansManagement from '../pages/NutritionalPlans';
import NutritionalPlanDetailsManagement from '../pages/NutritionalPlanDetails';
import TaskCategoriesManagement from '../pages/TaskCategories';
import TasksManagement from '../pages/Tasks';
import AlphaControls from '../pages/AlphaControls';
import ScheduleProcedures from '../pages/ScheduledProcedures';
import ApplicationProcedures from '../pages/ApplicationProcedures';
import Medicines from '../pages/Medicines';
import AttentionHorses from '../pages/AttentionHorses';
import EmployeeAbsences from '../pages/EmployeeAbsences';
import ShiftTypes from '../pages/ShiftTypes';
import ShiftEmployeds from '../pages/ShiftEmployeds';
import EmployeesShiftems from '../pages/EmployeesShiftems';
import ErpUsers from '../pages/ErpUsers';
import UserRole from '../pages/UserRole';
import Expenses from '../pages/Expenses';
import Income from '../pages/Income';
import OwnerReportMonth from '../pages/OwnerReportMonth'
import TotalControl from '../pages/TotalConrtrol';
import VaccinationPlan from '../pages/VaccinationPlan';
import VaccinationPlanApplication from '../pages/VaccinationPlanApplication';

const MainLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900 text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employee" element={<Employees />} />
          <Route path="/positions" element={<PositionManagement />} />
          <Route path="/food-providers" element={<FoodProvidersManagement />} />
          <Route path="/food-stocks" element={<FoodStocksManagement />} />
          <Route path="/owners" element={<OwnersManagement />} />
          <Route path="/races" element={<RacesManagement />} />
          <Route path="/horses" element={<HorsesManagement />} />
          <Route path="/nutritional-plans" element={<NutritionalPlansManagement />} />
          <Route path="/nutritional-plan-details" element={<NutritionalPlanDetailsManagement />} />
          <Route path="/task-categories" element={<TaskCategoriesManagement />} />
          <Route path="/tasks" element={<TasksManagement />} />
          <Route path="/alfalfa-control" element={<AlphaControls />} />
          <Route path="/scheduled-procedures" element={<ScheduleProcedures />} />
          <Route path="/application-procedures" element={<ApplicationProcedures />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/attentionHorses" element={<AttentionHorses />} />
          <Route path="/employee-absences" element={<EmployeeAbsences />} />
          <Route path="/shiftTypes" element={<ShiftTypes />} />
          <Route path="/shiftEmployees" element={<ShiftEmployeds />} />
          <Route path="/EmployeesShiftem" element={<EmployeesShiftems />} />
          <Route path="/ErpUsers" element={<ErpUsers />} />
          <Route path="/UserRole" element={<UserRole />} />
          <Route path="/Expenses" element={<Expenses />} />
          <Route path="/Income" element={<Income />} />
          <Route path="/OwnerReportMonth" element={<OwnerReportMonth />} />
          <Route path="/TotalControl" element={<TotalControl />} />
          <Route path="/VaccinationPlan" element={<VaccinationPlan />} />
          <Route path="/VaccinationPlanApplication" element={<VaccinationPlanApplication />} />
        </Routes>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default MainLayout;