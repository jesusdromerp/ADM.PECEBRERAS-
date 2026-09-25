"use client";

import React, { useState } from "react";
import {
  Client,
  Horse,
  Pesebrera,
  PaymentRecord,
  CanonPlan,
  CenterSettings,
  OwnerNotification,
  HorseDailyPortionDetail,
  HorseRidingSessionReport,
} from "@/types";
import {
  HeartPulse,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Clock,
  Phone,
  MessageCircle,
  FileText,
  User,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Info,
  Wrench,
  AlertTriangle,
  Bell,
  Award,
  Calendar,
  Check,
  Utensils,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OwnerPortalViewProps {
  clients: Client[];
  horses: Horse[];
  pesebreras: Pesebrera[];
  payments: PaymentRecord[];
  canonPlans?: CanonPlan[];
  centerSettings: CenterSettings;
  notifications?: OwnerNotification[];
  onSelectHorse?: (horse: Horse) => void;
  initialClientId?: string;
  hideClientSelector?: boolean;
}

export function OwnerPortalView({
  clients,
  horses,
  pesebreras,
  payments,
  canonPlans = [],
  centerSettings,
  notifications = [],
  onSelectHorse,
  initialClientId,
  hideClientSelector = false,
}: OwnerPortalViewProps) {
  // Cliente actualmente seleccionado en el portal
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || clients[0]?.id || ""
  );

  // Caballo expandido para ver ficha técnica detallada dentro del portal
  const [expandedHorseId, setExpandedHorseId] = useState<string | null>(null);
  // Caballo expandido para ver historial de jornadas anteriores de cuadra
  const [expandedHistoryHorseId, setExpandedHistoryHorseId] = useState<string | null>(null);
  // Caballo expandido para ver historial de montas del montador directo
  const [expandedRidingHistoryHorseId, setExpandedRidingHistoryHorseId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const currentClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const clientHorses = horses.filter((h) => h.ownerId === currentClient?.id);
  const clientPayments = payments.filter((p) => p.clientId === currentClient?.id);
  const clientNotifications = notifications.filter(
    (n) => n.clientId === currentClient?.id
  );

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleWhatsAppContact = (customText?: string) => {
    const phone = centerSettings.contactPhone?.replace(/\D/g, "") || "573124589012";
    const text = encodeURIComponent(
      customText ||
        `Hola ${centerSettings.stableName || "Hacienda"}, soy ${currentClient?.fullName}. Quisiera consultar información sobre mis equinos y estado de cuenta.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  if (!currentClient) {
    return (
      <div className="p-8 text-center text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
        No hay propietarios registrados para visualizar en el portal.
      </div>
    );
  }

  const isUpToDate = currentClient.paymentStatus === "al_dia";
  const unreadNotifsCount = clientNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Selector de Cliente en Modo Simulación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50 dark:bg-purple-950/40 p-4 rounded-3xl border border-purple-200 dark:border-purple-900/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            📱
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300 block">
              Vista del Portal del Cliente
            </span>
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Estás visualizando como:{" "}
              <span className="text-purple-900 dark:text-purple-200 font-extrabold">
                {currentClient.fullName}
              </span>
            </span>
          </div>
        </div>

        {!hideClientSelector && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500 font-semibold hidden sm:inline">
              Cambiar Propietario:
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setExpandedHorseId(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-purple-300 dark:border-purple-800 text-xs font-bold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer shadow-xs"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.horsesCount} equinos)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tarjeta Principal de Bienvenida y Estado Financiero */}
      <div className="bg-gradient-to-r from-purple-950 via-stone-900 to-stone-950 text-white p-6 sm:p-7 rounded-3xl border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Propietario Distinguido
              </span>
              <span className="text-xs text-stone-400">
                {centerSettings.stableName || "Hacienda San Isidro"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Bienvenido, {currentClient.fullName}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Consulta en tiempo real la ficha técnica, historial clínico, herrajes de tus caballos, las novedades notificadas según tu plan de canon y tus recibos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Estado de Cuenta */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center sm:text-right">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                Estado de Cuenta
              </span>
              <div className="flex items-center justify-center sm:justify-end gap-2 mt-0.5">
                {isUpToDate ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5" /> Al Día
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Clock className="w-3.5 h-3.5" /> Saldo Pendiente:{" "}
                    {formatCOP(currentClient.outstandingBalance)}
                  </span>
                )}
              </div>
            </div>

            {/* Botón WhatsApp */}
            <Button
              type="button"
              onClick={() => handleWhatsAppContact()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-6 rounded-2xl cursor-pointer shadow-md gap-2 flex items-center justify-center"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar Criadero</span>
            </Button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: NOTIFICACIONES AL PROPIETARIO SEGÚN SU PLAN DE CANON (NUEVO) */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Notificaciones & Novedades para el Propietario</span>
              </h3>
              <p className="text-xs text-stone-500">
                Avisos automáticos de salud, herrajes y cuadra, clasificados según la cobertura de tu plan contratado.
              </p>
            </div>
          </div>

          {unreadNotifsCount > 0 && (
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              {unreadNotifsCount} sin leer
            </span>
          )}
        </div>

        {clientNotifications.length === 0 ? (
          <div className="p-5 text-center text-xs text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-100 dark:border-stone-800">
            No tienes novedades ni incidencias pendientes. ¡Todo marcha perfecto con tus ejemplares!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {clientNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border space-y-2.5 transition-all text-xs flex flex-col justify-between ${
                  notif.coveredByPlan
                    ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
                    : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-sm text-stone-900 dark:text-stone-100">
                      {notif.horseName}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                        notif.coveredByPlan
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      }`}
                    >
                      {notif.planName}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <span>{notif.coveredByPlan ? "✅" : "⚠️"}</span>
                    <span>{notif.title}</span>
                  </h4>

                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
                    {notif.message}
                  </p>

                  {/* COBERTURA INTELIGENTE SEGÚN PLAN DE CANON */}
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                      notif.coveredByPlan
                        ? "bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                        : "bg-amber-100/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{notif.coverageDetail}</span>
                      {notif.extraCostCOP && !notif.coveredByPlan && (
                        <span className="font-black underline">
                          +{formatCOP(notif.extraCostCOP)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-[10px] text-stone-400">
                  <span>Reportó: {notif.reportedBy}</span>
                  {notif.waUrl ? (
                    <a
                      href={notif.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Coordinar por WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleWhatsAppContact(
                          `Hola, sobre la novedad de ${notif.horseName} (${notif.title}): deseo coordinar la atención.`
                        )
                      }
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: MIS CABALLOS Y FICHAS TÉCNICAS COMPLETAS */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>🐎</span>
            <span>Mis Equinos en la Hacienda ({clientHorses.length})</span>
          </h3>
          <p className="text-xs text-stone-500">
            Ficha técnica, genealogía/pedigrí, casos clínicos, control de herraje y atenciones del criadero.
          </p>
        </div>

        {clientHorses.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            No tienes caballos registrados a tu nombre actualmente.
          </div>
        ) : (
          <div className="space-y-4">
            {clientHorses.map((horse, idx) => {
              const box = pesebreras.find((b) => b.id === horse.pesebreraId);
              const planCode = idx === 0 ? "TIPO_A" : "TIPO_B";
              const currentPlan =
                canonPlans.find((p) => p.code === planCode) ||
                canonPlans[0] || {
                  code: "TIPO_A",
                  name: "Pesebrera Tipo A (Servicio Integral)",
                  tagline: "El criadero se encarga de todo",
                  basePriceCOP: 1600000,
                  inclusions: [
                    { id: "1", name: "Comida / Concentrado", included: true },
                    { id: "2", name: "Herraje Especializado", included: true },
                    { id: "3", name: "Montador / Adiestrador", included: true },
                    { id: "4", name: "Agua Permanente", included: true },
                    { id: "5", name: "Cama / Viruta Limpia", included: true },
                    { id: "6", name: "Vitaminas & Suplementos", included: true },
                  ],
                };

              const isExpanded = expandedHorseId === horse.id;

              return (
                <div
                  key={horse.id}
                  className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 shadow-sm space-y-5 transition-all"
                >
                  {/* Fila Principal de Resumen del Caballo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700 shadow-inner">
                        {horse.imageUrl ? (
                          <img
                            src={horse.imageUrl}
                            alt={horse.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            🐎
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-black text-stone-900 dark:text-stone-100">
                            {horse.name}
                          </h4>
                          <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {box?.code || horse.pesebreraCode || "Box Asignado"}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                            {currentPlan.code} • {formatCOP(currentPlan.basePriceCOP)}/mes
                          </span>
                        </div>

                        <p className="text-xs text-stone-500">
                          {horse.breed} • {horse.coatColor} • {horse.gender} • {horse.ageYears} años
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-stone-400">
                          <span>Zona: {box?.zone || "Nave Principal"}</span>
                          <span>•</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            Salud: {horse.healthStatus === "optimo" ? "Óptima ✓" : "En Seguimiento"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        type="button"
                        onClick={() =>
                          setExpandedHorseId(isExpanded ? null : horse.id)
                        }
                        className={`text-xs gap-1.5 cursor-pointer font-bold ${
                          isExpanded
                            ? "bg-purple-800 text-white"
                            : "bg-purple-50 hover:bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {isExpanded ? "Ocultar Ficha" : "Ver Ficha Técnica & Historial"}
                        </span>
                      </Button>

                      {onSelectHorse && (
                        <button
                          type="button"
                          onClick={() => onSelectHorse(horse)}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
                          title="Abrir expediente completo en ventana grande"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN 1: BITÁCORA DIARIA DE ALIMENTACIÓN & CUIDADOS (MAYORDOMO / CUADRA) */}
                  {(() => {
                    const todayRecord =
                      (horse.dailyActivityHistory || []).find((r) => r.date === todayStr) ||
                      horse.dailyActivityHistory?.[0];
                    const plannedPortionsCount =
                      todayRecord?.totalPortionsPlanned ||
                      horse.dailyPortionsCount ||
                      horse.feedConfig?.dailyPortionsCount ||
                      3;

                    const portions: HorseDailyPortionDetail[] =
                      todayRecord && todayRecord.portionsDetails?.length
                        ? todayRecord.portionsDetails
                        : Array.from({ length: plannedPortionsCount }, (_, i) => ({
                            portionNumber: i + 1,
                            label: `Ración ${i + 1}`,
                            served: false,
                          }));

                    const servedCount =
                      todayRecord?.portionsServedCount ??
                      portions.filter((p) => p.served).length;

                    const isHistoryOpen = expandedHistoryHorseId === horse.id;
                    const historyRecords = horse.dailyActivityHistory || [];

                    // Reporte directo del montador para hoy
                    const todayRidingReport =
                      (horse.ridingSessionHistory || []).find((r) => r.date === todayStr) ||
                      horse.ridingSessionHistory?.[0];
                    const isRidingHistoryOpen = expandedRidingHistoryHorseId === horse.id;
                    const ridingHistoryRecords = horse.ridingSessionHistory || [];

                    return (
                      <div className="space-y-3.5">
                        {/* 1. TARJETA DE ALIMENTACIÓN & CUIDADOS (MAYORDOMO / CUADRA) */}
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/90 dark:border-emerald-900/60 p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-base">🌾</span>
                              <div>
                                <h5 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                                  Alimentación & Cuidados de Cuadra (Mayordomo)
                                </h5>
                                <p className="text-[11px] text-stone-500">
                                  {todayRecord
                                    ? `Reporte de cuadras por ${todayRecord.reportedBy} (${todayRecord.completedAt ? new Date(todayRecord.completedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true }) : "Hoy"})`
                                    : "Supervisión diaria en curso por el mayordomo"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {todayRecord ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Raciones al Día ✓</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>En Proceso</span>
                                </span>
                              )}

                              {historyRecords.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedHistoryHorseId(
                                      isHistoryOpen ? null : horse.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer bg-white dark:bg-stone-800 px-2 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs"
                                >
                                  <History className="w-3 h-3" />
                                  <span>Historial ({historyRecords.length})</span>
                                  {isHistoryOpen ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Grid de Raciones Dinámicas */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 text-xs">
                                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Raciones Programadas del Día</span>
                              </span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                                {servedCount}/{plannedPortionsCount} servidas
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                              {portions.map((portion) => (
                                <div
                                  key={portion.portionNumber}
                                  className={`p-2 rounded-xl border text-[11px] flex flex-col justify-between transition-all ${
                                    portion.served
                                      ? "bg-white dark:bg-stone-900 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-xs"
                                      : "bg-stone-100/60 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-500"
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span>{portion.label}</span>
                                    <span>{portion.served ? "✓" : "⏳"}</span>
                                  </div>
                                  <span className="text-[9px] font-medium mt-0.5">
                                    {portion.served
                                      ? portion.servedAt || "Servida ✓"
                                      : "Pendiente"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Otras Actividades Realizadas Hoy */}
                          {(todayRecord?.generalCare || todayRecord?.notes) && (
                            <div className="bg-white/80 dark:bg-stone-900/80 p-3 rounded-xl border border-emerald-100 dark:border-stone-800 space-y-1.5 text-xs">
                              {todayRecord.generalCare && (
                                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                  <span className="font-bold text-stone-700 dark:text-stone-300">
                                    Actividades realizadas:
                                  </span>
                                  {todayRecord.generalCare.bathed && (
                                    <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-semibold">
                                      🚿 Bañado
                                    </span>
                                  )}
                                  {todayRecord.generalCare.hoovesCleaned && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                                      🧼 Cascos Limpios
                                    </span>
                                  )}
                                  {todayRecord.generalCare.stableCleaned && (
                                    <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
                                      🧹 Box y Cama Aseada
                                    </span>
                                  )}
                                  {todayRecord.generalCare.grooming && (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-semibold">
                                      ✨ Acicalado
                                    </span>
                                  )}
                                  {todayRecord.generalCare.handWalked && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                                      🌿 Paseador a Mano / Corral
                                    </span>
                                  )}
                                  {todayRecord.generalCare.vitaminsGiven && (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-semibold">
                                      💊 Suplementos / Vitaminas
                                    </span>
                                  )}
                                </div>
                              )}

                              {todayRecord.notes && (
                                <div className="text-[11px] text-stone-600 dark:text-stone-300 italic border-l-2 border-emerald-500 pl-2 mt-1">
                                  &ldquo;{todayRecord.notes}&rdquo;
                                </div>
                              )}
                            </div>
                          )}

                          {/* Historial Expandible de Cuadra */}
                          {isHistoryOpen && (
                            <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 space-y-2 animate-fade-in text-xs">
                              <span className="font-extrabold text-stone-900 dark:text-stone-100 block text-[11px]">
                                Historial de Alimentación y Cuidados Anteriores:
                              </span>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {historyRecords.map((hist) => (
                                  <div
                                    key={hist.id}
                                    className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-[11px] space-y-0.5"
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span>🗓 {hist.date}</span>
                                      <span className="text-emerald-700 dark:text-emerald-400 font-black">
                                        {hist.portionsServedCount}/{hist.totalPortionsPlanned} Raciones Servidas ✓
                                      </span>
                                    </div>
                                    {hist.notes && (
                                      <p className="text-stone-500 italic text-[10px]">
                                        Nota: &ldquo;{hist.notes}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. TARJETA DE INFORME TÉCNICO DIRECTO DEL MONTADOR */}
                        <div className="bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-800/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-base">🏇</span>
                              <div>
                                <h5 className="font-black text-xs sm:text-sm text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                                  Informe Técnico de Pista & Entrenamiento (Directo del Montador)
                                </h5>
                                <p className="text-[11px] text-stone-500">
                                  {todayRidingReport
                                    ? `Registrado directamente por el montador ${todayRidingReport.riderName}`
                                    : horse.scheduledForRidingToday
                                    ? `Sesión programada hoy con ${horse.assignedRiderName || "Montador de Pista"}`
                                    : "Día de descanso programado en pesebrera"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {todayRidingReport ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Sesión Realizada ✓</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pendiente de Monta</span>
                                </span>
                              )}

                              {ridingHistoryRecords.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedRidingHistoryHorseId(
                                      isRidingHistoryOpen ? null : horse.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 dark:text-amber-300 hover:underline cursor-pointer bg-white dark:bg-stone-800 px-2 py-1 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs"
                                >
                                  <History className="w-3 h-3" />
                                  <span>Historial Montas ({ridingHistoryRecords.length})</span>
                                  {isRidingHistoryOpen ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {todayRidingReport ? (
                            <div className="bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-amber-200/70 dark:border-stone-800 space-y-2.5 shadow-xs text-xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                                    {todayRidingReport.sessionType}
                                  </span>
                                  <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                                    <span>Montador: <strong>{todayRidingReport.riderName}</strong></span>
                                    <span>•</span>
                                    <span>Duración: <strong>{todayRidingReport.durationMinutes} minutos</strong></span>
                                  </div>
                                </div>

                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                                  ⭐ Actitud: {todayRidingReport.attitude}
                                </span>
                              </div>

                              {todayRidingReport.exercisesWorked && todayRidingReport.exercisesWorked.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                                    Ejercicios Trabajados en Pista:
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {todayRidingReport.exercisesWorked.map((ex) => (
                                      <span
                                        key={ex}
                                        className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-bold"
                                      >
                                        ✓ {ex}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {todayRidingReport.technicalNotes && (
                                <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border-l-3 border-amber-500 text-stone-700 dark:text-stone-300 italic text-[11px]">
                                  &ldquo;{todayRidingReport.technicalNotes}&rdquo;
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-stone-500 py-1">
                              {horse.scheduledForRidingToday
                                ? `El montador directo aún no ha registrado la sesión de hoy. Montador asignado: ${horse.assignedRiderName || "Montador de Pista"}.`
                                : "El ejemplar se encuentra en día de descanso programado."}
                            </p>
                          )}

                          {/* Historial Expandible de Montas */}
                          {isRidingHistoryOpen && (
                            <div className="pt-3 border-t border-amber-200/60 dark:border-amber-800/60 space-y-2 animate-fade-in text-xs">
                              <span className="font-extrabold text-stone-900 dark:text-stone-100 block text-[11px]">
                                Historial de Informes de Monta Anteriores:
                              </span>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {ridingHistoryRecords.map((hist) => (
                                  <div
                                    key={hist.id}
                                    className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-[11px] space-y-1"
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span className="text-stone-900 dark:text-stone-100">
                                        🗓 {hist.date} • {hist.riderName}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black uppercase">
                                        {hist.durationMinutes}m • {hist.sessionType}
                                      </span>
                                    </div>
                                    {hist.technicalNotes && (
                                      <p className="text-stone-500 italic text-[10px]">
                                        &ldquo;{hist.technicalNotes}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* DESPLIEGUE COMPLETO: FICHA TÉCNICA, CASOS CLÍNICOS, HERRAJE Y NOVEDADES */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-5 animate-fade-in text-xs">
                      {/* Sub-grid de 3 columnas: Pedigrí, Herrada y Casos Clínicos */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Pedigrí / Genealogía */}
                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2.5">
                          <div className="flex items-center gap-2 font-extrabold text-stone-800 dark:text-stone-200 text-xs">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span>Genealogía & Pedigrí</span>
                          </div>

                          <div className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                            <div>
                              <span className="text-stone-400 block text-[10px]">Padre (Sire):</span>
                              <span className="font-bold text-stone-900 dark:text-stone-100">
                                {horse.pedigree?.sire || "No especificado"}
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px]">Madre (Dam):</span>
                              <span className="font-bold text-stone-900 dark:text-stone-100">
                                {horse.pedigree?.dam || "No especificada"}
                              </span>
                            </div>
                            {horse.pedigree?.breedingFarm && (
                              <div>
                                <span className="text-stone-400 block text-[10px]">Criadero de Origen:</span>
                                <span className="text-stone-700 dark:text-stone-300">
                                  {horse.pedigree.breedingFarm}
                                </span>
                              </div>
                            )}
                            {horse.microchip && (
                              <div>
                                <span className="text-stone-400 block text-[10px]">Microchip:</span>
                                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                                  {horse.microchip}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Historial de Herrada */}
                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2.5">
                          <div className="flex items-center gap-2 font-extrabold text-stone-800 dark:text-stone-200 text-xs">
                            <Wrench className="w-4 h-4 text-emerald-600" />
                            <span>Historial de Herrada</span>
                          </div>

                          {horse.farrierControl ? (
                            <div className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                              <div>
                                <span className="text-stone-400 block text-[10px]">Último Herraje:</span>
                                <span className="font-bold text-stone-900 dark:text-stone-100">
                                  {horse.farrierControl.lastShoeingDate}
                                </span>
                              </div>
                              <div>
                                <span className="text-stone-400 block text-[10px]">Próximo Cambio:</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  {horse.farrierControl.nextShoeingDate}
                                </span>
                              </div>
                              <div>
                                <span className="text-stone-400 block text-[10px]">Tipo de Herradura:</span>
                                <span className="text-stone-700 dark:text-stone-300 font-medium">
                                  {horse.farrierControl.shoeingType}
                                </span>
                              </div>
                              <div>
                                <span className="text-stone-400 block text-[10px]">Maestro Herrero:</span>
                                <span>{horse.farrierControl.farrierName}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-stone-400 py-3">
                              Sin registros de herraje cargados.
                            </p>
                          )}
                        </div>

                        {/* 3. Casos Clínicos & Sanidad */}
                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 space-y-2.5">
                          <div className="flex items-center gap-2 font-extrabold text-stone-800 dark:text-stone-200 text-xs">
                            <HeartPulse className="w-4 h-4 text-rose-600" />
                            <span>Casos Clínicos & Sanidad</span>
                          </div>

                          {horse.diseaseHistory && horse.diseaseHistory.length > 0 ? (
                            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                              {horse.diseaseHistory.map((dis) => (
                                <div
                                  key={dis.id}
                                  className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700/60 text-[10px] space-y-0.5"
                                >
                                  <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                                    <span className="truncate">{dis.diseaseName}</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-black ${
                                        dis.status === "resuelto"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-rose-100 text-rose-800"
                                      }`}
                                    >
                                      {dis.status}
                                    </span>
                                  </div>
                                  <p className="text-stone-500 leading-tight">
                                    {dis.medicationsGiven || dis.clinicalNotes}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 py-3 font-semibold">
                              <CheckCircle className="w-4 h-4" />
                              <span>Sin enfermedades ni alertas clínicas reportadas.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desglose de Inclusiones del Plan para este Caballo */}
                      <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-purple-950 dark:text-purple-200 text-xs">
                            Cobertura de tu Modalidad: {currentPlan.name}
                          </span>
                          <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300">
                            {currentPlan.tagline}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                          {currentPlan.inclusions.map((inc) => (
                            <div
                              key={inc.id}
                              className={`p-2 rounded-xl flex items-center gap-2 ${
                                inc.included
                                  ? "bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold"
                                  : "bg-stone-100 dark:bg-stone-800 text-stone-400 line-through"
                              }`}
                            >
                              <span>{inc.included ? "✓" : "✗"}</span>
                              <span className="truncate">{inc.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: HISTORIAL DE RECIBOS Y FACTURACIÓN */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Mis Recibos & Estados de Pago</span>
            </h3>
            <p className="text-xs text-stone-500">
              Comprobantes emitidos para tu control y descarga.
            </p>
          </div>
          <span className="text-xs font-bold text-stone-500">
            {clientPayments.length} comprobantes registrados
          </span>
        </div>

        {clientPayments.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">
            No tienes pagos registrados en el histórico.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400">
                  <th className="p-3 font-extrabold">Recibo #</th>
                  <th className="p-3 font-extrabold">Concepto / Mes</th>
                  <th className="p-3 font-extrabold">Caballo</th>
                  <th className="p-3 font-extrabold">Monto</th>
                  <th className="p-3 font-extrabold">Fecha Vencimiento</th>
                  <th className="p-3 font-extrabold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {clientPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                    <td className="p-3 font-mono font-bold text-stone-900 dark:text-stone-100">
                      {pay.receiptNumber}
                    </td>
                    <td className="p-3 font-semibold text-stone-800 dark:text-stone-200">
                      {pay.concept}
                    </td>
                    <td className="p-3 text-stone-600 dark:text-stone-400">
                      {pay.horseName || "Servicio General"}
                    </td>
                    <td className="p-3 font-black text-stone-900 dark:text-stone-100">
                      {formatCOP(pay.amount)}
                    </td>
                    <td className="p-3 text-stone-500">{pay.dueDate}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          pay.status === "pagado"
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {pay.status === "pagado" ? "Pagado ✓" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Datos Bancarios de la Hacienda para Transferencias */}
        {centerSettings.bankDetails && (
          <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-extrabold text-stone-800 dark:text-stone-200 block">
                🏦 Datos Bancarios para Pagos y Transferencias:
              </span>
              <p className="text-stone-600 dark:text-stone-400 font-mono text-[11px]">
                {centerSettings.bankDetails}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => handleWhatsAppContact()}
              size="sm"
              variant="outline"
              className="gap-1.5 cursor-pointer shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Enviar Soporte de Pago</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
