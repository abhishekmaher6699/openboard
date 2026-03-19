import { useTheme } from "../../context/theme-context";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative flex items-center w-8 h-4 rounded-full transition-colors duration-300 ${
        isDark ? "bg-neutral-600" : "bg-neutral-300"
      }`}
      aria-label="Toggle theme"
    >
      <span
        className={`absolute flex items-center justify-center w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${
          isDark ? "translate-x-4" : "translate-x-0.5"
        }`}
      >
        {isDark ? (
          <Moon size={8} className="text-neutral-700" />
        ) : (
          <Sun size={8} className="text-yellow-500" />
        )}
      </span>
    </button>
  );
}
