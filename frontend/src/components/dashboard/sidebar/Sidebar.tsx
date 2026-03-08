import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/auth-context";
import { toast } from "sonner";

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
      className={`
      fixed lg:static
      top-0 left-0
      h-screen w-64
      bg-gray-100 dark:bg-neutral-900
      border-r border-gray-200 dark:border-white
      flex flex-col
      z-50
      transform transition-transform duration-300
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0
      `}
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200 dark:border-white flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          OpenBoard
        </h1>

        {/* Close button mobile */}
        <button
          className="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-2 text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Workspace
        </p>

        {routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className="
            block px-3 py-2 rounded-lg text-sm font-medium
            text-gray-700 dark:text-gray-300
            hover:bg-gray-200 dark:hover:bg-neutral-800
            hover:text-gray-900 dark:hover:text-white
            transition-colors duration-200
            "
            onClick={() => setSidebarOpen(false)}
          >
            {route.name}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="
          w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium
          text-gray-600 dark:text-gray-300
          hover:text-red-600
          hover:bg-red-50 dark:hover:bg-red-900/20
          transition-colors duration-200
          "
        >
          Log out
        </button>
      </div>
    </aside>
  );
}