import { Routes, Route, useNavigate } from "react-router-dom";
import SidebarUser from "../../components/SidebarUser";
import { UserHome } from "./UserHome";
import { UserHorses } from "./UserHorses";
import { UserCamera } from "./UserCamera";
import {UserPayments} from "./UserPayments";
import {UserProfile } from "./UserProfile";

const AppUser = () => {
  const navigate = useNavigate();

  type View =
    | "home"
    | "UserHorses"
    | "UserCamera"
    | "UserPayments"
    | "UserProfile";

  const setCurrentView = (view: View) => {
    switch (view) {
      case "home":
        navigate("/user/home");
        break;
      case "UserHorses":
        navigate("/user/horses");
        break;
      case "UserCamera":
        navigate("/user/camera");
        break;
      case "UserPayments":
        navigate("/user/payments");
        break;
      case "UserProfile":
        navigate("/user/profile");
        break;
      default:
        break;
    }
  };

  return (
    <div className="app-shell flex min-h-screen bg-black">
      <SidebarUser />
      <div className="app-content flex-1 ml-0 lg:ml-72 min-h-screen p-3 lg:p-6">
        <Routes>
          <Route path="/user/home" element={<UserHome setCurrentView={setCurrentView} />} />
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



