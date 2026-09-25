"use client";

import React from "react";
import { Client } from "@/types";
import { Phone, Mail, MapPin, CheckCircle, AlertTriangle } from "lucide-react";

interface ClientsViewProps {
  clients: Client[];
}

export function ClientsView({ clients }: ClientsViewProps) {
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Directorio de Propietarios
          </h2>
          <p className="text-xs text-stone-500">
            {clients.length} clientes vinculados con caballos alojados en las instalaciones
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-lg">
                    {client.fullName}
                  </h3>
                  <span className="text-xs font-mono text-stone-400">
                    {client.identification}
                  </span>
                </div>
                <div>
                  {client.paymentStatus === "al_dia" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Al día
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Pendiente: {formatCOP(client.outstandingBalance)}
                    </span>
                  )}
                </div>
              </div>

              {/* Información de contacto */}
              <div className="mt-4 space-y-2 text-xs text-stone-600 dark:text-stone-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {client.phone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg">
                🐴 {client.horsesCount} {client.horsesCount === 1 ? "caballo" : "caballos"}
              </span>

              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                Cliente Activo
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
