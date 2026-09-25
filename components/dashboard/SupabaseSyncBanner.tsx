"use client";

import React, { useState, useRef } from "react";
import {
  Database,
  Laptop,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileCode,
  RotateCcw,
  HardDrive,
  Download,
  Upload,
} from "lucide-react";
import { dataService, isSupabaseConfigured } from "@/services";

interface SupabaseSyncBannerProps {
  onResetData?: () => void;
  onRestoreData?: (jsonString: string) => { success: boolean; message: string };
}

export function SupabaseSyncBanner({ onResetData, onRestoreData }: SupabaseSyncBannerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stats = dataService.getStorageStats();
  const isCloud = isSupabaseConfigured();

  const handleDownloadBackup = () => {
    try {
      const json = dataService.exportBackupData();
      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toTimeString().slice(0, 5).replace(":", "");
      const fileName = `respaldo_criadero_${dateStr}_${timeStr}.json`;
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar copia de seguridad: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      if (
        !window.confirm(
          `¿Confirmas que deseas restaurar la base de datos desde el archivo "${file.name}"?\nEsta acción actualizará todos los registros del criadero.`
        )
      ) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (onRestoreData) {
        const res = onRestoreData(content);
        setRestoreStatus(res);
        setTimeout(() => setRestoreStatus(null), 5000);
      } else {
        const res = dataService.importBackupData(content);
        setRestoreStatus(res);
        setTimeout(() => setRestoreStatus(null), 5000);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-950 text-white rounded-3xl p-5 sm:p-6 border border-emerald-800/40 shadow-lg relative overflow-hidden">
      {/* Input oculto para restaurar archivo JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Detalle decorativo de fondo */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mensaje flotante de restauración */}
      {restoreStatus && (
        <div
          className={`mb-3 p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 border ${
            restoreStatus.success
              ? "bg-emerald-900/90 text-emerald-200 border-emerald-600"
              : "bg-rose-900/90 text-rose-200 border-rose-600"
          }`}
        >
          <span>{restoreStatus.message}</span>
          <button
            type="button"
            onClick={() => setRestoreStatus(null)}
            className="text-stone-400 hover:text-white px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner">
            {isCloud ? <Database className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isCloud ? "Nube Supabase Conectada" : "Sincronización Local Persistente Activa"}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                {isCloud ? "Datos respaldados en PostgreSQL" : "Tus cambios se guardan automáticamente en tu navegador"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              🐴 <strong className="text-white">{stats.horsesCount}</strong> ejemplares • 🏠 <strong className="text-white">{stats.pesebrerasCount}</strong> pesebreras • 👥 <strong className="text-white">{stats.clientsCount}</strong> clientes • 💳 <strong className="text-white">{stats.paymentsCount}</strong> recibos en memoria sincronizada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Botón Descargar Copia JSON */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            title="Descargar copia de seguridad completa del sistema en archivo .json"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-semibold text-emerald-300 transition-colors border border-emerald-500/30 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Copia .JSON</span>
          </button>

          {/* Botón Restaurar Copia JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Cargar y restaurar datos desde un archivo .json"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-700/50 hover:bg-stone-700/80 text-xs font-semibold text-stone-200 transition-colors border border-stone-600/50 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-stone-300" />
            <span>Restaurar</span>
          </button>

          {onResetData && (
            <button
              type="button"
              onClick={onResetData}
              title="Restablecer todos los datos a la demostración inicial"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 transition-colors border border-rose-500/20 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-emerald-200 transition-colors border border-white/10 cursor-pointer"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Fase 3 (Supabase)</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-5 pt-4 border-t border-white/10 text-xs text-stone-300 space-y-3 animate-fade-in">
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Arquitectura de Sincronización en la Nube
            </div>
            <p className="text-stone-300 leading-relaxed">
              El sistema opera en modo persistente offline/local mediante <span className="text-emerald-300 font-mono">localStorage</span> seguro. Para conectar una base de datos remota en la nube:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-stone-400 pl-1">
              <li>
                Ejecuta el script SQL actualizado en{" "}
                <span className="text-emerald-300 font-mono">lib/supabase/schema.sql</span> en tu
                SQL Editor de Supabase (creará las 10 tablas completas, llaves foráneas, índices y RLS).
              </li>
              <li>
                Coloca tu <span className="text-emerald-300 font-mono">NEXT_PUBLIC_SUPABASE_URL</span> y{" "}
                <span className="text-emerald-300 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> en{" "}
                <span className="text-emerald-300 font-mono">.env.local</span>.
              </li>
            </ol>
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-stone-400">
              <FileCode className="w-4 h-4 text-stone-400" />
              <span>Esquema SQL incluye: clientes, pesebreras, caballos con pedigrí y dietas, sanidad, finanzas, inventario, plantillas de concentrado, canones y notificaciones.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

