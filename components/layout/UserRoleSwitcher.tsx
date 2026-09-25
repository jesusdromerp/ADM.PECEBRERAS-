"use client";

import React, { useState, useEffect } from "react";
import { UserRole } from "@/types";
import { USER_ROLES, ROLE_LIST } from "@/lib/roles";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  ShieldCheck,
  X,
  ArrowLeftRight,
  CheckCircle2,
  Sparkles,
  Layers,
  KeyRound,
} from "lucide-react";

interface UserRoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  compact?: boolean;
}

const TAB_FRIENDLY_NAMES: Record<string, string> = {
  resumen: "Resumen General",
  pesebreras: "Boxes & Cuadras",
  caballos: "Fichas Equinas",
  propietarios: "Propietarios",
  sanidad: "Sanidad & Clínica",
  finanzas: "Facturación & Cobros",
  inventario: "Insumos & Alimento",
  ajustes: "Ajustes & Parámetros",
  operativo_montador: "Operativo & Pista",
  portal_propietario: "Portal Clientes",
};

export function UserRoleSwitcher({
  currentRole,
  onRoleChange,
  compact = false,
}: UserRoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeRoleConfig = USER_ROLES[currentRole] || USER_ROLES.admin;

  // Cerrar al pulsar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Prevenir scroll en el fondo cuando el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleSelectRole = (roleId: UserRole) => {
    onRoleChange(roleId);
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. DISPARADOR SEGÚN EL MODO (COMPACTO O TARJETA SIDEBAR) */}
      {compact ? (
        // Modo Barra Superior (Pill Compacto)
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer font-bold text-xs group"
          title="Cambiar perfil o rol del sistema"
        >
          <span className="text-base group-hover:scale-110 transition-transform">
            {activeRoleConfig.emoji}
          </span>
          <div className="text-left hidden md:block">
            <span className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-wider block leading-none">
              Perfil
            </span>
            <span className="font-extrabold text-stone-800 dark:text-stone-200 leading-tight">
              {activeRoleConfig.title}
            </span>
          </div>
          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${activeRoleConfig.color} hidden sm:inline-block`}
          >
            {activeRoleConfig.badge}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors" />
        </button>
      ) : (
        // Modo Barra Lateral (Tarjeta Ejecutiva Completa)
        <div
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          className="group w-full text-left p-3.5 rounded-2xl bg-gradient-to-br from-stone-50 via-white to-stone-100/60 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-850 border border-stone-200/90 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden"
          title="Haga clic para cambiar de rol o perfil del sistema"
        >
          {/* Cabecera de la tarjeta con estado activo */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest text-stone-500 dark:text-stone-400">
                Perfil Activo
              </span>
            </div>

            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              <span>Cambiar</span>
              <ArrowLeftRight className="w-3 h-3" />
            </div>
          </div>

          {/* Datos del Rol Activo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform shrink-0">
              {activeRoleConfig.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-stone-900 dark:text-stone-100 text-sm leading-tight truncate">
                {activeRoleConfig.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${activeRoleConfig.color} inline-block`}
                >
                  {activeRoleConfig.badge}
                </span>
              </div>
            </div>
          </div>

          {/* Subtítulo informativo del rol */}
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2.5 line-clamp-1 border-t border-stone-100 dark:border-stone-800/80 pt-2">
            {activeRoleConfig.subtitle}
          </p>
        </div>
      )}

      {/* 2. MODAL DIALOG DE CAMBIO DE ROL (FULL SCREEN BACKDROP, NUNCA CORTADO POR OVERFLOW) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          >
            {/* Barra superior con gradiente de lujo */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />

            {/* Cabecera del Modal */}
            <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800/80 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
                    Cambiar Perfil del Sistema
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Selecciona el perfil operativo para ver los módulos, permisos y vistas específicas de cada función.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Informativo del Perfil Activo */}
            <div className="px-4 sm:px-5 py-2.5 bg-stone-50/80 dark:bg-stone-850/60 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-500 dark:text-stone-400 font-medium">
                  Sesión activa como:
                </span>
                <span className="font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>{activeRoleConfig.emoji}</span>
                  <span>{activeRoleConfig.title}</span>
                </span>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${activeRoleConfig.color}`}>
                {activeRoleConfig.badge}
              </span>
            </div>

            {/* Listado de los 6 Roles Disponibles */}
            <div className="overflow-y-auto p-3 sm:p-5 space-y-2.5 max-h-[60vh] scrollbar-thin">
              {ROLE_LIST.map((role) => {
                const isSelected = role.id === currentRole;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role.id)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-50/90 to-teal-50/40 dark:from-emerald-950/40 dark:to-stone-900 border-emerald-500/70 shadow-sm ring-2 ring-emerald-500/20"
                        : "bg-white dark:bg-stone-850/50 border-stone-200/90 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 hover:bg-stone-50/80 dark:hover:bg-stone-800/60 hover:translate-x-0.5"
                    }`}
                  >
                    {/* Lado izquierdo: Emoji + Títulos + Módulos */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200/70 dark:border-stone-700/60 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {role.emoji}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 leading-tight">
                            {role.title}
                          </h4>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${role.color}`}
                          >
                            {role.badge}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                            /{role.id}
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-snug">
                          {role.subtitle}
                        </p>

                        {/* Módulos Habilitados en este Rol */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-0.5">
                            <Layers className="w-3 h-3 text-stone-400" />
                            Accesos:
                          </span>
                          {role.id === "admin" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              Acceso Total Maestro (10 Módulos)
                            </span>
                          ) : (
                            role.allowedTabs.slice(0, 4).map((tabId) => (
                              <span
                                key={tabId}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60"
                              >
                                {TAB_FRIENDLY_NAMES[tabId] || tabId}
                              </span>
                            ))
                          )}
                          {role.allowedTabs.length > 4 && role.id !== "admin" && (
                            <span className="text-[10px] text-stone-400 font-bold">
                              +{role.allowedTabs.length - 4} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lado derecho: Estado de Selección */}
                    <div className="flex items-center justify-end sm:justify-center shrink-0 self-end sm:self-center pl-2">
                      {isSelected ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ACTIVO</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200">
                          Seleccionar →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pie del Modal */}
            <div className="p-3.5 sm:p-4 bg-stone-50 dark:bg-stone-850/80 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                El cambio adapta el menú y permisos instantáneamente sin recargar la página.
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Portal de Acceso / Login</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
