"use client";

import React, { useState } from "react";
import { Client, Pesebrera, Horse, HorseGender, HorseHealthStatus } from "@/types";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewHorseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  availableBoxes: Pesebrera[];
  onAddHorse: (horse: Omit<Horse, "id" | "createdAt" | "updatedAt">) => void;
}

export function NewHorseModal({
  isOpen,
  onClose,
  clients,
  availableBoxes,
  onAddHorse,
}: NewHorseModalProps) {
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("Paso Fino Colombiano");
  const [gender, setGender] = useState<HorseGender>("macho");
  const [coatColor, setCoatColor] = useState("Castaño");
  const [ageYears, setAgeYears] = useState(5);
  const [ownerId, setOwnerId] = useState(clients[0]?.id || "");
  const [pesebreraId, setPesebreraId] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<HorseHealthStatus>("optimo");
  const [dietNotes, setDietNotes] = useState("");
  const [microchip, setMicrochip] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedOwner = clients.find((c) => c.id === ownerId);
    const selectedBox = availableBoxes.find((b) => b.id === pesebreraId);

    onAddHorse({
      name: name.trim(),
      breed,
      gender,
      coatColor,
      birthDate: new Date(Date.now() - ageYears * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      ageYears: Number(ageYears),
      microchip: microchip.trim() || undefined,
      ownerId: ownerId || clients[0]?.id,
      ownerName: selectedOwner?.fullName || "Propietario",
      pesebreraId: pesebreraId || null,
      pesebreraCode: selectedBox?.code || null,
      healthStatus,
      dietNotes: dietNotes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐎</span>
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-lg">
              Registrar Nuevo Equino
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Nombre del Caballo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Lucero de la Noche"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Raza / Andar
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="Paso Fino Colombiano">Paso Fino Colombiano</option>
                <option value="Trocha y Galope">Trocha y Galope</option>
                <option value="Trocha Pura">Trocha Pura</option>
                <option value="Trote y Galope">Trote y Galope</option>
                <option value="Cuarto de Milla">Cuarto de Milla</option>
                <option value="Pura Sangre Inglés">Pura Sangre Inglés</option>
                <option value="Frisón">Frisón</option>
                <option value="Árabe">Árabe</option>
                <option value="Criollo Colombiano">Criollo Colombiano</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Sexo
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as HorseGender)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="macho">Macho (Entero)</option>
                <option value="hembra">Hembra (Yegua)</option>
                <option value="castrado">Castrado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Capa / Color
              </label>
              <input
                type="text"
                value={coatColor}
                onChange={(e) => setCoatColor(e.target.value)}
                placeholder="ej: Castaño, Alazán, Tordillo"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Edad (Años)
              </label>
              <input
                type="number"
                min="1"
                max="35"
                value={ageYears}
                onChange={(e) => setAgeYears(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Propietario / Cliente *
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.identification})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Asignar Pesebrera
              </label>
              <select
                value={pesebreraId}
                onChange={(e) => setPesebreraId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="">(Sin asignar por ahora)</option>
                {availableBoxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name} ({b.zone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Estado de Salud
              </label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value as HorseHealthStatus)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="optimo">Óptimo</option>
                <option value="en_tratamiento">En tratamiento</option>
                <option value="reposo">Reposo</option>
                <option value="observacion">Observación</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Microchip (Opcional)
            </label>
            <input
              type="text"
              value={microchip}
              onChange={(e) => setMicrochip(e.target.value)}
              placeholder="COL-982-xxx-xxx"
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Notas de Alimentación y Cuidados
            </label>
            <textarea
              rows={2}
              value={dietNotes}
              onChange={(e) => setDietNotes(e.target.value)}
              placeholder="ej: 3 raciones de heno + suplemento mineral en la mañana..."
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 cursor-pointer">
              <Check className="w-4 h-4" />
              Guardar Equino
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
