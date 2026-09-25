"use client";

import React, { useState, useEffect } from "react";
import { dataService } from "@/services";
import { CenterSettings, UserAccount } from "@/types";
import { USER_ROLES } from "@/lib/roles";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogOut, LogIn, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const [settings, setSettings] = useState<CenterSettings>(() =>
    dataService.getCenterSettings()
  );
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    dataService.getCurrentUser()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(dataService.getCenterSettings());
    };

    const handleSessionChange = (e: any) => {
      setCurrentUser(dataService.getCurrentUser());
    };

    window.addEventListener("center-settings-updated", handleUpdate);
    window.addEventListener("user-session-changed", handleSessionChange);

    return () => {
      window.removeEventListener("center-settings-updated", handleUpdate);
      window.removeEventListener("user-session-changed", handleSessionChange);
    };
  }, []);

  const handleLogout = () => {
    dataService.logout();
    setCurrentUser(null);
    router.push("/login");
  };

  const roleDef = currentUser ? USER_ROLES[currentUser.role] || USER_ROLES.admin : null;

  return (
    <header className="w-full border-b border-stone-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-all dark:border-stone-800 dark:bg-stone-950/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-900/10 text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
            🐎
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-stone-900 tracking-tight text-base sm:text-lg dark:text-stone-100 flex items-center gap-2 truncate">
              <span className="truncate">{settings.stableName || "Gestión Ecuestre"}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex-shrink-0">
                Pesebreras Pro
              </span>
            </span>
            <p className="text-[11px] text-stone-500 hidden sm:block truncate">
              {settings.tagline || settings.location || "Administración de Boxes, Equinos, Sanidad y Finanzas"}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <ThemeToggle />

          {/* Estado de Sesión / Usuario */}
          {currentUser && roleDef ? (
            <div className="flex items-center gap-2 pl-1 border-l border-stone-200 dark:border-stone-800">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm font-bold shrink-0">
                  {roleDef.emoji}
                </div>
                <div className="text-left leading-none">
                  <span className="text-xs font-black text-stone-800 dark:text-stone-200 block truncate max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full border ${roleDef.color} inline-block mt-0.5`}
                  >
                    {roleDef.badge}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-stone-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-stone-600 dark:text-stone-300 text-xs font-bold border border-stone-200 dark:border-stone-700 hover:border-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </Link>
          )}

          <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs dark:bg-emerald-950/60 dark:border-emerald-800/80 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Modo Local</span>
          </div>
        </div>
      </div>
    </header>
  );
}
