import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import App from '../App';
import Dashboard from '../pages/Dashboard';
import { Toaster } from 'react-hot-toast';
import Employees from '../pages/Employee';

const MainLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />         
          <Route path="/crud" element={<App />} />
          <Route path="/employee" element={<Employees />} />
        </Routes>
         <Toaster position="bottom-right" /> 
      </main>
    </div>
  );
};

export default MainLayout;
