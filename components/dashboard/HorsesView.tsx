"use client";

import React, { useState } from "react";
import { Horse, HorseHealthStatus } from "@/types";
import { Search, Plus, HeartPulse, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorsesViewProps {
  horses: Horse[];
  onOpenNewHorseModal: () => void;
}

export function HorsesView({ horses, onOpenNewHorseModal }: HorsesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");

  const filteredHorses = horses.filter((horse) => {
    const matchesSearch =
      horse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horse.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      horse.ownerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "todos" || horse.healthStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getHealthBadge = (status: HorseHealthStatus) => {
    switch (status) {
      case "optimo":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Óptimo
          </span>
        );
      case "en_tratamiento":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <HeartPulse className="w-3.5 h-3.5" />
            En tratamiento
          </span>
        );
      case "reposo":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Reposo
          </span>
        );
      case "observacion":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
            <AlertCircle className="w-3.5 h-3.5" />
            Observación
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Acciones y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, raza o propietario..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos los estados de salud</option>
            <option value="optimo">Óptimo</option>
            <option value="en_tratamiento">En tratamiento</option>
            <option value="reposo">Reposo</option>
            <option value="observacion">Observación</option>
          </select>

          <Button
            onClick={onOpenNewHorseModal}
            size="sm"
            className="gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Equino
          </Button>
        </div>
      </div>

      {/* Grid de Tarjetas de Caballos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHorses.map((horse) => (
          <div
            key={horse.id}
            className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Encabezado con Avatar y Badges */}
              <div className="p-5 pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-2xl shadow-inner">
                      🐎
                    </div>
                    <div>
                      <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base leading-tight">
                        {horse.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {horse.breed} • {horse.ageYears} años
                      </p>
                    </div>
                  </div>
                  <div>{getHealthBadge(horse.healthStatus)}</div>
                </div>
              </div>

              {/* Ficha Técnica */}
              <div className="p-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-stone-600 dark:text-stone-400">
                  <div>
                    <span className="text-stone-400 block font-normal">Sexo / Capa</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 capitalize">
                      {horse.gender} • {horse.coatColor}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-normal">Pesebrera</span>
                    {horse.pesebreraCode ? (
                      <span className="inline-block font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                        {horse.pesebreraCode}
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-medium italic">
                        Sin asignar
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-stone-100 dark:border-stone-800/80 pt-2.5">
                  <span className="text-stone-400 block font-normal">Propietario</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100 text-sm">
                    {horse.ownerName}
                  </span>
                </div>

                {horse.microchip && (
                  <div className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <span className="font-mono text-[11px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                      Chip: {horse.microchip}
                    </span>
                  </div>
                )}

                {horse.dietNotes && (
                  <div className="bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300">
                    <span className="font-semibold block text-stone-700 dark:text-stone-200 mb-0.5">
                      Dieta / Manejo:
                    </span>
                    {horse.dietNotes}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 bg-stone-50/80 dark:bg-stone-800/30 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
              <span>Registrado: {new Date(horse.createdAt).toLocaleDateString()}</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Activo</span>
            </div>
          </div>
        ))}
      </div>

      {filteredHorses.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8">
          <p className="text-stone-500 text-sm">
            No se encontraron equinos con los criterios seleccionados.
          </p>
        </div>
      )}
    </div>
  );
}
