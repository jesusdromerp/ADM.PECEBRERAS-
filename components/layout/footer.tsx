import React from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-stone-200/80 bg-stone-50/50 py-6 text-center text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {currentYear} Gestión Ecuestre. Plataforma de administración de pesebreras y centros ecuestres.</p>
        <p className="text-[11px] text-stone-400">Estructura base preparada para escalabilidad</p>
      </div>
    </footer>
  );
}
