import React from "react";

export function Header() {
  return (
    <header className="w-full border-b border-stone-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-all dark:border-stone-800 dark:bg-stone-950/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-900/10 text-xl">
            🐎
          </div>
          <div>
            <span className="font-extrabold text-stone-900 tracking-tight text-base sm:text-lg dark:text-stone-100 flex items-center gap-2">
              Gestión Ecuestre
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                Pesebreras Pro
              </span>
            </span>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              Administración de Boxes, Equinos, Sanidad y Finanzas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs dark:bg-emerald-950/60 dark:border-emerald-800/80 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Modo Local Operativo
          </div>
        </div>
      </div>
    </header>
  );
}
