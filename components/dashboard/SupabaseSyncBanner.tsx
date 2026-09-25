"use client";

import React, { useState } from "react";
import { Database, Laptop, CheckCircle, ChevronDown, ChevronUp, FileCode } from "lucide-react";

export function SupabaseSyncBanner() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-950 text-white rounded-3xl p-5 sm:p-6 border border-emerald-800/40 shadow-lg relative overflow-hidden">
      {/* Detalle decorativo de fondo */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Modo Local Activo (Fases 1 y 2)
              </span>
              <span className="text-xs text-stone-400">
                Operación fluida sin necesidad de internet
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              Todos los módulos (Pesebreras, Caballos, Clientes, Sanidad y Pagos) funcionan con datos simulados reactivos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-emerald-200 transition-colors border border-white/10 cursor-pointer"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Ver Fase 3 (Supabase)</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-5 pt-4 border-t border-white/10 text-xs text-stone-300 space-y-3 animate-fade-in">
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Arquitectura de la Fase 3 lista para producción
            </div>
            <p className="text-stone-300 leading-relaxed">
              Cuando decidas migrar de local a la nube de Supabase, solo necesitas 2 pasos:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-stone-400 pl-1">
              <li>
                Ejecutar el script SQL que preparamos en{" "}
                <span className="text-emerald-300 font-mono">lib/supabase/schema.sql</span> en tu
                consola de Supabase (creará las tablas, llaves foráneas y RLS).
              </li>
              <li>
                Guardar tu <span className="text-emerald-300 font-mono">NEXT_PUBLIC_SUPABASE_URL</span> y{" "}
                <span className="text-emerald-300 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> en{" "}
                <span className="text-emerald-300 font-mono">.env.local</span>.
              </li>
            </ol>
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-stone-400">
              <FileCode className="w-4 h-4 text-stone-400" />
              <span>Esquema SQL generado: 5 tablas principales (pesebreras, horses, clients, vet, payments).</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
