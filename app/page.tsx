import React from "react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Insignia / Badge sutil */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-medium tracking-wide shadow-sm dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          Sistema Base Inicializado
        </div>

        {/* Título Principal */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight dark:text-stone-50">
            Gestión Ecuestre
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-stone-600 font-normal leading-relaxed max-w-xl mx-auto dark:text-stone-300">
            Plataforma de administración de pesebreras y centros ecuestres
          </p>
        </div>

        {/* Botón visual "Comenzar" */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto text-base px-8 py-3.5 shadow-emerald-900/20 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            Comenzar
          </Button>
        </div>

      </div>
    </div>
  );
}
