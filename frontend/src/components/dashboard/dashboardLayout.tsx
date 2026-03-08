import Sidebar from "./sidebar/Sidebar";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:text-gray-100 flex">

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col">

        {/* Mobile Topbar */}
        <header className="
          lg:hidden
          flex items-center justify-between
          px-4 py-2
          bg-gray-200 dark:bg-neutral-950
          border-b border-black dark:border-gray-700
        ">
          <button
            onClick={() => setSidebarOpen(true)}
            className="
              p-2 rounded-lg
              hover:bg-gray-100
              dark:hover:bg-gray-700
              transition
            "
          >
            ☰
          </button>

          <h1 className="font-semibold text-gray-900 dark:text-gray-100">
            OpenBoard
          </h1>

          <div />
        </header>

        <main className="
          flex-1
          transition-all duration-200
          p-4 sm:p-6 lg:p-8
          bg-gray-200 dark:bg-neutral-900
        ">
          <Outlet />
        </main>

      </div>
    </div>
  );
}