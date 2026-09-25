"use client";

import React, { useState } from "react";
import { Pesebrera, PesebreraStatus } from "@/types";
import { Building2, CheckCircle2, AlertCircle, Wrench, ShieldAlert } from "lucide-react";

interface PesebrerasViewProps {
  pesebreras: Pesebrera[];
  onStatusChange: (id: string, status: PesebreraStatus) => void;
}

export function PesebrerasView({ pesebreras, onStatusChange }: PesebrerasViewProps) {
  const [filter, setFilter] = useState<string>("todas");

  const filteredPesebreras = pesebreras.filter((box) => {
    if (filter === "todas") return true;
    return box.status === filter;
  });

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: PesebreraStatus) => {
    switch (status) {
      case "disponible":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disponible
          </span>
        );
      case "ocupada":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
            Ocupada
          </span>
        );
      case "mantenimiento":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <Wrench className="w-3.5 h-3.5" />
            Mantenimiento
          </span>
        );
      case "cuarentena":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            Cuarentena
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "todas", label: `Todas (${pesebreras.length})` },
            {
              id: "disponible",
              label: `Disponibles (${pesebreras.filter((b) => b.status === "disponible").length})`,
            },
            {
              id: "ocupada",
              label: `Ocupadas (${pesebreras.filter((b) => b.status === "ocupada").length})`,
            },
            {
              id: "mantenimiento",
              label: `Mantenimiento (${pesebreras.filter((b) => b.status === "mantenimiento").length})`,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                filter === item.id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
          <span>Dimensiones estándar: 3.5m x 3.5m</span>
        </div>
      </div>

      {/* Cuadrícula de Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPesebreras.map((box) => (
          <div
            key={box.id}
            className={`border rounded-2xl p-5 bg-white dark:bg-stone-900 transition-all duration-200 hover:shadow-md ${
              box.status === "disponible"
                ? "border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300"
                : box.status === "ocupada"
                ? "border-stone-200/90 dark:border-stone-800"
                : "border-amber-200 dark:border-amber-900/50"
            }`}
          >
            {/* Cabecera del Box */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  {box.code}
                </span>
                <h3 className="mt-1.5 font-bold text-stone-900 dark:text-stone-100 text-lg">
                  {box.name}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">{box.zone}</p>
              </div>
              <div>{getStatusBadge(box.status)}</div>
            </div>

            {/* Caballo asignado o estado libre */}
            <div className="mt-4 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
              {box.status === "ocupada" && box.horseName ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                    🐎
                  </div>
                  <div className="truncate">
                    <span className="text-xs text-stone-400 block font-medium">Huésped actual</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate block">
                      {box.horseName}
                    </span>
                  </div>
                </div>
              ) : box.status === "disponible" ? (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                  <Building2 className="w-4 h-4" />
                  <span>Espacio listo para asignación</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  <Wrench className="w-4 h-4" />
                  <span>En mantenimiento o acondicionamiento</span>
                </div>
              )}
            </div>

            {/* Detalles: Tipo, Dimensiones, Precio */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-stone-100 dark:border-stone-800/80 pt-3 text-stone-600 dark:text-stone-400">
              <div>
                <span className="block text-stone-400 font-normal">Tipo</span>
                <span className="font-medium capitalize">{box.type}</span>
              </div>
              <div className="text-right">
                <span className="block text-stone-400 font-normal">Canon Mensual</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {formatCOP(box.monthlyPrice)}
                </span>
              </div>
            </div>

            {box.notes && (
              <p className="mt-2.5 text-xs text-stone-500 dark:text-stone-400 italic line-clamp-1">
                &ldquo;{box.notes}&rdquo;
              </p>
            )}

            {/* Acciones interactivas locales */}
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
              <span className="text-stone-400">Cambiar estado:</span>
              <div className="flex items-center gap-1.5">
                {box.status !== "disponible" && (
                  <button
                    onClick={() => onStatusChange(box.id, "disponible")}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Liberar
                  </button>
                )}
                {box.status !== "mantenimiento" && (
                  <button
                    onClick={() => onStatusChange(box.id, "mantenimiento")}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    Mantenimiento
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
