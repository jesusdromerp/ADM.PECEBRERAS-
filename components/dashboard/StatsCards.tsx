import React from "react";
import { DashboardMetrics } from "@/types";
import { Building2, HeartPulse, Users, DollarSign, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  metrics: DashboardMetrics;
}

export function StatsCards({ metrics }: StatsCardsProps) {
  // Formateador de moneda en pesos colombianos (COP)
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Ocupación de Pesebreras */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Pesebreras / Boxes
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">
              {metrics.occupiedBoxes}
            </span>
            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
              / {metrics.totalBoxes} ocupadas
            </span>
          </div>
          {/* Barra de progreso */}
          <div className="mt-3 w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.occupancyRate}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>{metrics.occupancyRate}% Ocupación</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              {metrics.availableBoxes} disponibles
            </span>
          </div>
        </div>
      </div>

      {/* 2. Caballos en el Centro */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Equinos Registrados
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <span className="text-lg">🐎</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">
              {metrics.totalHorses}
            </span>
            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
              caballos activos
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {metrics.totalHorses - metrics.horsesInTreatment} Óptimos
            </span>
            {metrics.horsesInTreatment > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-medium">
                <HeartPulse className="w-3 h-3 text-rose-600" />
                {metrics.horsesInTreatment} en cuidado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Propietarios / Clientes */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Propietarios
          </span>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-50">
              {metrics.activeClients}
            </span>
            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
              clientes vinculados
            </span>
          </div>
          <p className="mt-4 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">100%</span> con
            información de contacto al día
          </p>
        </div>
      </div>

      {/* 4. Recaudo y Facturación Mensual */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Recaudo del Mes
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 truncate">
            {formatCOP(metrics.monthlyRevenue)}
          </div>
          {metrics.pendingPaymentsCount > 0 ? (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {metrics.pendingPaymentsCount} pendiente ({formatCOP(metrics.pendingPaymentsTotal)})
              </span>
            </div>
          ) : (
            <div className="mt-3 text-xs text-emerald-700 font-medium">
              Al día en cobros de pesebreras
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
