"use client";

import React, { useState } from "react";
import { Client, Horse } from "@/types";
import {
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  HeartPulse,
  Wrench,
  Search,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientsViewProps {
  clients: Client[];
  horses?: Horse[];
  onSelectHorse?: (horse: Horse) => void;
}

export function ClientsView({
  clients,
  horses = [],
  onSelectHorse,
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredClients = (clients || []).filter((c) => {
    if (!c) return false;
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      (c.fullName || "").toLowerCase().includes(term) ||
      (c.identification || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term) ||
      (c.phone || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado y Barra de Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>👥</span>
            <span>Directorio de Propietarios & Fichas de Ejemplares</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Consulta los datos del propietario y accede a la ficha técnica, historial clínico, herrajes y novedades de cada uno de sus caballos.
          </p>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cédula o email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Grid de Propietarios con sus Caballos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredClients.map((client) => {
          const clientHorses = horses.filter((h) => h.ownerId === client.id);

          return (
            <div
              key={client.id}
              className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Información Personal del Propietario */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-lg">
                      {client.fullName}
                    </h3>
                    <span className="text-xs font-mono font-bold text-stone-400">
                      {client.identification}
                    </span>
                  </div>
                  <div>
                    {client.paymentStatus === "al_dia" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Al día
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Saldo Pendiente: {formatCOP(client.outstandingBalance)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contacto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {client.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                </div>

                {/* EJEMPLARES DEL PROPIETARIO CON ACCESO A SU FICHA TÉCNICA */}
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-2">
                    Ejemplares de este Propietario ({clientHorses.length}):
                  </span>

                  {clientHorses.length === 0 ? (
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-2xl text-xs text-stone-400 text-center">
                      No registra caballos activos alojados.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientHorses.map((horse) => (
                        <div
                          key={horse.id}
                          onClick={() => onSelectHorse && onSelectHorse(horse)}
                          className="group p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-stone-200/80 dark:border-stone-700/60 transition-all cursor-pointer flex items-center justify-between gap-3"
                          title="Hacer clic para ver Ficha Técnica, Casos Clínicos, Herrajes y Novedades"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 overflow-hidden shrink-0 flex items-center justify-center font-bold">
                              {horse.imageUrl ? (
                                <img
                                  src={horse.imageUrl}
                                  alt={horse.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>🐎</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                                  {horse.name}
                                </span>
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                                  {horse.pesebreraCode || "Box"}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 truncate">
                                {horse.breed} • {horse.coatColor} • {horse.ageYears} años
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-emerald-800 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                            <span className="hidden sm:inline text-[11px]">Ver Ficha</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pie de tarjeta */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
                <span className="text-[11px]">
                  Total asignado: {clientHorses.length} {clientHorses.length === 1 ? "caballo" : "caballos"}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                  Cliente Activo ✓
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
