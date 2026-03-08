import { useTheme } from "../../../context/theme-context";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl">

      <h1 className="text-2xl font-semibold mb-6">
        Settings
      </h1>

      {/* Theme toggle */}
      <div className="bg-white dark:bg-neutral-800 border dark:border-gray-700 rounded-xl p-4 flex gap-5 justify-between items-center h-full">

        <h2 className="text-lg font-semibold">
          Appearance
        </h2>

        <div className="flex gap-3">

          <button
            onClick={() => setTheme("light")}
            className={`px-4 py-2 border rounded-md ${
              theme === "light" ? "bg-white dark:bg-neutral-700" : "bg-neutral-200 text-black"
            }`}
          >
            Light
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`px-4 py-2 border rounded-md ${
              theme === "dark" ? "bg-gray-200 dark:bg-neutral-700" : "bg-neutral-700  text-white"
            }`}
          >
            Dark
          </button>

        </div>

      </div>

    </div>
  );
}