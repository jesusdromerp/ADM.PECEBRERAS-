"use client";

import React, { useState, useMemo } from "react";
import {
  Horse,
  Pesebrera,
  Client,
  CanonPlan,
  CenterSettings,
  OwnerNotification,
  HorseDailyPortionDetail,
  HorseDailyActivityRecord,
  HorseRidingSessionReport,
  UserRole,
} from "@/types";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Send,
  Check,
  ShieldAlert,
  MessageCircle,
  Utensils,
  Plus,
  Minus,
  Search,
  Filter,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildOwnerNotification } from "@/lib/notifications";
import { dataService } from "@/services";
import { MontadorDirectoView } from "@/components/dashboard/MontadorDirectoView";

interface MontadorViewProps {
  horses: Horse[];
  pesebreras: Pesebrera[];
  clients?: Client[];
  canonPlans?: CanonPlan[];
  centerSettings?: CenterSettings;
  currentUserRole?: UserRole;
  onSelectHorse?: (horse: Horse) => void;
  onAddNotification?: (notif: OwnerNotification) => void;
  onRecordDailyActivity?: (
    horseId: string,
    activityData: Omit<HorseDailyActivityRecord, "id" | "completedAt">
  ) => HorseDailyActivityRecord | null;
  onRecordRidingSession?: (
    horseId: string,
    sessionData: Omit<HorseRidingSessionReport, "id" | "completedAt">
  ) => HorseRidingSessionReport | null;
  onUpdateHorseDailySchedule?: (
    horseId: string,
    updates: {
      dailyPortionsCount?: number;
      scheduledForRidingToday?: boolean;
      assignedRiderName?: string;
      ridingActivityType?: string;
    }
  ) => Horse | null;
  defaultSubTab?: "palafrenero" | "montador";
}

interface IncidentReport {
  id: string;
  horseId: string;
  horseName: string;
  boxCode: string;
  type: string;
  description: string;
  severity: "baja" | "media" | "alta" | "urgente";
  reportedAt: string;
  reportedBy: string;
  status: "pendiente" | "atendida";
  waUrl?: string;
  planCoverage?: string;
}

interface CuadraWorkState {
  portions: HorseDailyPortionDetail[];
  bathed: boolean;
  hoovesCleaned: boolean;
  stableCleaned: boolean;
  grooming: boolean;
  handWalked: boolean;
  vitaminsGiven: boolean;
  notes: string;
  isPublishedToday: boolean;
  lastPublishedAt?: string;
}

