"use client";

import React, { useState } from "react";
import { CenterSettings } from "@/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  X,
  Settings,
  Building2,
  Save,
  CheckCircle2,
  ExternalLink,
  Moon,
  Sun,
} from "lucide-react";

interface QuickSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  centerSettings: CenterSettings;
  onUpdateCenterSettings: (settings: Partial<CenterSettings>) => void;
  onNavigateToSettings: () => void;
}

export function QuickSettingsDrawer({
  isOpen,
  onClose,
  centerSettings,
  onUpdateCenterSettings,
  onNavigateToSettings,
}: QuickSettingsDrawerProps) {
  const [stableName, setStableName] = useState(centerSettings.stableName);
  const [tagline, setTagline] = useState(centerSettings.tagline || "");
  const [veterinarianName, setVeterinarianName] = useState(centerSettings.veterinarianName);
  const [veterinarianLicense, setVeterinarianLicense] = useState(centerSettings.veterinarianLicense);
  const [bankDetails, setBankDetails] = useState(centerSettings.bankDetails);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sincronizar cuando cambien las configuraciones externas
  React.useEffect(() => {
    setStableName(centerSettings.stableName);
    setTagline(centerSettings.tagline || "");
    setVeterinarianName(centerSettings.veterinarianName);
    setVeterinarianLicense(centerSettings.veterinarianLicense);
    setBankDetails(centerSettings.bankDetails);
  }, [centerSettings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCenterSettings({
      stableName: stableName.trim(),
      tagline: tagline.trim() || undefined,
      veterinarianName: veterinarianName.trim(),
      veterinarianLicense: veterinarianLicense.trim(),
      bankDetails: bankDetails.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fondo difuminado */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Panel lateral deslizante (Un lado de la pantalla) */}
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 h-full shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col z-10 transition-transform duration-300 animate-in slide-in-from-right">
        {/* Encabezado del Panel Lateral */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                Configuración Lateral
              </h3>
              <p className="text-[11px] text-stone-500">Parámetros rápidos y tema</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de guardado exitoso */}
        {savedSuccess && (
          <div className="mx-4 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>¡Parámetros actualizados en todo el sistema!</span>
          </div>
        )}

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 1. MODO OSCURO / CLARO */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900 dark:text-stone-100 text-xs block">
                  Tema Visual
                </span>
                <span className="text-[11px] text-stone-500">
                  Alterna entre Modo Claro y Oscuro
                </span>
              </div>
              <ThemeToggle showLabel />
            </div>
          </div>

          {/* 2. FORMULARIO RÁPIDO DE PARÁMETROS */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
              <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider">
                Datos de la Pesebrera
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                Nombre de la Pesebrera / Criadero *
              </label>
              <input
                type="text"
                required
                value={stableName}
                onChange={(e) => setStableName(e.target.value)}
                placeholder="ej: Hacienda & Pesebreras San Isidro"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <span className="text-[10px] text-stone-400 block mt-0.5">
                Se refleja en vivo en el encabezado superior y en pasaportes Word
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                Lema o Subtítulo Institucional
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="ej: Centro Integral de Alojamiento Equino"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Médico Veterinario *
                </label>
                <input
                  type="text"
                  required
                  value={veterinarianName}
                  onChange={(e) => setVeterinarianName(e.target.value)}
                  placeholder="ej: Dr. Juan Pablo Morales (MVZ)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Matrícula COMVEZCOL *
                </label>
                <input
                  type="text"
                  required
                  value={veterinarianLicense}
                  onChange={(e) => setVeterinarianLicense(e.target.value)}
                  placeholder="ej: COMVEZCOL # 19.842"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                Cuenta Bancaria (Recibos WhatsApp y Word)
              </label>
              <textarea
                rows={3}
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Bancolombia Cuenta de Ahorros..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-mono"
              />
            </div>

            <Button type="submit" size="sm" className="w-full gap-2 cursor-pointer shadow-xs">
              <Save className="w-4 h-4" />
              <span>Guardar en Todo el Sistema</span>
            </Button>
          </form>

          {/* Acceso directo al módulo completo de Ajustes */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={() => {
                onClose();
                onNavigateToSettings();
              }}
              className="w-full p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Ver Configuración Completa de Propietarios y Catálogo</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
