"use client";

import React from "react";
import { PaymentRecord } from "@/types";
import { DollarSign, CheckCircle2, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";

interface FinanceViewProps {
  payments: PaymentRecord[];
  onMarkAsPaid: (id: string) => void;
}

export function FinanceView({ payments, onMarkAsPaid }: FinanceViewProps) {
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalCollected = payments
    .filter((p) => p.status === "pagado")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPending = payments
    .filter((p) => p.status !== "pagado")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Resumen Financiero Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-semibold tracking-wider text-emerald-200">
            Total Recaudado (Mes Actual)
          </span>
          <div className="text-3xl font-extrabold mt-2 flex items-center gap-1">
            {formatCOP(totalCollected)}
          </div>
          <p className="text-xs text-emerald-200/80 mt-2">
            Ingresos por concepto de alquiler de pesebreras y servicios
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-semibold tracking-wider text-stone-500">
            Pendiente por Cobrar
          </span>
          <div className="text-3xl font-extrabold mt-2 text-amber-700 dark:text-amber-400">
            {formatCOP(totalPending)}
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {payments.filter((p) => p.status !== "pagado").length} recibos con cobro activo
          </p>
        </div>
      </div>

      {/* Tabla de Pagos y Recibos */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
            Control de Alquileres y Facturación
          </h3>
          <span className="text-xs text-stone-500">Registros locales</span>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {payments.map((p) => (
            <div
              key={p.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                    {p.receiptNumber}
                  </span>
                  <span className="text-xs text-stone-500">Vence: {p.dueDate}</span>
                </div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                  {p.concept}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Cliente: <span className="font-semibold">{p.clientName}</span>
                  {p.horseName && ` • Equino: ${p.horseName}`}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                <div className="text-left sm:text-right">
                  <div className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                    {formatCOP(p.amount)}
                  </div>
                  <div>
                    {p.status === "pagado" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pagado ({p.paymentDate})
                      </span>
                    ) : p.status === "vencido" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Vencido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {p.status !== "pagado" && (
                  <button
                    onClick={() => onMarkAsPaid(p.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    Marcar Pagado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
