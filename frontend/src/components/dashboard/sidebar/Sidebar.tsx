import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/auth-context";
import { toast } from "sonner";
import {
  bauhausFont,
  cardClass,
  sectionTitleClass,
  secondaryActionClass,
} from "../dashboardTheme";
import { X } from "lucide-react";

const routes = [
  { name: "Your Boards", path: "/dashboard" },
  { name: "Profile", path: "/profile" },
  { name: "Settings", path: "/settings" },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: any) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully!");
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen w-60 max-w-[82vw] flex-col border-r-2 border-[#0a0a0a] bg-[#f5f0e8] transition-transform duration-300 dark:border-[#f5f0e8] dark:bg-[#1e1e1e] ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:sticky lg:translate-x-0`}
    >
      <div
        className="h-2 w-full"
        style={{
          background:
            "repeating-linear-gradient(90deg,#d62828 0,#d62828 56px,#f7b731 56px,#f7b731 112px,#1a3a6b 112px,#1a3a6b 168px,#0a0a0a 168px,#0a0a0a 224px)",
        }}
      />

      <div className="flex items-center justify-between border-b-2 border-[#0a0a0a] px-4 py-4 dark:border-[#f5f0e8]">
        <h1
          className="text-[1.3rem] font-black uppercase tracking-[0.12em] text-[#0a0a0a] dark:text-[#f5f0e8]"
          style={bauhausFont}
        >
          OpenBoard
        </h1>

        <button
          className="flex h-8 w-8 items-center justify-center border-2 border-[#0a0a0a] text-[#0a0a0a] shadow-[2px_2px_0px_#d62828] transition-all duration-75 hover:bg-[#d62828] hover:text-[#f5f0e8] dark:border-[#f5f0e8] dark:text-[#f5f0e8] dark:shadow-[2px_2px_0px_#f7b731] dark:hover:bg-[#f7b731] dark:hover:text-[#0a0a0a] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className={`mb-3 px-1.5 ${sectionTitleClass}`} style={bauhausFont}>
          Workspace
        </p>

        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              `mb-2 block ${cardClass} px-3 py-2.5 text-[0.82rem] font-black uppercase tracking-widest transition-all duration-75 ${
                isActive
                  ? "border-[#0a0a0a] bg-[#0a0a0a] text-black shadow-[3px_3px_0px_#d62828] dark:border-[#f5f0e8] dark:bg-[#f5f0e8] dark:text-[#0a0a0a] dark:shadow-[3px_3px_0px_#f7b731]"
                  : "text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#f5f0e8] dark:text-[#f5f0e8] dark:hover:bg-[#c3c3c3] dark:hover:text-[#0a0a0a]"
              }`
            }
            onClick={() => setSidebarOpen(false)}
            style={bauhausFont}
          >
            {route.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t-2 border-[#0a0a0a] px-3 py-4 dark:border-[#f5f0e8]">
        <button
          onClick={handleLogout}
          className={`w-full ${secondaryActionClass} hover:bg-[#ff0000]`}
          style={bauhausFont}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
