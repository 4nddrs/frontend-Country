import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Dashboard from '../pages/admin/Dashboard';
import Employees from '../pages/admin/Employee';
import PositionManagement from '../pages/admin/PositionManagment';
import FoodProvidersManagement from '../pages/admin/FoodProviders';
import FoodStocksManagement from '../pages/admin/FoodStocks';
import OwnersManagement from '../pages/admin/Owners';
import RacesManagement from '../pages/admin/Races';
import HorsesManagement from '../pages/admin/Horses';
import NutritionalPlansManagement from '../pages/admin/NutritionalPlans';
import NutritionalPlanDetailsManagement from '../pages/admin/NutritionalPlanDetails';
import TaskCategoriesManagement from '../pages/admin/TaskCategories';
import TasksManagement from '../pages/admin/Tasks';
import AlphaControls from '../pages/admin/AlphaControls';
import ScheduleProcedures from '../pages/admin/ScheduledProcedures';
import ApplicationProcedures from '../pages/admin/ApplicationProcedures';
import Medicines from '../pages/admin/Medicines';
import AttentionHorses from '../pages/admin/AttentionHorses';
import EmployeeAbsences from '../pages/admin/EmployeeAbsences';
import ShiftTypes from '../pages/admin/ShiftTypes';
import ShiftEmployeds from '../pages/admin/ShiftEmployeds';
import EmployeesShiftems from '../pages/admin/EmployeesShiftems';
import ErpUsers from '../pages/admin/ErpUsers';
import UserRole from '../pages/admin/UserRole';
import Expenses from '../pages/admin/Expenses';
import Income from '../pages/admin/Income';
import OwnerReportMonth from '../pages/admin/OwnerReportMonth';
import TotalControl from '../pages/admin/TotalConrtrol';
import VaccinationPlan from '../pages/admin/VaccinationPlan';
import VaccinationPlanApplication from '../pages/admin/VaccinationPlanApplication';
import AlphaConsumptionControl from '../pages/admin/AlphaConsumptionControl';
import SalaryPayments from '../pages/admin/SalaryPayment';
import TipPayment from '../pages/admin/TipPayment';

const MainLayout = () => {
  return (
     <div className="bg-slate-950 text-white font-sans flex h-screen overflow-hidden text-base leading-normal">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto lg:ml-64">
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
          <Route path="/AlphaConsumptionControl" element={<AlphaConsumptionControl />} />
          <Route path="/SalaryPayments" element={<SalaryPayments />} />
          <Route path="/TipPayment" element={<TipPayment />} />
        </Routes>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default MainLayout;
