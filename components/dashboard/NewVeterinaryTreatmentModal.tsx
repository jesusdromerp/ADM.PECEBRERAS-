"use client";

import React, { useState } from "react";
import {
  Horse,
  Client,
  TreatmentType,
  TreatmentRoute,
  HorseHealthStatus,
  VeterinaryRecord,
} from "@/types";
import {
  X,
  Stethoscope,
  HeartPulse,
  Syringe,
  Pill,
  Calendar,
  AlertTriangle,
  UserCheck,
  DollarSign,
  FileText,
  ShieldAlert,
  Send,
  Sparkles,
} from "lucide-react";

interface NewVeterinaryTreatmentModalProps {
  horses: Horse[];
  clients?: Client[];
  initialHorseId?: string;
  defaultVeterinarian?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    record: Omit<VeterinaryRecord, "id" | "createdAt" | "updatedAt">,
    options?: {
      newHorseStatus?: HorseHealthStatus;
      chargeToOwner?: boolean;
      notifyOwner?: boolean;
    }
  ) => void;
}

const COMMON_DIAGNOSES = [
  { label: "Cólico Espasmódico", type: "medicamento" as TreatmentType, severity: "grave" as const, status: "reposo" as HorseHealthStatus },
  { label: "Tendinitis / Desmitis", type: "medicamento" as TreatmentType, severity: "moderada" as const, status: "en_tratamiento" as HorseHealthStatus },
  { label: "Laceración / Herida Cutánea", type: "medicamento" as TreatmentType, severity: "leve" as const, status: "en_tratamiento" as HorseHealthStatus },
  { label: "Encefalitis y Tétanos", type: "vacuna" as TreatmentType, severity: "leve" as const, status: "optimo" as HorseHealthStatus },
  { label: "Control Parasitario", type: "desparasitacion" as TreatmentType, severity: "leve" as const, status: "optimo" as HorseHealthStatus },
  { label: "Odontoplastia / Puntas de Muela", type: "control" as TreatmentType, severity: "leve" as const, status: "en_tratamiento" as HorseHealthStatus },
  { label: "Traqueobronquitis / Tos", type: "medicamento" as TreatmentType, severity: "moderada" as const, status: "en_tratamiento" as HorseHealthStatus },
  { label: "Herraje Terapéutico / Absceso", type: "herraje" as TreatmentType, severity: "moderada" as const, status: "en_tratamiento" as HorseHealthStatus },
];

