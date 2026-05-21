"use client";

import { useTheme } from "@/components/ThemeProvider";

export function DarkModeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors text-base ${className}`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
