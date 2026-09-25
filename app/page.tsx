"use client";

import React, { useState } from "react";
import { dataService, localStore } from "@/services";
import { Pesebrera, Horse, Client, VeterinaryRecord, PaymentRecord, PesebreraStatus } from "@/types";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PesebrerasView } from "@/components/dashboard/PesebrerasView";
import { HorsesView } from "@/components/dashboard/HorsesView";
import { ClientsView } from "@/components/dashboard/ClientsView";
import { VeterinaryView } from "@/components/dashboard/VeterinaryView";
import { FinanceView } from "@/components/dashboard/FinanceView";
import { NewHorseModal } from "@/components/dashboard/NewHorseModal";
import { SupabaseSyncBanner } from "@/components/dashboard/SupabaseSyncBanner";
import {
  LayoutDashboard,
  Building2,
  Users,
  HeartPulse,
  DollarSign,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ActiveTab = "resumen" | "pesebreras" | "caballos" | "propietarios" | "sanidad" | "finanzas";

export default function HomePage() {
  // Estado local reactivo conectado a nuestro almacén de servicios
  const [pesebreras, setPesebreras] = useState<Pesebrera[]>(() => dataService.getPesebreras());
  const [horses, setHorses] = useState<Horse[]>(() => dataService.getHorses());
  const [clients, setClients] = useState<Client[]>(() => dataService.getClients());
  const [vetRecords, setVetRecords] = useState<VeterinaryRecord[]>(() =>
    dataService.getVeterinaryRecords()
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(() => dataService.getPayments());

  const [activeTab, setActiveTab] = useState<ActiveTab>("resumen");
  const [isNewHorseModalOpen, setIsNewHorseModalOpen] = useState(false);

  // Recalcular métricas en tiempo real según el estado actual
  const metrics = dataService.getMetrics();

  // Acciones interactivas locales
  const handleStatusChange = (boxId: string, newStatus: PesebreraStatus) => {
    dataService.updatePesebreraStatus(boxId, newStatus);
    setPesebreras(dataService.getPesebreras());
    setHorses(dataService.getHorses());
  };

  const handleAddHorse = (horseData: Omit<Horse, "id" | "createdAt" | "updatedAt">) => {
    dataService.addHorse(horseData);
    setHorses(dataService.getHorses());
    setPesebreras(dataService.getPesebreras());
    setClients(dataService.getClients());
  };

  const handleMarkPaymentAsPaid = (paymentId: string) => {
    dataService.markPaymentAsPaid(paymentId);
    setPayments(dataService.getPayments());
  };

  const availableBoxes = pesebreras.filter((b) => b.status === "disponible");

  const navigationTabs = [
    { id: "resumen", label: "Resumen General", icon: LayoutDashboard },
    { id: "pesebreras", label: `Pesebreras (${pesebreras.length})`, icon: Building2 },
    { id: "caballos", label: `Equinos (${horses.length})`, icon: null, emoji: "🐎" },
    { id: "propietarios", label: `Propietarios (${clients.length})`, icon: Users },
    { id: "sanidad", label: "Sanidad & Medicamentos", icon: HeartPulse },
    { id: "finanzas", label: "Alquileres & Pagos", icon: DollarSign },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Banner Informativo de Fases 1, 2 y 3 */}
      <SupabaseSyncBanner />

      {/* Barra de Navegación por Módulos y Botón Rápido */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200/90 dark:border-stone-800 pb-4">
        {/* Pestañas de navegación */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/20"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60"
                }`}
              >
                {Icon ? <Icon className="w-4 h-4" /> : <span>{tab.emoji}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Botón de Acción Principal */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <Button
            size="sm"
            onClick={() => setIsNewHorseModalOpen(true)}
            className="gap-2 cursor-pointer shadow-sm text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Equino</span>
          </Button>
        </div>
      </div>

      {/* VISTAS CONDICIONALES SEGÚN PESTAÑA */}
      <div className="transition-all duration-300">
        {activeTab === "resumen" && (
          <div className="space-y-8">
            {/* Tarjetas de Métricas Principales */}
            <StatsCards metrics={metrics} />

            {/* Accesos Rápidos y Vista Preliminar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Resumen de Boxes Ocupadas */}
              <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                      Estado Actual de Pesebreras
                    </h3>
                    <p className="text-xs text-stone-500">
                      {metrics.occupiedBoxes} ocupadas, {metrics.availableBoxes} listas para recibir
                      equinos
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("pesebreras")}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Ver todas &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {pesebreras.slice(0, 8).map((box) => (
                    <div
                      key={box.id}
                      onClick={() => setActiveTab("pesebreras")}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer hover:scale-[1.02] ${
                        box.status === "disponible"
                          ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"
                          : box.status === "ocupada"
                          ? "bg-stone-50 dark:bg-stone-800/40 border-stone-200/90 dark:border-stone-700"
                          : "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
                      }`}
                    >
                      <span className="text-[11px] font-mono font-bold block text-stone-500">
                        {box.code}
                      </span>
                      <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate block mt-1">
                        {box.status === "ocupada" ? box.horseName : "Disponible"}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider inline-block mt-1 px-1.5 py-0.2 rounded ${
                          box.status === "disponible"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : box.status === "ocupada"
                            ? "text-sky-700 dark:text-sky-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {box.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alertas Médicas y Controles Recientes */}
              <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    Tratamientos Activos
                  </h3>
                  <button
                    onClick={() => setActiveTab("sanidad")}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Ver plan &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {vetRecords.slice(0, 3).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {rec.horseName}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {rec.type}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-1">
                        {rec.title}
                      </p>
                      <span className="text-[11px] text-stone-400 block">
                        Control: {rec.nextDueDate || rec.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pesebreras" && (
          <PesebrerasView pesebreras={pesebreras} onStatusChange={handleStatusChange} />
        )}

        {activeTab === "caballos" && (
          <HorsesView horses={horses} onOpenNewHorseModal={() => setIsNewHorseModalOpen(true)} />
        )}

        {activeTab === "propietarios" && <ClientsView clients={clients} />}

        {activeTab === "sanidad" && <VeterinaryView records={vetRecords} />}

        {activeTab === "finanzas" && (
          <FinanceView payments={payments} onMarkAsPaid={handleMarkPaymentAsPaid} />
        )}
      </div>

      {/* Modal para Registrar Nuevo Equino */}
      <NewHorseModal
        isOpen={isNewHorseModalOpen}
        onClose={() => setIsNewHorseModalOpen(false)}
        clients={clients}
        availableBoxes={availableBoxes}
        onAddHorse={handleAddHorse}
      />
    </div>
  );
}