export function MontadorView({
  horses,
  pesebreras,
  clients = [],
  canonPlans = [],
  centerSettings,
  currentUserRole = "montador",
  onSelectHorse,
  onAddNotification,
  onRecordDailyActivity,
  onRecordRidingSession,
  onUpdateHorseDailySchedule,
  defaultSubTab = "montador",
}: MontadorViewProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Selector de Submódulo: Montador Directo (Pista) vs Palafrenero (Cuadra & Raciones)
  const initialSubTab = useMemo<"palafrenero" | "montador">(() => {
    if (currentUserRole === "palafrenero") return "palafrenero";
    if (currentUserRole === "montador") return "montador";
    return defaultSubTab;
  }, [currentUserRole, defaultSubTab]);

  const [activeSubTab, setActiveSubTab] = useState<"palafrenero" | "montador">(initialSubTab);

  const createDefaultCuadraWork = React.useCallback(
    (h: Horse): CuadraWorkState => {
      const todayRecord = (h.dailyActivityHistory || []).find((r) => r.date === todayStr);
      const plannedCount = h.dailyPortionsCount || h.feedConfig?.dailyPortionsCount || 3;

      let portions: HorseDailyPortionDetail[];
      if (todayRecord && todayRecord.portionsDetails?.length) {
        portions = todayRecord.portionsDetails.map((p) => ({ ...p }));
      } else {
        portions = Array.from({ length: plannedCount }, (_, i) => ({
          portionNumber: i + 1,
          label: `Ración ${i + 1}`,
          served: false,
        }));
      }

      return {
        portions,
        bathed: todayRecord?.generalCare?.bathed ?? false,
        hoovesCleaned: todayRecord?.generalCare?.hoovesCleaned ?? false,
        stableCleaned: todayRecord?.generalCare?.stableCleaned ?? true,
        grooming: todayRecord?.generalCare?.grooming ?? false,
        handWalked: todayRecord?.generalCare?.handWalked ?? false,
        vitaminsGiven: todayRecord?.generalCare?.vitaminsGiven ?? false,
        notes: todayRecord?.notes || "",
        isPublishedToday: Boolean(todayRecord?.publishedToOwner),
        lastPublishedAt: todayRecord?.completedAt,
      };
    },
    [todayStr]
  );

  // Estado dinámico por caballo para Alimentación & Cuidados de Cuadra
  const [cuadraWork, setCuadraWork] = useState<Record<string, CuadraWorkState>>(() => {
    const initial: Record<string, CuadraWorkState> = {};
    horses.forEach((h) => {
      initial[h.id] = createDefaultCuadraWork(h);
    });
    return initial;
  });

  // Mantener sincronizado cuadraWork cuando la lista de caballos se actualice
  React.useEffect(() => {
    setCuadraWork((prev) => {
      let changed = false;
      const next = { ...prev };
      horses.forEach((h) => {
        if (!next[h.id]) {
          next[h.id] = createDefaultCuadraWork(h);
          changed = true;
        } else {
          const todayRecord = (h.dailyActivityHistory || []).find((r) => r.date === todayStr);
          if (todayRecord?.publishedToOwner && !next[h.id].isPublishedToday) {
            next[h.id] = {
              ...next[h.id],
              isPublishedToday: true,
              lastPublishedAt: todayRecord.completedAt,
            };
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [horses, todayStr, createDefaultCuadraWork]);

  // Filtros y búsqueda para el panel de alimentación
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"todos" | "raciones_pendientes" | "publicados">("todos");

  // Mensaje de éxito de publicación temporal
  const [publishFeedback, setPublishFeedback] = useState<{
    horseId: string;
    message: string;
    waUrl?: string;
  } | null>(null);

  // Bitácora de novedades reportadas
  const [incidents, setIncidents] = useState<IncidentReport[]>([
    {
      id: "inc-1",
      horseId: horses[0]?.id || "h1",
      horseName: horses[0]?.name || "Relámpago de San Isidro",
      boxCode: horses[0]?.pesebreraCode || "BOX-A01",
      type: "Herradura Floja",
      description: "Herradura de miembro anterior derecho floja tras sesión de torno.",
      severity: "media",
      reportedAt: "Hace 1 hora",
      reportedBy: "Montador Carlos V.",
      status: "pendiente",
    },
  ]);

  // Formulario rápido de reporte
  const [selectedHorseForIncident, setSelectedHorseForIncident] = useState(horses[0]?.id || "");
  const [incidentType, setIncidentType] = useState("Herradura suelta / perdida");
  const [incidentSeverity, setIncidentSeverity] = useState<"baja" | "media" | "alta" | "urgente">("media");
  const [incidentNote, setIncidentNote] = useState("");
  const [showIncidentSuccess, setShowIncidentSuccess] = useState(false);

  // Toggle de una ración específica (Ración 1..N)
  const togglePortion = (horseId: string, portionNumber: number) => {
    const nowTimeStr = new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    setCuadraWork((prev) => {
      const current = prev[horseId];
      if (!current) return prev;

      const updatedPortions = current.portions.map((p) => {
        if (p.portionNumber === portionNumber) {
          const nextServed = !p.served;
          return {
            ...p,
            served: nextServed,
            servedAt: nextServed ? nowTimeStr : undefined,
            servedBy: nextServed ? "Palafrenero de Cuadras" : undefined,
          };
        }
        return p;
      });

      return {
        ...prev,
        [horseId]: {
          ...current,
          portions: updatedPortions,
        },
      };
    });
  };

  // Ajustar número de raciones programadas (sumar o restar ración)
  const adjustPortionsCount = (horseId: string, delta: number) => {
    setCuadraWork((prev) => {
      const current = prev[horseId];
      if (!current) return prev;

      const currentCount = current.portions.length;
      const newCount = Math.max(1, Math.min(8, currentCount + delta));
      if (newCount === currentCount) return prev;

      let updatedPortions: HorseDailyPortionDetail[];
      if (newCount > currentCount) {
        updatedPortions = [
          ...current.portions,
          ...Array.from({ length: newCount - currentCount }, (_, i) => ({
            portionNumber: currentCount + i + 1,
            label: `Ración ${currentCount + i + 1}`,
            served: false,
          })),
        ];
      } else {
        updatedPortions = current.portions.slice(0, newCount);
      }

      if (onUpdateHorseDailySchedule) {
        onUpdateHorseDailySchedule(horseId, { dailyPortionsCount: newCount });
      }

      return {
        ...prev,
        [horseId]: {
          ...current,
          portions: updatedPortions,
        },
      };
    });
  };

  // Alternar actividades y cuidados de cuadra
  const toggleCuadraCare = (
    horseId: string,
    field: "bathed" | "hoovesCleaned" | "stableCleaned" | "grooming" | "handWalked" | "vitaminsGiven"
  ) => {
    setCuadraWork((prev) => {
      const current = prev[horseId];
      if (!current) return prev;
      return {
        ...prev,
        [horseId]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  };

  // Actualizar notas del mayordomo
  const handleUpdateNotes = (horseId: string, notes: string) => {
    setCuadraWork((prev) => {
      const current = prev[horseId];
      if (!current) return prev;
      return {
        ...prev,
        [horseId]: {
          ...current,
          notes,
        },
      };
    });
  };

  // PUBLICAR Y ENVIAR HISTORIAL DE ALIMENTACIÓN Y CUIDADOS AL PROPIETARIO
  const handlePublishCuadraActivity = (horse: Horse) => {
    const work = cuadraWork[horse.id];
    if (!work) return;

    const portionsServedCount = work.portions.filter((p) => p.served).length;
    const totalPortionsPlanned = work.portions.length;
    const client = clients.find((c) => c.id === horse.ownerId);

    const ownerPhone =
      client?.phone?.replace(/\D/g, "") ||
      centerSettings?.contactPhone?.replace(/\D/g, "") ||
      "573124589012";

    const dateFormatted = new Date().toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const portionsListText = work.portions
      .map(
        (p) =>
          `  ${p.served ? "✅" : "⚪"} ${p.label}: ${p.served ? (p.servedAt ? `Servida a las ${p.servedAt}` : "Servida ✓") : "Pendiente"}`
      )
      .join("\n");

    const caresArray = [
      work.bathed ? "Baño ✓" : null,
      work.hoovesCleaned ? "Cascos limpios ✓" : null,
      work.stableCleaned ? "Box y cama limpia ✓" : null,
      work.grooming ? "Cepillado ✓" : null,
      work.handWalked ? "Paseador a mano / Soltada ✓" : null,
      work.vitaminsGiven ? "Vitaminas suministradas ✓" : null,
    ].filter(Boolean);

    const caresText = caresArray.length > 0 ? caresArray.join(" | ") : "Revisión general en pesebrera";

    const waMessage =
      `*${centerSettings?.stableName || "Hacienda San Isidro"} - Reporte de Raciones & Aseo de Cuadra* 🌾\n\n` +
      `🗓 *Fecha:* ${dateFormatted}\n` +
      `🐎 *Ejemplar:* ${horse.name} (${horse.pesebreraCode || "Box Asignado"})\n` +
      `👤 *Propietario:* ${horse.ownerName}\n\n` +
      `🍽 *Raciones Servidas (${portionsServedCount}/${totalPortionsPlanned}):*\n${portionsListText}\n\n` +
      `✨ *Cuidados Realizados Hoy por el Palafrenero:*\n  • ${caresText}\n\n` +
      (work.notes.trim() ? `📝 *Observaciones del Palafrenero:*\n"${work.notes.trim()}"\n\n` : "") +
      `📲 *Registro actualizado y disponible en su Portal del Propietario.*`;

    const waSummaryUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(waMessage)}`;

    const activityPayload: Omit<HorseDailyActivityRecord, "id" | "completedAt"> = {
      date: todayStr,
      horseId: horse.id,
      horseName: horse.name,
      ownerId: horse.ownerId,
      ownerName: horse.ownerName,
      boxCode: horse.pesebreraCode || undefined,
      portionsServedCount,
      totalPortionsPlanned,
      portionsDetails: work.portions,
      wasRidden: false,
      ridingScheduled: horse.scheduledForRidingToday ?? true,
      generalCare: {
        bathed: work.bathed,
        hoovesCleaned: work.hoovesCleaned,
        stableCleaned: work.stableCleaned,
        grooming: work.grooming,
        handWalked: work.handWalked,
        vitaminsGiven: work.vitaminsGiven,
      },
      notes: work.notes.trim() || undefined,
      reportedBy: "Palafrenero de Cuadras",
      publishedToOwner: true,
      waSummaryUrl,
    };

    if (onRecordDailyActivity) {
      onRecordDailyActivity(horse.id, activityPayload);
    } else {
      dataService.recordHorseDailyActivity(horse.id, activityPayload);
    }

    setCuadraWork((prev) => ({
      ...prev,
      [horse.id]: {
        ...prev[horse.id],
        isPublishedToday: true,
        lastPublishedAt: new Date().toISOString(),
      },
    }));

    setPublishFeedback({
      horseId: horse.id,
      message: `¡Alimentación y actividades de hoy enviadas exitosamente al perfil de ${horse.ownerName}!`,
      waUrl: waSummaryUrl,
    });

    setTimeout(() => {
      setPublishFeedback((curr) => (curr?.horseId === horse.id ? null : curr));
    }, 8000);
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const horse = horses.find((h) => h.id === selectedHorseForIncident);
    if (!horse) return;

    let generatedWaUrl: string | undefined = undefined;

    const owner = clients.find((c) => c.id === horse.ownerId);
    if (owner && onAddNotification && centerSettings) {
      const plan =
        canonPlans.find((p) => p.code === (horse.ownerId === "cli-1" ? "TIPO_A" : "TIPO_B")) ||
        canonPlans[0];

      const notif = buildOwnerNotification({
        horse,
        owner,
        plan,
        serviceCategory: incidentType.toLowerCase().includes("herradura")
          ? "Herraje"
          : incidentType.toLowerCase().includes("cólico")
          ? "Sanidad"
          : "Novedad Operativa",
        title: incidentType,
        description: incidentNote.trim() || `Reporte de ${incidentType} en box ${horse.pesebreraCode || "S/A"}`,
        severity: incidentSeverity === "urgente" ? "urgente" : incidentSeverity === "media" ? "alerta" : "info",
        reportedBy: "Palafrenero de Cuadras",
        suggestedCostCOP: incidentType.toLowerCase().includes("herradura") ? 180000 : 95000,
        centerSettings,
      });

      onAddNotification(notif);
      generatedWaUrl = notif.waUrl;
    }

    const newReport: IncidentReport = {
      id: `inc-${Date.now()}`,
      horseId: horse.id,
      horseName: horse.name,
      boxCode: horse.pesebreraCode || "S/A",
      type: incidentType,
      description: incidentNote.trim() || `Reporte de ${incidentType}`,
      severity: incidentSeverity,
      reportedAt: "Justo ahora",
      reportedBy: "Palafrenero de Cuadras",
      status: "pendiente",
      waUrl: generatedWaUrl,
    };

    setIncidents([newReport, ...incidents]);
    setIncidentNote("");
    setShowIncidentSuccess(true);
    setTimeout(() => setShowIncidentSuccess(false), 3500);
  };

  const handleResolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: "atendida" } : inc))
    );
  };

  // Filtrado de la lista de caballos
  const filteredHorses = useMemo(() => {
    return horses.filter((horse) => {
      const work = cuadraWork[horse.id];
      const matchesSearch =
        horse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (horse.pesebreraCode && horse.pesebreraCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        horse.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === "raciones_pendientes") {
        return work ? work.portions.some((p) => !p.served) : true;
      }
      if (filterMode === "publicados") {
        return work?.isPublishedToday;
      }
      return true;
    });
  }, [horses, cuadraWork, searchQuery, filterMode]);

  // Contadores globales
  const totalHorses = horses.length;
  let totalPortionsPlannedGlobal = 0;
  let totalPortionsServedGlobal = 0;
  let totalPublishedHorses = 0;

  horses.forEach((h) => {
    const work = cuadraWork[h.id];
    if (work) {
      totalPortionsPlannedGlobal += work.portions.length;
      totalPortionsServedGlobal += work.portions.filter((p) => p.served).length;
      if (work.isPublishedToday) totalPublishedHorses += 1;
    }
  });

  const pendingIncidentsCount = incidents.filter((i) => i.status === "pendiente").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* SELECTOR DE SUB-MÓDULO: MONTADOR DIRECTO VS PALAFRENERO */}
      <div className="flex items-center justify-between gap-3 bg-stone-100 dark:bg-stone-800/80 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700 max-w-2xl mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => setActiveSubTab("montador")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === "montador"
              ? "bg-amber-600 text-white shadow-md"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
          }`}
        >
          <span className="text-base">🏇</span>
          <span>Montador Directo (Pista & Actividades Asignadas)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("palafrenero")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === "palafrenero"
              ? "bg-sky-700 text-white shadow-md"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
          }`}
        >
          <Utensils className="w-4 h-4 text-sky-300" />
          <span>🌾 Palafrenero (Raciones & Aseo de Cuadra)</span>
        </button>
      </div>

      {/* SI SELECCIONA EL SUBMÓDULO DE MONTADOR DIRECTO, RENDERIZAR SU PANEL EXCLUSIVO */}
      {activeSubTab === "montador" ? (
        <MontadorDirectoView
          horses={horses}
          pesebreras={pesebreras}
          clients={clients}
          centerSettings={centerSettings}
          onSelectHorse={onSelectHorse}
          onRecordRidingSession={onRecordRidingSession}
        />
      ) : (
        /* SUBMÓDULO: PALAFRENERO (RACIONES DE COMIDA & ASEO DE CUADRA) */
        <div className="space-y-6">
          {/* Banner Superior de Rol Palafrenero / Cuadras */}
          <div className="bg-gradient-to-r from-sky-950 via-stone-900 to-stone-950 text-white p-6 rounded-3xl border border-sky-800/40 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  🌾
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Panel del Palafrenero
                    </span>
                    <span className="text-xs text-stone-400">
                      Raciones Servidas & Aseo de Cuadras
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Control de Raciones Servidas & Cuidados de Box
                  </h2>
                  <p className="text-xs text-stone-300 max-w-2xl mt-0.5">
                    Marca las raciones servidas a cada caballo en su horario y registra el aseo del box, baño, cascos y novedades del establo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-2xl border border-white/10 text-center">
                <div className="px-3 py-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Caballos</span>
                  <span className="text-lg font-black text-white">{totalHorses}</span>
                </div>
                <div className="px-3 py-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Raciones Servidas</span>
                  <span className="text-lg font-black text-emerald-400">
                    {totalPortionsServedGlobal}/{totalPortionsPlannedGlobal}
                  </span>
                </div>
                <div className="px-3 py-1">
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Publicados al Dueño</span>
                  <span className="text-lg font-black text-sky-400">
                    {totalPublishedHorses}/{totalHorses}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por caballo, código de box o propietario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-600 font-semibold text-stone-800 dark:text-stone-200"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "raciones_pendientes", label: "🍽 Raciones Pendientes" },
                  { key: "publicados", label: "📤 Publicados al Dueño" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterMode(tab.key)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap text-xs ${
                    filterMode === tab.key
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Tarjetas de Alimentación y Cuidados */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>Planilla de Alimentación & Actividades de Cuadra</span>
                </h3>
                <span className="text-xs text-stone-500 font-bold">
                  {filteredHorses.length} equinos mostrados
                </span>
              </div>

              {filteredHorses.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
                  No se encontraron caballos con el filtro seleccionado.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHorses.map((horse) => {
                    const box = pesebreras.find((b) => b.id === horse.pesebreraId);
                    const work = cuadraWork[horse.id] || createDefaultCuadraWork(horse);

                    const servedCount = work.portions.filter((p) => p.served).length;
                    const totalPlanned = work.portions.length;
                    const allPortionsServed = servedCount === totalPlanned && totalPlanned > 0;
                    const isPublished = work.isPublishedToday;
                    const isFeedback = publishFeedback?.horseId === horse.id;

                    return (
                      <div
                        key={horse.id}
                        className={`bg-white dark:bg-stone-900 rounded-3xl border transition-all p-5 shadow-xs space-y-4 ${
                          isPublished
                            ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10"
                            : "border-stone-200/90 dark:border-stone-800"
                        }`}
                      >
                        {/* Encabezado del Caballo */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700 shadow-inner">
                              {horse.imageUrl ? (
                                <img
                                  src={horse.imageUrl}
                                  alt={horse.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  🐎
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-black text-stone-900 dark:text-stone-100 text-base">
                                  {horse.name}
                                </h4>
                                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  {box?.code || horse.pesebreraCode || "Box"}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300">
                                  Dueño: {horse.ownerName}
                                </span>
                              </div>

                              <p className="text-xs text-stone-500 mt-0.5">
                                {horse.breed} • {horse.coatColor} •{" "}
                                {horse.dietNotes ? (
                                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                                    🌾 {horse.dietNotes}
                                  </span>
                                ) : (
                                  <span>Ración Estándar Criadero</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            {isPublished ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Publicado al Dueño</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pendiente de Publicar</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ALERTA DE ÉXITO */}
                        {isFeedback && (
                          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold">{publishFeedback.message}</span>
                            </div>
                            {publishFeedback.waUrl && (
                              <a
                                href={publishFeedback.waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Enviar por WhatsApp</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* 1. SECCIÓN DE ALIMENTACIÓN (Ración 1..N) */}
                        <div className="bg-stone-50/80 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200/70 dark:border-stone-700/60 space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Utensils className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                                Raciones de Comida Programadas ({servedCount}/{totalPlanned} servidas)
                              </span>
                            </div>

                            <span className="text-[11px] text-stone-600 dark:text-stone-300 font-bold bg-white dark:bg-stone-800 px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700">
                              Programadas por Criadero: <strong className="text-sky-700 dark:text-sky-300">{work.portions.length} raciones/día</strong>
                            </span>
                          </div>

                          {/* Botones Dinámicos Ración 1, 2, 3, 4, 5... */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {work.portions.map((portion) => (
                              <button
                                key={portion.portionNumber}
                                type="button"
                                onClick={() => togglePortion(horse.id, portion.portionNumber)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-xs ${
                                  portion.served
                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/20"
                                    : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-emerald-500 hover:text-emerald-700"
                                }`}
                                title={`Marcar o desmarcar ${portion.label}`}
                              >
                                {portion.served ? (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 opacity-60" />
                                )}
                                <div className="flex flex-col text-left leading-tight">
                                  <span>{portion.label}</span>
                                  {portion.served && portion.servedAt && (
                                    <span className="text-[9px] text-emerald-100 font-medium">
                                      {portion.servedAt}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. SECCIÓN DE OTRAS ACTIVIDADES & CUIDADOS DE HOY */}
                        <div className="bg-stone-50/80 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200/70 dark:border-stone-700/60 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Otras Actividades & Cuidados Realizados Hoy:</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => toggleCuadraCare(horse.id, "bathed")}
                              className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                work.bathed
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : "bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              <span>{work.bathed ? "✓" : "🚿"}</span>
                              <span>Baño Realizado</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCuadraCare(horse.id, "hoovesCleaned")}
                              className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                work.hoovesCleaned
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : "bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              <span>{work.hoovesCleaned ? "✓" : "🧼"}</span>
                              <span>Limpieza de Cascos</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCuadraCare(horse.id, "stableCleaned")}
                              className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                work.stableCleaned
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : "bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              <span>{work.stableCleaned ? "✓" : "🧹"}</span>
                              <span>Box & Cama Aseada</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCuadraCare(horse.id, "grooming")}
                              className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                work.grooming
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : "bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              <span>{work.grooming ? "✓" : "✨"}</span>
                              <span>Cepillado / Acicalado</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCuadraCare(horse.id, "handWalked")}
                              className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                work.handWalked
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : "bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              <span>{work.handWalked ? "✓" : "🌿"}</span>
                              <span>Paseador a Mano / Corral</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCuadraCare(horse.id, "vitaminsGiven")}
                              className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                work.vitaminsGiven
                                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : "bg-white dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              <span>{work.vitaminsGiven ? "✓" : "💊"}</span>
                              <span>Suplemento / Vitaminas</span>
                            </button>
                          </div>
                        </div>

                        {/* Observaciones del Palafrenero */}
                        <div>
                          <input
                            type="text"
                            placeholder="Observación del palafrenero sobre cómo comió el caballo o novedad en cuadra..."
                            value={work.notes}
                            onChange={(e) => handleUpdateNotes(horse.id, e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-sky-600 font-medium"
                          />
                        </div>

                        {/* Botón de Publicación al Propietario */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800">
                          <div className="text-xs text-stone-500">
                            {allPortionsServed ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Todas las raciones servidas hoy ({totalPlanned}/{totalPlanned})
                              </span>
                            ) : (
                              <span>
                                {servedCount} de {totalPlanned} raciones servidas
                              </span>
                            )}
                          </div>

                          <Button
                            type="button"
                            onClick={() => handlePublishCuadraActivity(horse)}
                            className="bg-sky-700 hover:bg-sky-800 text-white font-black py-2.5 px-5 rounded-2xl cursor-pointer shadow-md gap-2 flex items-center justify-center text-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Publicar Raciones Servidas & Cuidados al Dueño</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Columna Derecha: Reporte Rápido de Incidencias en Cuadra */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900 mb-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    Novedad en Pesebrera
                  </div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                    Notificar Síntoma o Avería
                  </h3>
                  <p className="text-xs text-stone-500">
                    Reporta al administrador y al veterinario al instante.
                  </p>
                </div>

                {showIncidentSuccess && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Novedad registrada exitosamente en la bitácora!</span>
                  </div>
                )}

                <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Equino:
                    </label>
                    <select
                      value={selectedHorseForIncident}
                      onChange={(e) => setSelectedHorseForIncident(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {horses.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.pesebreraCode || "Sin box"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Novedad:
                    </label>
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="Rechazo de alimento / no comió">Rechazo de ración / inapetencia</option>
                      <option value="Sospecha de cólico / intranquilidad">Sospecha de cólico o dolor</option>
                      <option value="Herida o raspón en box">Herida o raspón en box</option>
                      <option value="Bebedero o comedero dañado">Bebedero o comedero averiado</option>
                      <option value="Herradura suelta / perdida">Herradura floja o perdida</option>
                      <option value="Otro incidente">Otra novedad</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Urgencia:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["baja", "media", "urgente"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setIncidentSeverity(lvl)}
                          className={`py-1.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer border ${
                            incidentSeverity === lvl
                              ? lvl === "urgente"
                                ? "bg-rose-600 text-white border-rose-600"
                                : lvl === "media"
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-emerald-600 text-white border-emerald-600"
                              : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Detalles:
                    </label>
                    <textarea
                      value={incidentNote}
                      onChange={(e) => setIncidentNote(e.target.value)}
                      placeholder="Describe qué observaste..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-sm gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Reportar Novedad</span>
                  </Button>
                </form>
              </div>

              {/* Bitácora de Novedades Activas */}
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Bitácora de Novedades</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {pendingIncidentsCount} pendientes
                  </span>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {incidents.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-4">Sin novedades registradas hoy.</p>
                  ) : (
                    incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                          inc.status === "atendida"
                            ? "bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 opacity-60"
                            : inc.severity === "urgente"
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900"
                            : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-stone-900 dark:text-stone-100">
                            {inc.horseName} ({inc.boxCode})
                          </span>
                          <span
                            className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                              inc.severity === "urgente"
                                ? "bg-rose-600 text-white"
                                : inc.severity === "media"
                                ? "bg-amber-500 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {inc.severity}
                          </span>
                        </div>

                        <p className="text-stone-700 dark:text-stone-300 font-semibold text-[11px]">
                          {inc.type}: <span className="font-normal">{inc.description}</span>
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-700/60 text-[10px] text-stone-400">
                          <div className="flex items-center gap-2">
                            <span>{inc.reportedAt}</span>
                            {inc.waUrl && (
                              <a
                                href={inc.waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Avisar Dueño</span>
                              </a>
                            )}
                          </div>
                          {inc.status === "pendiente" ? (
                            <button
                              type="button"
                              onClick={() => handleResolveIncident(inc.id)}
                              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> Atendida
                            </button>
                          ) : (
                            <span className="text-stone-400 font-bold">Atendida ✓</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
