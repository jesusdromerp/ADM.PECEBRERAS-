"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const mounted = useMounted();

  useEffect(() => {
    // Verificar estado actual en DOM o localStorage
    const saved = localStorage.getItem("theme");
    const isDark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      document.documentElement.classList.contains("dark");

    if (isDark) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }

    const handleThemeChange = (e: CustomEvent<{ theme: "light" | "dark" }> | Event) => {
      const customDetail = (e as CustomEvent)?.detail?.theme;
      if (customDetail) {
        setTheme(customDetail);
      } else {
        setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
      }
    };

    window.addEventListener("theme-changed", handleThemeChange);
    return () => window.removeEventListener("theme-changed", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    window.dispatchEvent(
      new CustomEvent("theme-changed", { detail: { theme: nextTheme } })
    );
  };

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-100 dark:bg-stone-800/80 animate-pulse ${className}`}
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Cambiar a Modo Claro (Día)" : "Cambiar a Modo Oscuro (Noche)"}
      aria-label="Alternar tema claro y oscuro"
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
        isDark
          ? "bg-stone-900 border-stone-700 text-amber-300 hover:bg-stone-800 shadow-sm"
          : "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900 shadow-xs"
      } ${className}`}
    >
      <div className="relative flex items-center justify-center w-5 h-5">
        {isDark ? (
          <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-amber-400" />
        ) : (
          <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-amber-500" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold whitespace-nowrap">
          {isDark ? "Modo Oscuro" : "Modo Claro"}
        </span>
      )}
    </button>
  );
}
