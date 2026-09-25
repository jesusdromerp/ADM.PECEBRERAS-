"use client";

import React from "react";
import { VeterinaryRecord } from "@/types";
import { HeartPulse, Calendar, CheckCircle2, Clock } from "lucide-react";

interface VeterinaryViewProps {
  records: VeterinaryRecord[];
}

export function VeterinaryView({ records }: VeterinaryViewProps) {
  const formatCOP = (val?: number) => {
    if (!val) return "—";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTypeBadge = (type: VeterinaryRecord["type"]) => {
    const map = {
      medicamento: { label: "Medicamento", color: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300" },
      vacuna: { label: "Vacuna", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
      desparasitacion: { label: "Desparasitación", color: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300" },
      herraje: { label: "Herraje", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
      control: { label: "Control", color: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
    };
    const item = map[type];
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${item.color}`}>
        {item.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            Sanidad, Medicamentos y Registros Veterinarios
          </h2>
          <p className="text-xs text-stone-500">
            Monitoreo clínico, cronograma de vacunación y tratamientos activos
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {records.map((rec) => (
          <div
            key={rec.id}
            className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {getTypeBadge(rec.type)}
                <span className="text-xs font-semibold text-stone-500">
                  Paciente: <strong className="text-stone-900 dark:text-stone-100">{rec.horseName}</strong>
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {rec.date}
                </span>
              </div>

              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                {rec.title}
              </h4>

              {rec.dosage && (
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  <span className="font-medium">Posología:</span> {rec.dosage}
                </p>
              )}

              <p className="text-xs text-stone-500">
                Responsable: <span className="font-medium text-stone-700 dark:text-stone-300">{rec.administeredBy}</span>
              </p>

              {rec.notes && (
                <p className="text-xs text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/40 p-2 rounded-lg mt-1">
                  &ldquo;{rec.notes}&rdquo;
                </p>
              )}
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-stone-100 dark:border-stone-800 gap-2">
              <div>
                {rec.status === "completado" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    En curso
                  </span>
                )}
              </div>

              {rec.nextDueDate && (
                <span className="text-xs text-stone-500 font-medium">
                  Próximo control: {rec.nextDueDate}
                </span>
              )}

              {rec.cost && (
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  {formatCOP(rec.cost)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
