import { Routes, Route } from "react-router-dom";
import SidebarUser from "../../components/SidebarUser";
import UserHome from "./UserHome";
import UserHorses from "./UserHorses";
import UserCamera from "./UserCamera";
import UserPayments from "./UserPayments";
import UserProfile from "./UserProfile";

const AppUser = () => {
  return (
    <div className="flex">
      <SidebarUser />
      <div className="flex-1 ml-0 lg:ml-64 bg-slate-900 min-h-screen p-6">
        <Routes>
          <Route path="/user/home" element={<UserHome />} />
          <Route path="/user/horses" element={<UserHorses />} />
          <Route path="/user/camera" element={<UserCamera />} />
          <Route path="/user/payments" element={<UserPayments />} />
          <Route path="/user/profile" element={<UserProfile />} />
        </Routes>
      </div>
    </div>
  );
};

export default AppUser;
