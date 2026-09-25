"use client";

import React, { useState } from "react";
import {
  Horse,
  Client,
  PaymentRecord,
  HorseRetirementPayload,
  HorseRetirementReason,
} from "@/types";
import {
  AlertTriangle,
  CheckCircle,
  X,
  ShieldAlert,
  DollarSign,
  FileText,
  UserX,
  Truck,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RetireHorseModalProps {
  isOpen: boolean;
  onClose: () => void;
  horse: Horse | null;
  owner: Client | null;
  payments: PaymentRecord[];
  onConfirmRetire: (payload: HorseRetirementPayload) => void;
}

export function RetireHorseModal({
  isOpen,
  onClose,
  horse,
  owner,
  payments,
  onConfirmRetire,
}: RetireHorseModalProps) {
  const [reason, setReason] = useState<HorseRetirementReason>("venta_traslado");
  const [notes, setNotes] = useState("");
  const [destination, setDestination] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("Administración");
  const [allowWithDebt, setAllowWithDebt] = useState(false);

  if (!isOpen || !horse) return null;

  // Filtrar pagos pendientes o vencidos para este caballo o su dueño
  const horsePayments = payments.filter(
    (p) =>
      (p.horseId === horse.id || (owner && p.clientId === owner.id)) &&
      (p.status === "pendiente" || p.status === "vencido")
  );

  const totalDebt = horsePayments.reduce((acc, p) => acc + p.amount, 0);
  const hasDebt = Boolean(totalDebt > 0 || (owner && owner.outstandingBalance > 0));
  const effectiveDebt = Math.max(totalDebt, owner?.outstandingBalance || 0);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDebt && !allowWithDebt) {
      alert("Debes marcar la casilla de autorización para retirar el ejemplar con saldo pendiente.");
      return;
    }

    onConfirmRetire({
      horseId: horse.id,
      reason,
      notes: notes.trim() || undefined,
      destination: destination.trim() || undefined,
      authorizedBy: authorizedBy.trim() || "Administrador",
      allowWithDebt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6 max-h-[92vh] overflow-y-auto relative">
        {/* Encabezado con Botón X */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                Protocolo de Retiro & Baja
              </span>
              <h3 className="text-xl font-black text-stone-900 dark:text-stone-100 mt-1">
                Retirar Ejemplar: {horse.name}
              </h3>
              <p className="text-xs text-stone-500">
                Box actual: {horse.pesebreraCode || "Sin box"} • Propietario: {horse.ownerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 transition-colors cursor-pointer"
            title="Cancelar y cerrar (X)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. AUDITORÍA FINANCIERA (PAZ Y SALVO) */}
        <div className="space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-stone-400 block">
            1. Estado de Paz y Salvo Financiero
          </span>

          {hasDebt ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-extrabold text-rose-900 dark:text-rose-200">
                    Advertencia: Saldo Pendiente de Pago
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                    El propietario presenta una deuda acumulada de{" "}
                    <span className="font-black underline">{formatCOP(effectiveDebt)}</span> en el criadero.
                  </p>
                </div>
              </div>

              {horsePayments.length > 0 && (
                <div className="bg-white/80 dark:bg-stone-900/80 p-3 rounded-xl border border-rose-200/60 dark:border-rose-900/40 space-y-1.5 text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300 block text-[11px]">
                    Recibos pendientes asociados:
                  </span>
                  <ul className="space-y-1">
                    {horsePayments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400">
                        <span>• {p.concept} ({p.receiptNumber})</span>
                        <span className="font-bold text-rose-700 dark:text-rose-400">{formatCOP(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <label className="flex items-start gap-2.5 p-2 rounded-xl bg-rose-100/70 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowWithDebt}
                  onChange={(e) => setAllowWithDebt(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-rose-900 dark:text-rose-200 font-bold leading-tight">
                  Autorizo explícitamente el retiro del ejemplar a pesar de tener saldo pendiente de pago.
                </span>
              </label>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                  A Paz y Salvo Financiero
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  El ejemplar y su propietario no registran cobros vencidos. Aprobado para retiro.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2. FORMULARIO DE MOTIVO Y DETALLES */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-stone-400 block">
            2. Motivo del Retiro y Destino
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Motivo del Retiro: *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as HorseRetirementReason)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="venta_traslado">Venta / Traslado a otro criadero</option>
                <option value="salida_propietario">Salida definitiva solicitada por el dueño</option>
                <option value="fallecimiento">Fallecimiento / Baja biológica</option>
                <option value="potrero_descanso">Pase a potrero de descanso definitivo</option>
                <option value="error_registro">Error de digitación o registro duplicado</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Lugar de Destino / Receptor:
              </label>
              <div className="relative">
                <Truck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="ej: Criadero La Ilusión, Vía Rionegro"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Observaciones / Bitácora de Salida:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalla cualquier novedad adicional (ej: 'Se entrega con pasaporte al día, herraduras recién puestas, guía de movilización ICA # 928374')..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-600 resize-none text-xs"
            />
          </div>

          <div className="text-xs">
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Autorizado por (Responsable):
            </label>
            <input
              type="text"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              placeholder="Nombre del Administrador o Mayordomo"
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-600 text-xs font-semibold"
            />
          </div>

          {/* Información sobre liberación de box */}
          {horse.pesebreraCode && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span className="text-base">📦</span>
              <span>
                Al confirmar, la pesebrera <strong>{horse.pesebreraCode}</strong> quedará liberada y disponible automáticamente.
              </span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={hasDebt && !allowWithDebt}
              className={`gap-1.5 cursor-pointer font-bold text-xs ${
                hasDebt && !allowWithDebt
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>Confirmar Retiro del Ejemplar</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
