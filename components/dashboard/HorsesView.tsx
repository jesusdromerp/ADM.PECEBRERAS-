"use client";

import React, { useState } from "react";
import { Horse, HorseHealthStatus, UserRole } from "@/types";
import {
  Search,
  Plus,
  HeartPulse,
  ShieldCheck,
  Clock,
  AlertCircle,
  Award,
  Wrench,
  ChevronRight,
  UserX,
  LayoutGrid,
  Maximize2,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorsesViewProps {
  horses: Horse[];
  onOpenNewHorseModal: () => void;
  onSelectHorse: (horse: Horse) => void;
  onRetireHorse?: (horse: Horse) => void;
  onOpenTreatmentModal?: (horse?: Horse) => void;
  currentUserRole?: UserRole;
}

export function HorsesView({
  horses,
  onOpenNewHorseModal,
  onSelectHorse,
  onRetireHorse,
  onOpenTreatmentModal,
  currentUserRole = "admin",
}: HorsesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  // Fichas compactas por defecto para que se amolden perfectamente al sistema
  const [cardSize, setCardSize] = useState<"compact" | "detailed">("compact");

  const today = new Date().toISOString().split("T")[0];

  const filteredHorses = (horses || []).filter((horse) => {
    if (!horse) return false;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (horse.name || "").toLowerCase().includes(term) ||
      (horse.breed || "").toLowerCase().includes(term) ||
      (horse.ownerName || "").toLowerCase().includes(term) ||
      (horse.pesebreraCode || "").toLowerCase().includes(term);

    const matchesStatus =
      selectedStatus === "todos" || horse.healthStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getHealthBadge = (status: HorseHealthStatus, compact: boolean = false) => {
    switch (status) {
      case "optimo":
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 backdrop-blur-md ${
              compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"
            }`}
          >
            <ShieldCheck className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            Óptimo
          </span>
        );
      case "en_tratamiento":
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-bold bg-rose-500/25 text-rose-200 border border-rose-400/40 backdrop-blur-md ${
              compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"
            }`}
          >
            <HeartPulse className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            En tratamiento
          </span>
        );
      case "reposo":
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-bold bg-amber-500/25 text-amber-200 border border-amber-400/40 backdrop-blur-md ${
              compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"
            }`}
          >
            <Clock className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            Reposo
          </span>
        );
      case "observacion":
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full font-bold bg-purple-500/25 text-purple-200 border border-purple-400/40 backdrop-blur-md ${
              compact ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"
            }`}
          >
            <AlertCircle className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
            Observación
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Barra de Acciones, Búsqueda y Selector de Tamaño */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, raza o propietario..."
            className="w-full pl-10 pr-4 py-1.5 sm:py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Selector de modo: Fichas Compactas vs Detalladas */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/90 p-1 rounded-xl border border-stone-200/80 dark:border-stone-700/80 flex-shrink-0">
            <button
              type="button"
              onClick={() => setCardSize("compact")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cardSize === "compact"
                  ? "bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
              }`}
              title="Fichas compactas amoldadas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Compacta</span>
            </button>
            <button
              type="button"
              onClick={() => setCardSize("detailed")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cardSize === "detailed"
                  ? "bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300 shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
              }`}
              title="Fichas detalladas"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Detallada</span>
            </button>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer flex-shrink-0"
          >
            <option value="todos">Todos los estados</option>
            <option value="optimo">Óptimo</option>
            <option value="en_tratamiento">En tratamiento</option>
            <option value="reposo">Reposo</option>
            <option value="observacion">Observación</option>
          </select>

          {currentUserRole !== "veterinario" ? (
            <Button
              onClick={onOpenNewHorseModal}
              size="sm"
              className="gap-1.5 whitespace-nowrap cursor-pointer shadow-xs text-xs font-bold flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Registrar Equino</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          ) : onOpenTreatmentModal ? (
            <Button
              onClick={() => onOpenTreatmentModal()}
              size="sm"
              className="gap-1.5 whitespace-nowrap cursor-pointer shadow-xs text-xs font-bold flex-shrink-0 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>+ Nuevo Tratamiento</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Grid de Tarjetas de Caballos (Modo Compacto o Detallado) */}
      <div
        className={
          cardSize === "compact"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        }
      >
        {filteredHorses.map((horse) => {
          const isFarrierOverdue = Boolean(
            horse.farrierControl && horse.farrierControl.nextShoeingDate < today
          );
          const hasPedigree = Boolean(
            horse.pedigree && (horse.pedigree.sire || horse.pedigree.dam)
          );

          if (cardSize === "compact") {
            // ========================================================
            // VISTA COMPACTA: AMOLDADA, ELEGANTE Y DE MENOR TAMAÑO
            // ========================================================
            return (
              <div
                key={horse.id}
                onClick={() => onSelectHorse(horse)}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Foto de Caballo Compacta */}
                  <div className="relative h-28 w-full bg-stone-800 overflow-hidden">
                    {horse.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={horse.imageUrl}
                        alt={horse.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-stone-800 text-stone-500">
                        🐎
                      </div>
                    )}

                    {/* Gradiente oscuro inferior */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    {/* Badges superiores compactos */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-md text-emerald-300 border border-emerald-500/30 truncate">
                        {horse.pesebreraCode || "Sin Box"}
                      </span>
                      <div>{getHealthBadge(horse.healthStatus, true)}</div>
                    </div>

                    {/* Nombre y Raza sobre la foto */}
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                      <h3 className="font-extrabold text-sm leading-tight truncate drop-shadow-sm">
                        {horse.name}
                      </h3>
                      <p className="text-[11px] text-stone-200 font-medium truncate drop-shadow-xs">
                        {horse.breed} • {horse.ageYears} años
                      </p>
                    </div>
                  </div>

                  {/* Etiquetas de Estado en una Fila Compacta */}
                  <div className="px-3 py-1.5 border-b border-stone-100 dark:border-stone-800/80 flex items-center gap-1.5 flex-wrap text-[10px]">
                    {hasPedigree ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/60 dark:border-amber-900/50">
                        <Award className="w-3 h-3 text-amber-600 flex-shrink-0" />
                        Pedigrí
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                        S/P
                      </span>
                    )}

                    {horse.farrierControl ? (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold border ${
                          isFarrierOverdue
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        <Wrench className="w-2.5 h-2.5 flex-shrink-0" />
                        {isFarrierOverdue ? "Herraje Vencido" : "Herraje al Día"}
                      </span>
                    ) : null}

                    {horse.diseaseHistory && horse.diseaseHistory.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-medium">
                        <HeartPulse className="w-2.5 h-2.5 flex-shrink-0" />
                        {horse.diseaseHistory.length}{" "}
                        {horse.diseaseHistory.length === 1 ? "afec." : "afec."}
                      </span>
                    )}

                    {horse.planName && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-900/50 truncate max-w-[120px]">
                        🏷️ {horse.planName.replace("Pesebrera ", "")}
                      </span>
                    )}
                  </div>

                  {/* Ficha Técnica Rápida en 2 Columnas Compactas */}
                  <div className="p-2.5 sm:p-3 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="min-w-0">
                        <span className="text-stone-400 block font-normal text-[10px] leading-tight">
                          Sexo / Capa
                        </span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200 capitalize truncate block">
                          {horse.gender} • {horse.coatColor}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-stone-400 block font-normal text-[10px] leading-tight">
                          Propietario
                        </span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">
                          {horse.ownerName}
                        </span>
                      </div>
                    </div>

                    {/* Genealogía en línea resumida */}
                    {horse.pedigree?.sire && (
                      <div className="bg-stone-50 dark:bg-stone-800/50 px-2 py-1 rounded-lg text-[10px] text-stone-600 dark:text-stone-300 truncate">
                        <span className="font-bold text-stone-700 dark:text-stone-200">
                          ♂ {horse.pedigree.sire}
                        </span>
                        {horse.pedigree.dam && (
                          <span className="text-stone-400 dark:text-stone-500">
                            {" "}• ♀ {horse.pedigree.dam}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Compacto */}
                <div className="px-3 py-2 bg-stone-50/80 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 group-hover:text-emerald-600 transition-colors">
                    <span>Ver Ficha</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>

                  {currentUserRole === "veterinario" && onOpenTreatmentModal ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTreatmentModal(horse);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                      title="Prescribir tratamiento para este ejemplar"
                    >
                      🩺 Tratamiento
                    </button>
                  ) : currentUserRole === "admin" && onRetireHorse ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetireHorse(horse);
                      }}
                      className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/80 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Retirar / Dar de baja este ejemplar (Solo Super Admin)"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          }

          // ========================================================
          // VISTA DETALLADA: CON ESPACIO EXPANDIDO
          // ========================================================
          return (
            <div
              key={horse.id}
              onClick={() => onSelectHorse(horse)}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Imagen del Caballo con Overlay */}
                <div className="relative h-44 w-full bg-stone-800 overflow-hidden">
                  {horse.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={horse.imageUrl}
                      alt={horse.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-stone-800 text-stone-500">
                      🐎
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                      {horse.pesebreraCode || "Sin Box"}
                    </span>
                    <div>{getHealthBadge(horse.healthStatus, false)}</div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-black text-lg leading-tight drop-shadow-sm">
                      {horse.name}
                    </h3>
                    <p className="text-xs text-stone-200 drop-shadow-sm font-medium">
                      {horse.breed} • {horse.ageYears} años
                    </p>
                  </div>
                </div>

                {/* Etiquetas de Estado */}
                <div className="p-4 border-b border-stone-100 dark:border-stone-800/80 flex items-center gap-2 flex-wrap text-[11px]">
                  {hasPedigree ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/60 dark:border-amber-900/50">
                      <Award className="w-3 h-3 text-amber-600" />
                      Con Pedigrí
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                      Sin pedigrí
                    </span>
                  )}

                  {horse.farrierControl ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                        isFarrierOverdue
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      <Wrench className="w-3 h-3" />
                      {isFarrierOverdue ? "Herraje Vencido" : "Herraje al Día"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                      Sin herraje
                    </span>
                  )}

                  {horse.diseaseHistory && horse.diseaseHistory.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-medium">
                      <HeartPulse className="w-3 h-3" />
                      {horse.diseaseHistory.length}{" "}
                      {horse.diseaseHistory.length === 1 ? "afección" : "afecciones"}
                    </span>
                  )}

                  {horse.planName && currentUserRole !== "veterinario" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-900/50">
                      🏷️ {horse.planName}
                      {horse.planPriceCOP && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                          (${new Intl.NumberFormat("es-CO").format(horse.planPriceCOP)}/mes)
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Ficha Técnica Rápida */}
                <div className="p-4 space-y-2.5 text-xs text-stone-600 dark:text-stone-400">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-stone-400 block font-normal text-[11px]">
                        Sexo / Capa
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 capitalize">
                        {horse.gender} • {horse.coatColor}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block font-normal text-[11px]">
                        Propietario
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">
                        {horse.ownerName}
                      </span>
                    </div>
                  </div>

                  {horse.pedigree?.sire && (
                    <div className="bg-stone-50 dark:bg-stone-800/40 p-2 rounded-xl text-[11px] text-stone-600 dark:text-stone-300">
                      <span className="font-semibold text-stone-700 dark:text-stone-200 block">
                        Padre: {horse.pedigree.sire}
                      </span>
                      {horse.pedigree.dam && (
                        <span>Madre: {horse.pedigree.dam}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Botón inferior */}
              <div className="px-4 py-3 bg-stone-50/80 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400 group-hover:text-emerald-600 transition-colors">
                  <span>Ver Ficha Técnica & Pedigrí</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>

                {currentUserRole === "admin" && onRetireHorse && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetireHorse(horse);
                    }}
                    className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/80 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Retirar / Dar de baja este ejemplar (Solo Super Admin)"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredHorses.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 p-8">
          <p className="text-stone-500 text-sm">
            No se encontraron equinos con los criterios seleccionados.
          </p>
        </div>
      )}
    </div>
  );
}
