import Sidebar from "./sidebar/Sidebar";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import ThemeToggle from "../ui/ThemeToggle";
import { bauhausFont, shellClass, surfaceClass } from "./dashboardTheme";
import { Menu } from "lucide-react";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
  }, [sidebarOpen]);

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden ${shellClass}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(10,10,10,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(10,10,10,0.04) 1px,transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    >
      <div className="pointer-events-none absolute -top-20 right-[-5rem] hidden h-[14rem] w-[14rem] rounded-full border-[14px] border-[#1a3a6b] opacity-10 lg:block dark:border-[#f7b731]" />
      <div className="pointer-events-none absolute bottom-8 left-0 hidden h-2 w-28 bg-[#d62828] lg:block" />

      <div className={`fixed bottom-3 right-3 z-[10001] p-1.5 ${surfaceClass}`}>
        <ThemeToggle />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative flex min-h-screen overflow-x-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="mx-3 mt-3 flex items-center justify-between border-2 border-[#0a0a0a] bg-[#f5f0e8] px-2.5 py-1.5 shadow-[3px_3px_0px_#0a0a0a] dark:border-[#f5f0e8] dark:bg-[#1e1e1e] dark:shadow-[3px_3px_0px_#ffffff] lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center border-2 border-[#0a0a0a] text-[#0a0a0a] shadow-[2px_2px_0px_#] transition-all duration-75 hover:bg-[#1a3a6b] hover:text-[#f5f0e8] dark:border-[#f5f0e8] dark:text-[#f5f0e8] dark:shadow-[2px_2px_0px_#] dark:hover:bg-[#f7b731] dark:hover:text-[#0a0a0a]"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            <h1
              className="text-[0.95rem] font-black uppercase tracking-[0.12em]"
              style={bauhausFont}
            >
              OpenBoard
            </h1>

            <div className="w-8" />
          </header>

          <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
