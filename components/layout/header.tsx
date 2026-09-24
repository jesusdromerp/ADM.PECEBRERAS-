import React from "react";

export function Header() {
  return (
    <header className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-all dark:border-stone-800 dark:bg-stone-950/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold shadow-sm">
            🐎
          </div>
          <div>
            <span className="font-semibold text-stone-900 tracking-tight text-base sm:text-lg dark:text-stone-100">
              Gestión Ecuestre
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
            Fase Base
          </span>
        </div>
      </div>
    </header>
  );
}