export function NewVeterinaryTreatmentModal({
  horses,
  clients = [],
  initialHorseId,
  defaultVeterinarian = "Dr. Roberto Gómez (MVZ)",
  isOpen,
  onClose,
  onSave,
}: NewVeterinaryTreatmentModalProps) {
  const activeHorses = horses.filter((h) => h.isActive !== false);

  const [selectedHorseId, setSelectedHorseId] = useState<string>(
    initialHorseId || (activeHorses[0]?.id ?? "")
  );
  const [type, setType] = useState<TreatmentType>("medicamento");
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [title, setTitle] = useState("");
  const [dosage, setDosage] = useState("");
  const [route, setRoute] = useState<TreatmentRoute>("intramuscular");
  const [frequency, setFrequency] = useState("Cada 12 horas");
  const [durationDays, setDurationDays] = useState(3);
  const [severity, setSeverity] = useState<"leve" | "moderada" | "grave">("moderada");
  const [horseHealthStatus, setHorseHealthStatus] = useState<HorseHealthStatus>("en_tratamiento");
  const [stableCareInstructions, setStableCareInstructions] = useState("");
  const [administeredBy, setAdministeredBy] = useState(defaultVeterinarian);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextDueDate, setNextDueDate] = useState("");
  const [cost, setCost] = useState<string>("0");
  const [chargeToOwner, setChargeToOwner] = useState(true);
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const currentHorse = activeHorses.find((h) => h.id === selectedHorseId) || activeHorses[0];

  const handleSelectTemplate = (template: typeof COMMON_DIAGNOSES[0]) => {
    setDiagnosis(template.label);
    setType(template.type);
    setSeverity(template.severity);
    setHorseHealthStatus(template.status);

    if (template.type === "vacuna") {
      setTitle("Vacuna Biológica Encefalitis + Tétanos (Refuerzo 2ml)");
      setDosage("2 ml vía IM profunda en tabla del cuello");
      setRoute("intramuscular");
      setFrequency("Dosis única anual");
      setDurationDays(1);
      setStableCareInstructions("Reposo ligero de pista por 48 horas.");
    } else if (template.type === "desparasitacion") {
      setTitle("Pasta Oral Ivermectina + Prazicuantel");
      setDosage("Jeringa dosificadora según peso vivo");
      setRoute("oral");
      setFrequency("Dosis única cuatrimestral");
      setDurationDays(1);
      setStableCareInstructions("Suministrar en ayunas antes de forraje.");
    } else if (template.label.includes("Cólico")) {
      setTitle("Flunixin Meglumine + Hidratación y Antiespasmódico");
      setDosage("1.1 mg/kg vía IV lenta cada 12 horas");
      setRoute("intravenosa");
      setFrequency("Cada 12 horas por 2 días");
      setDurationDays(2);
      setStableCareInstructions("Suspender concentrado 24h, ofrecer agua fresca a libre demanda, monitoreo de bosta.");
    } else if (template.label.includes("Tendinitis")) {
      setTitle("Terapia Antiinflamatoria + Vendaje Compresivo");
      setDosage("Aplicación tópica de gel y vendaje de soporte");
      setRoute("topica");
      setFrequency("2 veces al día");
      setDurationDays(10);
      setStableCareInstructions("Reposo en box, hidroterapia fría 20 min mañana y tarde.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHorse) return;

    const numCost = parseFloat(cost) || 0;
    const finalTitle = title.trim() || diagnosis.trim() || "Atención Veterinaria";

    onSave(
      {
        horseId: currentHorse.id,
        horseName: currentHorse.name,
        type,
        title: finalTitle,
        diagnosis: diagnosis.trim() || finalTitle,
        symptoms: symptoms.trim() || undefined,
        dosage: dosage.trim() || undefined,
        route,
        frequency: frequency.trim() || undefined,
        durationDays: durationDays > 0 ? durationDays : undefined,
        severity,
        stableCareInstructions: stableCareInstructions.trim() || undefined,
        administeredBy: administeredBy.trim() || defaultVeterinarian,
        date,
        nextDueDate: nextDueDate ? nextDueDate : undefined,
        status: "en_curso",
        cost: numCost > 0 ? numCost : undefined,
        chargeToOwner: numCost > 0 ? chargeToOwner : false,
        notes: notes.trim() || undefined,
      },
      {
        newHorseStatus: horseHealthStatus,
        chargeToOwner: numCost > 0 && chargeToOwner,
        notifyOwner,
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-amber-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nueva Atención & Diagnóstico Clínico</h3>
              <p className="text-xs text-rose-100">
                Prescripción de tratamientos, diagnóstico de patologías y cuidado del paciente equino
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. Selección del Paciente Equino */}
          <div className="bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Paciente Equino
              </label>
              {currentHorse && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
                  Box: {currentHorse.pesebreraCode || "Sin Box"} • Propietario: {currentHorse.ownerName}
                </span>
              )}
            </div>

            <select
              value={selectedHorseId}
              onChange={(e) => setSelectedHorseId(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
              required
            >
              {activeHorses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.breed} (Box: {h.pesebreraCode || "Sin asignar"}) | Dueño: {h.ownerName}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Plantillas Rápidas de Diagnóstico */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Sugerencias Diagnósticas Habituales (Clic para autocompletar):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DIAGNOSES.map((tmpl) => (
                <button
                  type="button"
                  key={tmpl.label}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 border border-stone-200 dark:border-stone-700 transition-all text-stone-700 dark:text-stone-300 text-left"
                >
                  + {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Tipo y Diagnóstico Principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Tipo de Atención *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TreatmentType)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
              >
                <option value="medicamento">Tratamiento Curativo / Fármaco</option>
                <option value="vacuna">Vacunación / Biológico</option>
                <option value="desparasitacion">Desparasitación Interna/Externa</option>
                <option value="control">Control Clínico / Examen</option>
                <option value="herraje">Herraje Terapéutico / Ortopédico</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Diagnóstico Clínico Principal *
              </label>
              <input
                type="text"
                placeholder="ej: Cólico Espasmódico Leve, Tendinitis Flexor, Laceración..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                required
              />
            </div>
          </div>

          {/* 4. Signos Clínicos y Hallazgos */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Signos Clínicos, Síntomas y Constantes Vitales
            </label>
            <textarea
              rows={2}
              placeholder="ej: Temperatura: 38.2°C, FC: 44 lpm, dolor a la palpación en nudo anterior izquierdo, claudicación grado 2/5..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          {/* 5. Tratamiento / Medicamento Prescrito y Posología */}
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 space-y-4">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-4 h-4" />
              Prescripción Médica y Posología
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Medicamento / Procedimiento Prescrito *
                </label>
                <input
                  type="text"
                  placeholder="ej: Flunixin Meglumine 50mg/ml, Suero Ringer..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Posología / Dosis Exacta
                  </label>
                  <div className="flex items-center gap-1">
                    {["5ml", "10ml", "20ml", "500ml"].map((quickDose) => (
                      <button
                        key={quickDose}
                        type="button"
                        onClick={() => setDosage(quickDose)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 font-mono transition-colors cursor-pointer"
                      >
                        {quickDose}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="ej: 10 ml"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!dosage.includes("ml")) {
                        const trimmed = dosage.trim();
                        setDosage(trimmed ? `${trimmed} ml` : "10 ml");
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      dosage.includes("ml")
                        ? "bg-rose-600 text-white ring-2 ring-rose-500/30 font-extrabold"
                        : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300"
                    }`}
                    title="Fijar o agregar unidad en mililitros (ml)"
                  >
                    ml
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Vía de Administración
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value as TreatmentRoute)}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="intravenosa">Intravenosa (IV)</option>
                  <option value="intramuscular">Intramuscular (IM)</option>
                  <option value="oral">Oral (PO)</option>
                  <option value="topica">Tópica / Cutánea</option>
                  <option value="subcutanea">Subcutánea (SC)</option>
                  <option value="intraarticular">Intraarticular</option>
                  <option value="oftalmica">Oftálmica</option>
                  <option value="otra">Otra / Procedimiento</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Frecuencia
                  </label>
                  <input
                    type="text"
                    placeholder="ej: C/12h"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Días Duración
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                    className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. Severidad y Actualización de Estado de Salud */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Nivel de Severidad
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity("leve")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    severity === "leve"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-sm"
                      : "bg-white dark:bg-stone-900 text-stone-600 border-stone-200 dark:border-stone-700"
                  }`}
                >
                  🟢 Leve
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity("moderada")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    severity === "moderada"
                      ? "bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 shadow-sm"
                      : "bg-white dark:bg-stone-900 text-stone-600 border-stone-200 dark:border-stone-700"
                  }`}
                >
                  🟡 Moderada
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity("grave")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    severity === "grave"
                      ? "bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-950/60 dark:text-rose-300 shadow-sm"
                      : "bg-white dark:bg-stone-900 text-stone-600 border-stone-200 dark:border-stone-700"
                  }`}
                >
                  🔴 Grave
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Estado Físico del Ejemplar
              </label>
              <select
                value={horseHealthStatus}
                onChange={(e) => setHorseHealthStatus(e.target.value as HorseHealthStatus)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
              >
                <option value="en_tratamiento">En Tratamiento (Activo)</option>
                <option value="reposo">Reposo Estricto en Pesebrera</option>
                <option value="observacion">En Observación Preventiva</option>
                <option value="optimo">Óptimo (Procedimiento Ambulatorio)</option>
              </select>
            </div>
          </div>

          {/* 7. Instrucciones para Cuadra / Palafrenero */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Instrucciones Especiales para el Palafrenero y Caballerizo
            </label>
            <input
              type="text"
              placeholder="ej: No sacar a torno por 5 días, humedecer el heno, vendar miembros con algodón..."
              value={stableCareInstructions}
              onChange={(e) => setStableCareInstructions(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          {/* 8. Profesional, Fechas y Costo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Veterinario Responsable *
              </label>
              <input
                type="text"
                value={administeredBy}
                onChange={(e) => setAdministeredBy(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha Atención
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                Próximo Control / Revisión
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          {/* 9. Costos y Facturación al Propietario */}
          <div className="bg-stone-50 dark:bg-stone-800/40 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Costo del Procedimiento / Fármacos (COP)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2 text-sm font-bold text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-2 pt-2 md:pt-0">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={chargeToOwner}
                  onChange={(e) => setChargeToOwner(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                Generar cobro contable pendiente al propietario
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={notifyOwner}
                  onChange={(e) => setNotifyOwner(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                Publicar en el portal del propietario
              </label>
            </div>
          </div>

          {/* 10. Notas adicionales */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Notas Clínicas Adicionales o Pronóstico
            </label>
            <textarea
              rows={2}
              placeholder="Pronóstico favorable, evolución esperada en 72 horas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:from-rose-700 hover:to-amber-800 transition-all flex items-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              Guardar Atención y Diagnóstico
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
