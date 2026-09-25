"use client";

import React, { useState, useMemo } from "react";
import {
  Horse,
  Pesebrera,
  Client,
  CenterSettings,
  HorseRidingSessionReport,
  HorseRidingAttitude,
} from "@/types";
import {
  Award,
  CheckCircle,
  Clock,
  Send,
  MessageCircle,
  Sparkles,
  Flame,
  Check,
  Search,
  Filter,
  History,
  ChevronDown,
  ChevronUp,
  User,
  Timer,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { dataService } from "@/services";

interface MontadorDirectoViewProps {
  horses: Horse[];
  pesebreras: Pesebrera[];
  clients?: Client[];
  centerSettings?: CenterSettings;
  onSelectHorse?: (horse: Horse) => void;
  onRecordRidingSession?: (
    horseId: string,
    sessionData: Omit<HorseRidingSessionReport, "id" | "completedAt">
  ) => HorseRidingSessionReport | null;
}

const AVAILABLE_EXERCISES = [
  "Flexión de cuello y nuca",
  "Paradas y salidas en seco",
  "Ritmo y cadencia en tabla",
  "Serenidad en el torno",
  "Arreglo de cabeza y embocadura",
  "Transiciones trote a galope",
  "Afloje de espaldas y rienda",
  "Galope reunido",
  "Caminata de calentamiento",
  "Trabajo a la cuerda",
];

const SESSION_TYPES = [
  "Pista de Adiestramiento & Galope",
  "Torno & Cuerda en Picadero",
  "Arreglo de Cabeza & Rienda",
  "Paso Fino / Trocha / Trote",
  "Caminador Eléctrico",
  "Paseo de Fondo & Campo",
];

const ATTITUDES: { id: HorseRidingAttitude; label: string; icon: string; color: string }[] = [
  { id: "excelente", label: "Excelente Disposición", icon: "⭐", color: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300" },
  { id: "brio_alto", label: "Con Gran Brío & Energía", icon: "🔥", color: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300" },
  { id: "atento", label: "Atento y Suave de Boca", icon: "🎯", color: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-300" },
  { id: "pesado_boca", label: "Pesado de Boca / Rienda", icon: "⚠️", color: "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-300" },
  { id: "inquieto", label: "Inquieto / Distraído", icon: "⚡", color: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300" },
  { id: "cansado", label: "Cansado / Sesión Suave", icon: "💤", color: "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300" },
];

export function MontadorDirectoView({
  horses,
  pesebreras,
  clients = [],
  centerSettings,
  onSelectHorse,
  onRecordRidingSession,
}: MontadorDirectoViewProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Lista de nombres de montadores únicos presentes en el criadero
  const ridersList = useMemo(() => {
    const set = new Set<string>();
    horses.forEach((h) => {
      if (h.assignedRiderName && !h.assignedRiderName.toLowerCase().includes("reposo")) {
        set.add(h.assignedRiderName);
      }
    });
    if (set.size === 0) {
      set.add("Montador Carlos Valderrama");
      set.add("Montador Sebastián Osorio");
    }
    return Array.from(set);
  }, [horses]);

  // Montador activo seleccionado en el panel
  const [selectedRiderFilter, setSelectedRiderFilter] = useState<string>("todos");
  const [workFilterMode, setWorkFilterMode] = useState<"con_actividad" | "pendientes" | "completados" | "todos">("con_actividad");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedHistoryHorseId, setExpandedHistoryHorseId] = useState<string | null>(null);

  const createDefaultSessionForm = React.useCallback(
    (h: Horse) => {
      const todayReport = (h.ridingSessionHistory || []).find((r) => r.date === todayStr);

      return {
        riderName:
          todayReport?.riderName ||
          h.assignedRiderName ||
          ridersList[0] ||
          "Montador Carlos Valderrama",
        sessionType:
          todayReport?.sessionType ||
          h.ridingActivityType ||
          "Pista de Adiestramiento & Galope",
        durationMinutes: todayReport?.durationMinutes || 45,
        attitude: todayReport?.attitude || ("excelente" as HorseRidingAttitude),
        exercisesWorked: todayReport?.exercisesWorked?.length
          ? [...todayReport.exercisesWorked]
          : ["Flexión de cuello y nuca", "Ritmo y cadencia en tabla"],
        technicalNotes: todayReport?.technicalNotes || "",
        isSavedToday: Boolean(todayReport),
        lastSavedAt: todayReport?.completedAt,
      };
    },
    [todayStr, ridersList]
  );

  // Estado por caballo para el formulario directo del montador
  const [sessionForm, setSessionForm] = useState<
    Record<
      string,
      {
        riderName: string;
        sessionType: string;
        durationMinutes: number;
        attitude: HorseRidingAttitude;
        exercisesWorked: string[];
        technicalNotes: string;
        isSavedToday: boolean;
        lastSavedAt?: string;
      }
    >
  >(() => {
    const initial: Record<string, any> = {};
    horses.forEach((h) => {
      initial[h.id] = createDefaultSessionForm(h);
    });
    return initial;
  });

  // Mantener sincronizado el formulario cuando la lista de caballos o reportes cambie
  React.useEffect(() => {
    setSessionForm((prev) => {
      let changed = false;
      const next = { ...prev };
      horses.forEach((h) => {
        if (!next[h.id]) {
          next[h.id] = createDefaultSessionForm(h);
          changed = true;
        } else {
          const todayReport = (h.ridingSessionHistory || []).find((r) => r.date === todayStr);
          if (todayReport && !next[h.id].isSavedToday) {
            next[h.id] = {
              ...next[h.id],
              isSavedToday: true,
              lastSavedAt: todayReport.completedAt,
            };
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [horses, todayStr, createDefaultSessionForm]);

  // Notificación de éxito temporal con URL de WhatsApp
  const [successFeedback, setSuccessFeedback] = useState<{
    horseId: string;
    message: string;
    waUrl?: string;
  } | null>(null);

  // Manejadores de cambios
  const handleUpdateForm = (horseId: string, field: string, value: any) => {
    setSessionForm((prev) => ({
      ...prev,
      [horseId]: {
        ...prev[horseId],
        [field]: value,
      },
    }));
  };

  const toggleExerciseTag = (horseId: string, exercise: string) => {
    setSessionForm((prev) => {
      const current = prev[horseId];
      if (!current) return prev;
      const exists = current.exercisesWorked.includes(exercise);
      const updated = exists
        ? current.exercisesWorked.filter((e: string) => e !== exercise)
        : [...current.exercisesWorked, exercise];

      return {
        ...prev,
        [horseId]: {
          ...current,
          exercisesWorked: updated,
        },
      };
    });
  };
  // Cargar actividad designada para el caballo hoy
  const handleLoadDesignatedActivity = (horse: Horse) => {
    setSessionForm((prev) => ({
      ...prev,
      [horse.id]: {
        ...prev[horse.id],
        sessionType: horse.ridingActivityType || prev[horse.id]?.sessionType || "Pista de Adiestramiento & Galope",
        riderName: horse.assignedRiderName || prev[horse.id]?.riderName || ridersList[0],
      },
    }));
  };

  // Guardar y publicar informe técnico al propietario
  const handlePublishRidingReport = (horse: Horse) => {
    const form = sessionForm[horse.id];
    if (!form) return;

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

    const exercisesListText =
      form.exercisesWorked.length > 0
        ? form.exercisesWorked.map((ex: string) => `  • ${ex}`).join("\n")
        : "  • Trabajo general de pista";

    const attitudeObj = ATTITUDES.find((a) => a.id === form.attitude);
    const attitudeLabel = attitudeObj ? `${attitudeObj.icon} ${attitudeObj.label}` : form.attitude;

    const waMessage =
      `*${centerSettings?.stableName || "Hacienda San Isidro"} - Informe Técnico de Monta* 🏇\n\n` +
      `🗓 *Fecha:* ${dateFormatted}\n` +
      `🐎 *Ejemplar:* ${horse.name} (${horse.pesebreraCode || "Box"})\n` +
      `👤 *Propietario:* ${horse.ownerName}\n` +
      `🏇 *Montador Responsable:* ${form.riderName}\n\n` +
      `⏱ *Duración en Pista:* ${form.durationMinutes} minutos\n` +
      `🎯 *Modalidad de Trabajo:* ${form.sessionType}\n` +
      `⭐ *Actitud & Brío del Ejemplar:* ${attitudeLabel}\n\n` +
      `✨ *Ejercicios Trabajados Hoy:*\n${exercisesListText}\n\n` +
      (form.technicalNotes.trim()
        ? `📝 *Comentarios del Montador Directo:*\n"${form.technicalNotes.trim()}"\n\n`
        : "") +
      `📲 *Este informe técnico ya está disponible en su Portal del Propietario.*`;

    const waReportUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(waMessage)}`;

    const reportPayload: Omit<HorseRidingSessionReport, "id" | "completedAt"> = {
      date: todayStr,
      horseId: horse.id,
      horseName: horse.name,
      ownerId: horse.ownerId,
      ownerName: horse.ownerName,
      boxCode: horse.pesebreraCode || undefined,
      riderName: form.riderName,
      sessionType: form.sessionType,
      durationMinutes: form.durationMinutes,
      attitude: form.attitude,
      exercisesWorked: form.exercisesWorked,
      technicalNotes: form.technicalNotes.trim() || "Sesión de pista completada satisfactoriamente.",
      publishedToOwner: true,
      waReportUrl,
    };

    if (onRecordRidingSession) {
      onRecordRidingSession(horse.id, reportPayload);
    } else {
      dataService.recordHorseRidingSession(horse.id, reportPayload);
    }

    setSessionForm((prev) => ({
      ...prev,
      [horse.id]: {
        ...prev[horse.id],
        isSavedToday: true,
        lastSavedAt: new Date().toISOString(),
      },
    }));

    setSuccessFeedback({
      horseId: horse.id,
      message: `¡Informe de monta publicado exitosamente en el perfil de ${horse.ownerName}!`,
      waUrl: waReportUrl,
    });

    setTimeout(() => {
      setSuccessFeedback((curr) => (curr?.horseId === horse.id ? null : curr));
    }, 9000);
  };

  // Filtrado de caballos para el montador
  const filteredHorses = useMemo(() => {
    return horses.filter((horse) => {
      const form = sessionForm[horse.id];
      const matchesSearch =
        horse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (horse.pesebreraCode && horse.pesebreraCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        horse.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedRiderFilter !== "todos") {
        const matchesRider =
          form?.riderName === selectedRiderFilter || horse.assignedRiderName === selectedRiderFilter;
        if (!matchesRider) return false;
      }

      const hasActivity = horse.scheduledForRidingToday ?? Boolean(horse.ridingActivityType);

      if (workFilterMode === "con_actividad") {
        return hasActivity;
      }
      if (workFilterMode === "pendientes") {
        return hasActivity && !form?.isSavedToday;
      }
      if (workFilterMode === "completados") {
        return form?.isSavedToday;
      }

      return true;
    });
  }, [horses, sessionForm, searchQuery, selectedRiderFilter, workFilterMode]);

  // Contadores
  const countWithActivity = horses.filter((h) => h.scheduledForRidingToday ?? Boolean(h.ridingActivityType)).length;
  const countCompletedToday = Object.values(sessionForm).filter((f) => f.isSavedToday).length;
  const countPendingToday = Math.max(0, countWithActivity - countCompletedToday);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Principal del Montador Directo */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-stone-950 text-white p-6 rounded-3xl border border-amber-700/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
              🏇
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Panel Exclusivo del Montador Directo
                </span>
                <span className="text-xs text-stone-400">
                  Pista, Torno & Informes al Propietario
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Registro Técnico de Entrenamiento & Monta
              </h2>
              <p className="text-xs text-stone-300 max-w-2xl mt-0.5">
                El montador ingresa directamente el trabajo realizado en pista (ejercicios, duración, respuesta de embocadura) y se publica al instante en el perfil del propietario.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/10 text-center">
            <div className="px-3 py-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Caballos con Monta Hoy</span>
              <span className="text-lg font-black text-amber-400">{countWithActivity}</span>
            </div>
            <div className="px-3 py-1 border-l border-white/10">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Informes Publicados Hoy</span>
              <span className="text-lg font-black text-emerald-400">
                {countCompletedToday}/{countWithActivity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros: Por Montador Asignado y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar caballo, código de box o propietario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-amber-600 font-semibold text-stone-800 dark:text-stone-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500 font-bold whitespace-nowrap">
            Montador en Pista:
          </label>
          <select
            value={selectedRiderFilter}
            onChange={(e) => setSelectedRiderFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-600 cursor-pointer"
          >
            <option value="todos">Todos los Montadores</option>
            {ridersList.map((rider) => (
              <option key={rider} value={rider}>
                {rider}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros de Estado de Actividad Designada */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setWorkFilterMode("con_actividad")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            workFilterMode === "con_actividad"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
          }`}
        >
          <span>🎯 Con Actividad Designada Hoy ({countWithActivity})</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkFilterMode("pendientes")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            workFilterMode === "pendientes"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>⏳ Pendientes de Informe ({countPendingToday})</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkFilterMode("completados")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            workFilterMode === "completados"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>✅ Informes Publicados Hoy ({countCompletedToday})</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkFilterMode("todos")}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            workFilterMode === "todos"
              ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-xs"
              : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
          }`}
        >
          <span>📋 Todos los Equinos ({horses.length})</span>
        </button>
      </div>

      {/* Lista de Fichas de Monta por Caballo */}
      <div className="space-y-5">
        {filteredHorses.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            No se encontraron caballos asignados a este montador o filtro.
          </div>
        ) : (
          filteredHorses.map((horse) => {
            const box = pesebreras.find((b) => b.id === horse.pesebreraId);
            const form = sessionForm[horse.id] || createDefaultSessionForm(horse);

            const isSaved = form.isSavedToday;
            const isFeedback = successFeedback?.horseId === horse.id;
            const isHistoryOpen = expandedHistoryHorseId === horse.id;
            const history = horse.ridingSessionHistory || [];

            return (
              <div
                key={horse.id}
                className={`bg-white dark:bg-stone-900 rounded-3xl border transition-all p-5 sm:p-6 shadow-xs space-y-5 ${
                  isSaved
                    ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-stone-200/90 dark:border-stone-800"
                }`}
              >
                {/* Cabecera del Caballo y Estado de Monta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700 shadow-inner">
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

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-stone-900 dark:text-stone-100 text-lg">
                          {horse.name}
                        </h4>
                        <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          {box?.code || horse.pesebreraCode || "Box"}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300">
                          Dueño: {horse.ownerName}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 mt-0.5">
                        {horse.breed} • {horse.coatColor} • {horse.gender} • {horse.ageYears} años
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {isSaved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Informe Publicado al Propietario ✓</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Sesión Pendiente de Informe</span>
                      </span>
                    )}

                    {onSelectHorse && (
                      <button
                        type="button"
                        onClick={() => onSelectHorse(horse)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-3 py-1 rounded-xl cursor-pointer"
                        title="Ver ficha técnica del ejemplar (Solo lectura para montador)"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ficha Técnica</span>
                      </button>
                    )}

                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedHistoryHorseId(isHistoryOpen ? null : horse.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-3 py-1 rounded-xl cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Historial ({history.length})</span>
                        {isHistoryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* ALERTA DE ÉXITO DE PUBLICACIÓN */}
                {isFeedback && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{successFeedback.message}</span>
                    </div>
                    {successFeedback.waUrl && (
                      <a
                        href={successFeedback.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Enviar Informe por WhatsApp</span>
                      </a>
                    )}
                  </div>
                )}
                {/* 🎯 ACTIVIDAD DESIGNADA PARA EL CABALLO EN EL DÍA */}
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl font-black shrink-0 shadow-xs">
                      🎯
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 dark:bg-amber-900/80 dark:text-amber-200">
                          Actividad Designada para Hoy
                        </span>
                        {horse.scheduledForRidingToday ?? true ? (
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            Programado para Monta Hoy
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                            🌿 En Reposo / Sin Monta
                          </span>
                        )}
                        {horse.assignedRiderName && (
                          <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300">
                            Montador designado: <strong className="text-amber-700 dark:text-amber-300">{horse.assignedRiderName}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-black text-stone-900 dark:text-stone-100 mt-1">
                        {horse.ridingActivityType || "Sesión de pista, arreglo de cabeza y ritmo (45 min)"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadDesignatedActivity(horse)}
                    className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
                    title="Cargar esta actividad designada directamente en el formulario de monta"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cargar en Sesión</span>
                  </button>
                </div>

                {/* FORMULARIO DIRECTO DEL MONTADOR */}
                <div className="space-y-4 text-xs">
                  {/* Fila 1: Montador Responsable, Tipo de Trabajo y Duración */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Montador que lo Trabajó:
                      </label>
                      <input
                        type="text"
                        value={form.riderName}
                        onChange={(e) => handleUpdateForm(horse.id, "riderName", e.target.value)}
                        placeholder="Nombre del montador"
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold outline-none focus:ring-2 focus:ring-amber-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Modalidad / Trabajo en Pista:
                      </label>
                      <select
                        value={form.sessionType}
                        onChange={(e) => handleUpdateForm(horse.id, "sessionType", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-semibold outline-none focus:ring-2 focus:ring-amber-600"
                      >
                        {SESSION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        Duración de la Sesión:
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[20, 30, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => handleUpdateForm(horse.id, "durationMinutes", mins)}
                            className={`flex-1 py-2 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                              form.durationMinutes === mins
                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fila 2: Actitud y Respuesta del Caballo (Calificación Técnica) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300 block">
                      Actitud y Respuesta a la Embocadura / Rienda:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {ATTITUDES.map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => handleUpdateForm(horse.id, "attitude", att.id)}
                          className={`p-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 text-center ${
                            form.attitude === att.id
                              ? `${att.color} font-black shadow-xs ring-2 ring-amber-500`
                              : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          <span className="text-base">{att.icon}</span>
                          <span className="leading-tight">{att.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fila 3: Ejercicios Realizados en la Sesión (Tags Clicables) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700 dark:text-stone-300 block">
                      Ejercicios Específicos Trabajados (Selecciona los que practicó hoy):
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {AVAILABLE_EXERCISES.map((ex) => {
                        const isSelected = form.exercisesWorked.includes(ex);
                        return (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => toggleExerciseTag(horse.id, ex)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-[11px] border ${
                              isSelected
                                ? "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-extrabold shadow-xs"
                                : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            <span>{isSelected ? "✓ " : "+ "}</span>
                            <span>{ex}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fila 4: Notas Técnicas del Montador para el Propietario */}
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Comentarios & Observaciones del Montador (Directo al Dueño):
                    </label>
                    <textarea
                      rows={2}
                      value={form.technicalNotes}
                      onChange={(e) => handleUpdateForm(horse.id, "technicalNotes", e.target.value)}
                      placeholder="Describe cómo sintió el caballo, respuesta a la pierna y freno, soltura de hombros, etc..."
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-amber-600 resize-none font-medium"
                    />
                  </div>

                  {/* Botón de Publicación al Propietario */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-xs text-stone-500">
                      {isSaved
                        ? "Este informe ya fue publicado en el perfil del propietario."
                        : "Haz clic para registrar y notificar al dueño inmediatamente."}
                    </span>

                    <Button
                      type="button"
                      onClick={() => handlePublishRidingReport(horse)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 px-5 rounded-2xl cursor-pointer shadow-md gap-2 flex items-center justify-center text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar Informe de Monta al Propietario</span>
                    </Button>
                  </div>
                </div>

                {/* HISTORIAL ANTERIOR DE INFORMES DE MONTA DE ESTE CABALLO */}
                {isHistoryOpen && (
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2.5 animate-fade-in text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-amber-600" />
                        <span>Historial de Sesiones de Monta Registradas</span>
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {history.length} reportes archivados
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {history.map((hist) => (
                        <div
                          key={hist.id}
                          className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1.5 text-[11px]"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-stone-900 dark:text-stone-100">
                              🗓 {hist.date} • {hist.riderName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black uppercase">
                              {hist.durationMinutes} min • {hist.sessionType}
                            </span>
                          </div>

                          {hist.exercisesWorked && hist.exercisesWorked.length > 0 && (
                            <p className="text-stone-600 dark:text-stone-300">
                              <strong>Ejercicios:</strong> {hist.exercisesWorked.join(", ")}
                            </p>
                          )}

                          {hist.technicalNotes && (
                            <p className="text-stone-500 italic mt-0.5">
                              &ldquo;{hist.technicalNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
