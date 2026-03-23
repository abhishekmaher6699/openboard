import { useTheme } from "../../../context/theme-context";
import {
  bauhausFont,
  panelClass,
  sectionTitleClass,
} from "../dashboardTheme";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`max-w-2xl p-6 ${panelClass}`}>
      <p className={sectionTitleClass} style={bauhausFont}>
        System
      </p>
      <h1
        className="mt-2 text-[2.4rem] font-black uppercase leading-none tracking-[0.12em]"
        style={bauhausFont}
      >
        Settings
      </h1>

      <div className="mt-6 flex flex-col gap-5 border-t-[3px] border-[#d62828] pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-[#f7b731]">
        <div>
          <h2
            className="text-[1.55rem] font-black uppercase tracking-[0.1em]"
            style={bauhausFont}
          >
            Appearance
          </h2>
          <p className="mt-2 text-[0.95rem] text-[#4f4a42] dark:text-[#c8c0b0]">
            Choose the workspace contrast mode.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`border-2 px-4 py-2 text-[0.92rem] font-black uppercase tracking-[0.12em] transition-all duration-75 ${
              theme === "light"
                ? "border-[#0a0a0a] bg-[#f7b731] text-[#0a0a0a] shadow-[4px_4px_0px_#d62828] dark:border-[#f5f0e8] dark:bg-[#f7b731]"
                : "border-[#0a0a0a] bg-transparent text-[#0a0a0a] shadow-[4px_4px_0px_#1a3a6b] hover:bg-[#1a3a6b] hover:text-[#f5f0e8] dark:border-[#f5f0e8] dark:text-[#f5f0e8] dark:shadow-[4px_4px_0px_#f7b731] dark:hover:bg-[#f7b731] dark:hover:text-[#0a0a0a]"
            }`}
            style={bauhausFont}
          >
            Light
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`border-2 px-4 py-2 text-[0.92rem] font-black uppercase tracking-[0.12em] transition-all duration-75 ${
              theme === "dark"
                ? "border-[#0a0a0a] bg-[#1a3a6b] text-[#f5f0e8] shadow-[4px_4px_0px_#d62828] dark:border-[#f5f0e8] dark:bg-[#1a3a6b]"
                : "border-[#0a0a0a] bg-transparent text-[#0a0a0a] shadow-[4px_4px_0px_#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#f5f0e8] dark:border-[#f5f0e8] dark:text-[#f5f0e8] dark:shadow-[4px_4px_0px_#f7b731] dark:hover:bg-[#f5f0e8] dark:hover:text-[#0a0a0a]"
            }`}
            style={bauhausFont}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}
