"use client";

import React, { useState } from "react";
import {
  Client,
  Pesebrera,
  Horse,
  HorseGender,
  HorseHealthStatus,
  CanonPlan,
  CanonServiceInclusion,
  FeedBlendIngredient,
  HorseDietFeedConfig,
} from "@/types";
import { initialCanonPlans } from "@/services/mock-data";
import { calculateFeedDepletion } from "@/lib/feed-calculator";
import {
  X,
  Check,
  Award,
  Wrench,
  Image as ImageIcon,
  User,
  UserPlus,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  ShieldCheck,
  Wheat,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewHorseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  availableBoxes: Pesebrera[];
  canonPlans?: CanonPlan[];
  onAddHorse: (horse: Omit<Horse, "id" | "createdAt" | "updatedAt">) => void;
  onAddClient?: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => Client;
}

export function NewHorseModal({
  isOpen,
  onClose,
  clients,
  availableBoxes,
  canonPlans = [],
  onAddHorse,
  onAddClient,
}: NewHorseModalProps) {
  // Datos básicos
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("Paso Fino Colombiano");
  const [gender, setGender] = useState<HorseGender>("macho");
  const [coatColor, setCoatColor] = useState("Castaño");
  const [ageYears, setAgeYears] = useState(5);
  const [ownerId, setOwnerId] = useState(clients[0]?.id || "");
  const [ownerMode, setOwnerMode] = useState<"existente" | "nuevo">(
    clients.length > 0 ? "existente" : "nuevo"
  );
  const [newOwnerFullName, setNewOwnerFullName] = useState("");
  const [newOwnerIdentification, setNewOwnerIdentification] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("+57 ");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [pesebreraId, setPesebreraId] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<HorseHealthStatus>("optimo");
  const [dietNotes, setDietNotes] = useState("");
  const [microchip, setMicrochip] = useState("");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80"
  );

  // Pedigrí inicial
  const [includePedigree, setIncludePedigree] = useState(false);
  const [sire, setSire] = useState("");
  const [dam, setDam] = useState("");
  const [breedingFarm, setBreedingFarm] = useState("");
  const [registryNumber, setRegistryNumber] = useState("");

  // Herraje inicial (inicializadores puros)
  const [includeFarrier, setIncludeFarrier] = useState(false);
  const [lastShoeingDate, setLastShoeingDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [nextShoeingDate, setNextShoeingDate] = useState(() =>
    new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [shoeingType, setShoeingType] = useState("Herradura Lisa de Pista");
  const [farrierName, setFarrierName] = useState("Maestro Jairo Restrepo");

  // =========================================================================
  // CONSTRUCTOR DEL PLAN DE CANON Y SERVICIOS PERSONALIZADOS
  // =========================================================================
  const availablePlans = canonPlans.length > 0 ? canonPlans : initialCanonPlans;
  const defaultPlan = availablePlans[0] || initialCanonPlans[0];

  const [selectedPlanCode, setSelectedPlanCode] = useState<string>(
    defaultPlan?.code || "TIPO_A"
  );
  const [customPlanName, setCustomPlanName] = useState<string>(
    defaultPlan?.name || "Pesebrera Tipo A"
  );
  const [basePlazaCOP, setBasePlazaCOP] = useState<number>(
    defaultPlan?.basePlazaCOP ?? 300000
  );
  const [inclusions, setInclusions] = useState<CanonServiceInclusion[]>(() => {
    return (defaultPlan?.inclusions || []).map((i) => ({ ...i }));
  });

  const [isAddingExtraService, setIsAddingExtraService] = useState(false);
  const [extraServiceName, setExtraServiceName] = useState("");
  const [extraServiceCost, setExtraServiceCost] = useState<number>(100000);

  // =========================================================================
  // CONTROL DE ALIMENTO Y RACIONES PROPIAS (SI EL PLAN NO INCLUYE COMIDA)
  // =========================================================================
  const [dailyGrainKg, setDailyGrainKg] = useState<number>(3.5);
  const [feedType, setFeedType] = useState<"simple" | "mezcla">("simple");
  const [feedName, setFeedName] = useState("Italcol Pinta Campeón (40kg)");
  const [bagWeightKg, setBagWeightKg] = useState<number>(40);
  const [bagsCount, setBagsCount] = useState<number>(1);
  const [feedStartDate, setFeedStartDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [blendIngredients, setBlendIngredients] = useState<FeedBlendIngredient[]>([
    { id: "ing-1", name: "Concentrado Pinta Campeón (40kg)", kg: 40 },
    { id: "ing-2", name: "Avena Rolada en Hojuelas", kg: 20 },
    { id: "ing-3", name: "Salvado / Suplemento", kg: 5 },
  ]);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientKg, setNewIngredientKg] = useState<number>(5);

  // Raciones de comida programadas (1..N) y Monta diaria
  const [dailyPortionsCount, setDailyPortionsCount] = useState<number>(3);
  const [scheduledForRidingToday, setScheduledForRidingToday] = useState<boolean>(true);
  const [assignedRiderName, setAssignedRiderName] = useState<string>("Montador Carlos Valderrama");
  const [ridingActivityType, setRidingActivityType] = useState<string>("Pista & Adiestramiento");

  const isFeedIncludedInPlan = inclusions.some(
    (inc) =>
      inc.included &&
      (inc.name.toLowerCase().includes("comida") ||
        inc.name.toLowerCase().includes("concentrado") ||
        inc.name.toLowerCase().includes("alimento"))
  );

  const totalKgToSupply =
    feedType === "simple"
      ? (bagWeightKg || 40) * (bagsCount || 1)
      : blendIngredients.reduce((acc, curr) => acc + (Number(curr.kg) || 0), 0);

  const feedCalculation = calculateFeedDepletion(
    totalKgToSupply,
    dailyGrainKg,
    feedStartDate
  );

  const handleAddBlendIngredient = () => {
    if (!newIngredientName.trim()) return;
    setBlendIngredients((prev) => [
      ...prev,
      {
        id: `blend-${Date.now()}`,
        name: newIngredientName.trim(),
        kg: Number(newIngredientKg) || 1,
      },
    ]);
    setNewIngredientName("");
    setNewIngredientKg(5);
  };

  const handleRemoveBlendIngredient = (id: string) => {
    setBlendIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  if (!isOpen) return null;

  // Cambiar plan predeterminado o cambiar a personalizado
  const handleSelectPlan = (code: string) => {
    setSelectedPlanCode(code);
    if (code === "PERSONALIZADO") {
      setCustomPlanName("Plan a la Medida (Personalizado)");
      // Conservamos las inclusiones actuales para que el usuario las ajuste a gusto
    } else {
      const match = availablePlans.find((p) => p.code === code);
      if (match) {
        setCustomPlanName(match.name);
        setBasePlazaCOP(match.basePlazaCOP ?? 300000);
        setInclusions(match.inclusions.map((inc) => ({ ...inc })));
      }
    }
  };

  // Alternar inclusión de servicio
  const toggleInclusion = (id: string) => {
    setInclusions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, included: !item.included } : item
      )
    );
  };

  // Editar costo de un servicio
  const updateInclusionCost = (id: string, cost: number) => {
    setInclusions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, costCOP: cost } : item))
    );
  };

  // Agregar servicio adicional
  const handleAddExtraService = () => {
    if (!extraServiceName.trim()) return;
    const newInc: CanonServiceInclusion = {
      id: `custom-inc-${Date.now()}`,
      name: extraServiceName.trim(),
      included: true,
      costCOP: Number(extraServiceCost) || 50000,
      notes: "Servicio personalizado añadido al registrar el ejemplar",
    };
    setInclusions((prev) => [...prev, newInc]);
    setExtraServiceName("");
    setExtraServiceCost(100000);
    setIsAddingExtraService(false);
  };

  // Eliminar servicio de la lista
  const handleRemoveInclusion = (id: string) => {
    setInclusions((prev) => prev.filter((i) => i.id !== id));
  };

  // Cálculo en vivo del Canon Total
  const totalInclusionsCost = inclusions
    .filter((i) => i.included)
    .reduce((sum, i) => sum + (i.costCOP || 0), 0);
  const totalMonthlyPlanCost = (Number(basePlazaCOP) || 0) + totalInclusionsCost;

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalOwnerId = ownerId || clients[0]?.id || `cli-${Date.now()}`;
    let finalOwnerName = "Propietario";

    if (ownerMode === "nuevo") {
      if (!newOwnerFullName.trim()) return;
      if (onAddClient) {
        const created = onAddClient({
          fullName: newOwnerFullName.trim(),
          identification:
            newOwnerIdentification.trim() || `CC-${Date.now().toString().slice(-6)}`,
          phone: newOwnerPhone.trim() || "+57 300 000 0000",
          email:
            newOwnerEmail.trim() ||
            `${newOwnerFullName.toLowerCase().replace(/\s+/g, ".")}@criadero.com`,
          address: newOwnerAddress.trim() || undefined,
          horsesCount: 1,
          paymentStatus: "al_dia",
          outstandingBalance: 0,
        });
        finalOwnerId = created.id;
        finalOwnerName = created.fullName;
      } else {
        finalOwnerName = newOwnerFullName.trim();
      }
    } else {
      const selectedOwner = clients.find((c) => c.id === ownerId) || clients[0];
      if (selectedOwner) {
        finalOwnerId = selectedOwner.id;
        finalOwnerName = selectedOwner.fullName;
      }
    }

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
      imageUrl: imageUrl.trim() || undefined,
      ownerId: finalOwnerId,
      ownerName: finalOwnerName,
      pesebreraId: pesebreraId || null,
      pesebreraCode: selectedBox?.code || null,
      healthStatus,
      dietNotes: dietNotes.trim() || undefined,
      // Guardar el Plan de Canon armado para este ejemplar
      planCode: selectedPlanCode,
      planName: customPlanName.trim() || "Plan de Pesebrera",
      planPriceCOP: totalMonthlyPlanCost,
      planInclusions: inclusions,
      pedigree: includePedigree
        ? {
            sire: sire.trim() || undefined,
            dam: dam.trim() || undefined,
            breedingFarm: breedingFarm.trim() || undefined,
            registryNumber: registryNumber.trim() || undefined,
          }
        : undefined,
      farrierControl: includeFarrier
        ? {
            lastShoeingDate,
            nextShoeingDate,
            shoeingType,
            farrierName,
            cost: 160000,
          }
        : undefined,
      diseaseHistory: [],
      dailyPortionsCount: Number(dailyPortionsCount) || 3,
      scheduledForRidingToday,
      assignedRiderName: assignedRiderName.trim() || undefined,
      ridingActivityType: ridingActivityType.trim() || undefined,
      // Configuración de alimento propio / custodia o plan integral
      feedConfig: !isFeedIncludedInPlan
        ? {
            feedProvidedBy: "propietario",
            dailyGrainKg: Number(dailyGrainKg) || 3.5,
            dailyPortionsCount: Number(dailyPortionsCount) || 3,
            feedType,
            feedName:
              feedName.trim() ||
              (feedType === "mezcla"
                ? "Compuesto / Mezcla Especial"
                : "Concentrado Estándar"),
            bagWeightKg: feedType === "simple" ? Number(bagWeightKg) || 40 : undefined,
            bagsCount: feedType === "simple" ? Number(bagsCount) || 1 : undefined,
            blendIngredients: feedType === "mezcla" ? blendIngredients : undefined,
            totalKgSupplied: totalKgToSupply,
            startDate: feedStartDate,
            depletionDate: feedCalculation.depletionDate,
            alertDate: feedCalculation.alertDate,
            lastRestockedDate: feedStartDate,
            restockHistory: [
              {
                id: `restock-${Date.now()}`,
                date: feedStartDate,
                kgAdded: totalKgToSupply,
                notes: "Carga inicial al registrar el ejemplar",
                recordedBy: "Mayordomo / Administración",
              },
            ],
          }
        : {
            feedProvidedBy: "criadero",
            dailyGrainKg: Number(dailyGrainKg) || 3.5,
            dailyPortionsCount: Number(dailyPortionsCount) || 3,
            feedType: "simple",
            feedName: "Concentrado Cubierto por Criadero (Plan A)",
            totalKgSupplied: 9999,
            startDate: new Date().toISOString().split("T")[0],
            depletionDate: "2099-12-31",
            alertDate: "2099-12-29",
          },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xl">
              🐎
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base sm:text-lg">
                Registrar Nuevo Equino
              </h3>
              <p className="text-xs text-stone-500">
                Ficha técnica, box, pedigrí y configuración del plan de canon
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nombre y Foto */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Nombre del Ejemplar *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Relámpago de San Isidro"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Subir Foto del Ejemplar desde Galería o URL */}
          <div className="space-y-2 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Fotografía del Ejemplar
              </label>
              <label
                htmlFor="new-horse-file"
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs cursor-pointer transition-colors shadow-xs"
              >
                📁 Subir desde Galería
                <input
                  id="new-horse-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === "string") {
                          setImageUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {imageUrl && (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/50 bg-stone-900 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 truncate">
                  <span className="text-[11px] text-stone-500 block">Vista previa de la foto</span>
                  <input
                    type="text"
                    value={
                      imageUrl.startsWith("data:")
                        ? "(Imagen cargada desde tu galería)"
                        : imageUrl
                    }
                    onChange={(e) =>
                      !imageUrl.startsWith("data:") && setImageUrl(e.target.value)
                    }
                    placeholder="O pega una URL..."
                    className="w-full px-2 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Raza / Modalidad
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                N° Microchip (Opcional)
              </label>
              <input
                type="text"
                value={microchip}
                onChange={(e) => setMicrochip(e.target.value)}
                placeholder="ej: COL-982-005-120"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Estado Clínico Inicial
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

          {/* SELECCIÓN O CREACIÓN DE PROPIETARIO */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 dark:text-stone-200 text-xs flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                Propietario / Tenedor Responsable *
              </label>

              <div className="flex items-center gap-1 bg-white dark:bg-stone-900 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setOwnerMode("existente")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    ownerMode === "existente"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                  }`}
                >
                  Existente
                </button>
                <button
                  type="button"
                  onClick={() => setOwnerMode("nuevo")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    ownerMode === "nuevo"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Nuevo
                </button>
              </div>
            </div>

            {ownerMode === "existente" ? (
              <div>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-xs font-medium cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} — ({c.identification})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2 pt-1 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required={ownerMode === "nuevo"}
                      value={newOwnerFullName}
                      onChange={(e) => setNewOwnerFullName(e.target.value)}
                      placeholder="ej: Dr. Mauricio Zuluaga"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                      C.C. / Identificación *
                    </label>
                    <input
                      type="text"
                      required={ownerMode === "nuevo"}
                      value={newOwnerIdentification}
                      onChange={(e) => setNewOwnerIdentification(e.target.value)}
                      placeholder="ej: CC 70.123.456"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required={ownerMode === "nuevo"}
                      value={newOwnerPhone}
                      onChange={(e) => setNewOwnerPhone(e.target.value)}
                      placeholder="ej: +57 310 987 6543"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      placeholder="ej: cliente@ejemplo.com"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                    Dirección / Finca
                  </label>
                  <input
                    type="text"
                    value={newOwnerAddress}
                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                    placeholder="ej: Criadero La Ilusión, Tabio"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ASIGNACIÓN DE PESEBRERA Y NOTAS NUTRICIONALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Asignar Pesebrera / Box Disponible
              </label>
              <select
                value={pesebreraId}
                onChange={(e) => setPesebreraId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="">(Sin asignar por ahora)</option>
                {availableBoxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name} ({b.zone} • {b.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Notas de Dieta / Alimentación Especial
              </label>
              <input
                type="text"
                value={dietNotes}
                onChange={(e) => setDietNotes(e.target.value)}
                placeholder="ej: Heno alfalfa 40% + papilla afrecho"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECCIÓN PRINCIPAL: CONSTRUCTOR DEL PLAN DE CANON Y SERVICIOS */}
          {/* ================================================================= */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-stone-50 dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-900 border-2 border-emerald-500/40 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-900/40 pb-3">
              <div>
                <h4 className="font-black text-stone-900 dark:text-stone-100 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Armar Plan de Canon & Servicios de Pesebrera</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    Personalizable
                  </span>
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Selecciona una modalidad base o arma los servicios y costos a la medida para este ejemplar
                </p>
              </div>

              {/* Badge de total calculado en tiempo real */}
              <div className="text-right bg-emerald-800 text-white dark:bg-emerald-600 px-3.5 py-1.5 rounded-2xl shadow-sm flex-shrink-0">
                <span className="text-[9px] uppercase tracking-wider block font-semibold text-emerald-200">
                  Canon Total Mensual
                </span>
                <span className="text-sm sm:text-base font-black tracking-tight">
                  {formatCOP(totalMonthlyPlanCost)}
                </span>
              </div>
            </div>

            {/* Selector de Plan Base */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                1. Elige una modalidad de partida:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlanCode === plan.code;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleSelectPlan(plan.code)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30"
                          : "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-emerald-400"
                      }`}
                    >
                      <span className="font-extrabold text-xs block leading-tight truncate">
                        {plan.name}
                      </span>
                      <span
                        className={`text-[10px] block mt-0.5 truncate ${
                          isSelected ? "text-emerald-100" : "text-stone-500"
                        }`}
                      >
                        {formatCOP(plan.basePriceCOP)}/mes
                      </span>
                    </button>
                  );
                })}

                {/* Opción 100% Personalizado */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan("PERSONALIZADO")}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPlanCode === "PERSONALIZADO"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30"
                      : "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-emerald-400"
                  }`}
                >
                  <span className="font-extrabold text-xs block leading-tight flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    A la Medida
                  </span>
                  <span
                    className={`text-[10px] block mt-0.5 truncate ${
                      selectedPlanCode === "PERSONALIZADO"
                        ? "text-emerald-100"
                        : "text-stone-500"
                    }`}
                  >
                    100% Personalizado
                  </span>
                </button>
              </div>
            </div>

            {/* Configuración de Nombre de Plan y Tarifa Base de Plaza */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre del Plan Asignado
                </label>
                <input
                  type="text"
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder="ej: Pesebrera Tipo A - Integral"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tarifa Base de Alojamiento / Plaza (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={basePlazaCOP}
                    onChange={(e) => setBasePlazaCOP(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* Checklist Interactivo de Servicios */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300">
                  2. Marca los servicios incluidos y ajusta sus valores mensuales:
                </label>
                <span className="text-[10px] text-stone-500 font-medium">
                  {inclusions.filter((i) => i.included).length} de {inclusions.length} servicios activos
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {inclusions.map((inc) => (
                  <div
                    key={inc.id}
                    className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                      inc.included
                        ? "bg-white dark:bg-stone-900 border-emerald-500/40 shadow-xs"
                        : "bg-stone-100/60 dark:bg-stone-800/30 border-stone-200/60 dark:border-stone-800 opacity-60"
                    }`}
                  >
                    <div
                      onClick={() => toggleInclusion(inc.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
                          inc.included
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                        }`}
                      >
                        {inc.included && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <span
                          className={`font-bold text-xs block truncate ${
                            inc.included
                              ? "text-stone-900 dark:text-stone-100"
                              : "text-stone-500 line-through"
                          }`}
                        >
                          {inc.name}
                        </span>
                        {inc.notes && (
                          <span className="text-[10px] text-stone-400 block truncate">
                            {inc.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-[10px]">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="5000"
                          disabled={!inc.included}
                          value={inc.costCOP ?? 0}
                          onChange={(e) =>
                            updateInclusionCost(inc.id, Number(e.target.value) || 0)
                          }
                          className="w-full pl-5 pr-2 py-1 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-right text-xs font-bold text-stone-800 dark:text-stone-200 disabled:opacity-50"
                        />
                      </div>

                      {inc.id.startsWith("custom-inc-") && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInclusion(inc.id)}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 transition-colors"
                          title="Eliminar servicio extra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón para agregar servicio extra */}
              {!isAddingExtraService ? (
                <button
                  type="button"
                  onClick={() => setIsAddingExtraService(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Servicio Especial / Extra</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800/80 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200">
                      Nuevo Servicio Personalizado:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingExtraService(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del servicio (ej: Terapia Láser)"
                      value={extraServiceName}
                      onChange={(e) => setExtraServiceName(e.target.value)}
                      className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={extraServiceCost}
                        onChange={(e) => setExtraServiceCost(Number(e.target.value) || 0)}
                        className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExtraService}
                    disabled={!extraServiceName.trim()}
                    className="w-full py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Añadir al Plan de este Ejemplar
                  </button>
                </div>
              )}
            </div>

            {/* Resumen Final de Cobertura */}
            <div className="p-3 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-[11px] text-emerald-950 dark:text-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Impacto en la Operación y Finanzas del Criadero:</span>
              </div>
              <p className="text-stone-600 dark:text-stone-300 text-[10px] leading-relaxed">
                Este plan generará automáticamente los recibos de cobro y determinará si las novedades reportadas por los montadores (herraduras, forrajes, suplementos) están cubiertas o si se notifican por WhatsApp al propietario con cobro adicional.
              </p>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECCIÓN: CONTROL DE ALIMENTO Y RACIONES PROPIAS (CLIENTES SIN PLAN A) */}
          {/* ================================================================= */}
          {!isFeedIncludedInPlan ? (
            <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-400/60 dark:border-amber-800/80 shadow-sm space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 dark:border-amber-900/60 pb-3">
                <div>
                  <h4 className="font-black text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-amber-600" />
                    <span>Control de Alimento del Propietario (Bultos & Mezcla)</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      Alimento No Incluido
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-400">
                    Como el cliente suministra el alimento, registra la carga inicial para calcular los días de duración y activar el aviso a su WhatsApp 2 días antes de agotarse.
                  </p>
                </div>

                <div className="text-right bg-amber-500/20 border border-amber-400/40 px-3 py-1.5 rounded-2xl flex-shrink-0">
                  <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-900 dark:text-amber-300">
                    Alerta WhatsApp
                  </span>
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                    2 Días Antes
                  </span>
                </div>
              </div>

              {/* Consumo diario y Fecha de Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Consumo Diario en Grano / Concentrado (kg/día) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="15"
                      required
                      value={dailyGrainKg}
                      onChange={(e) => setDailyGrainKg(Number(e.target.value) || 1)}
                      className="w-full pl-3 pr-14 py-2 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-xs font-bold text-stone-900 dark:text-stone-100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                      kg/día
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    💡 Aprox. {(dailyGrainKg / 3).toFixed(2)} kg por ración (3 tomas al día).
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 dark:text-stone-200 mb-1">
                    Fecha de Ingreso de Bultos a Bodega *
                  </label>
                  <input
                    type="date"
                    required
                    value={feedStartDate}
                    onChange={(e) => setFeedStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-stone-900 dark:text-stone-100"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Día en que el cliente entrega la comida en la pesebrera.
                  </p>
                </div>
              </div>

              {/* Selector de Tipo de Carga */}
              <div>
                <label className="block text-[11px] font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                  ¿Cómo suministra el alimento el cliente?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedType("simple")}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      feedType === "simple"
                        ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30 font-bold"
                        : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-amber-400"
                    }`}
                  >
                    <span className="text-xs block">📦 Bulto Estándar</span>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        feedType === "simple" ? "text-amber-100" : "text-stone-400"
                      }`}
                    >
                      1 sola marca (ej: Bulto de 40 kg)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedType("mezcla")}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      feedType === "mezcla"
                        ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/30 font-bold"
                        : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-amber-400"
                    }`}
                  >
                    <span className="text-xs block">🥣 Mezcla / Compuesto</span>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        feedType === "mezcla" ? "text-amber-100" : "text-stone-400"
                      }`}
                    >
                      Varios ingredientes pesados
                    </span>
                  </button>
                </div>
              </div>

              {/* Formulario según tipo de carga */}
              {feedType === "simple" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Marca / Nombre del Alimento
                    </label>
                    <input
                      type="text"
                      value={feedName}
                      onChange={(e) => setFeedName(e.target.value)}
                      placeholder="ej: Italcol Pinta Campeón"
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Peso por Bulto (kg)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={bagWeightKg}
                        onChange={(e) => setBagWeightKg(Number(e.target.value) || 0)}
                        className="w-full pl-3 pr-10 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-[11px] font-bold">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Cantidad de Bultos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bagsCount}
                      onChange={(e) => setBagsCount(Number(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Nombre de la Mezcla o Fórmula
                    </label>
                    <input
                      type="text"
                      value={feedName}
                      onChange={(e) => setFeedName(e.target.value)}
                      placeholder="ej: Compuesto Pista (Pinta Campeón + Avena Rolada + Salvado)"
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                      Ingredientes y Pesaje del Compuesto:
                    </span>
                    <div className="space-y-1.5">
                      {blendIngredients.map((ing) => (
                        <div
                          key={ing.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs"
                        >
                          <div className="flex-1 truncate">
                            <span className="font-semibold text-stone-900 dark:text-stone-100 block truncate">
                              {ing.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg text-xs">
                              {ing.kg} kg
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBlendIngredient(ing.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Quitar ingrediente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Agregar ingrediente a la mezcla */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Otro ingrediente (ej: Salvado de Trigo, Linaza)"
                        value={newIngredientName}
                        onChange={(e) => setNewIngredientName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                      />
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          placeholder="kg"
                          value={newIngredientKg}
                          onChange={(e) =>
                            setNewIngredientKg(Number(e.target.value) || 0)
                          }
                          className="w-full pl-2.5 pr-7 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-right"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 text-[10px] font-bold">
                          kg
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddBlendIngredient}
                        disabled={!newIngredientName.trim()}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-40 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        + Añadir
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tarjeta de Cálculo Matemático en Vivo */}
              <div className="p-3.5 rounded-2xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white/80 dark:bg-stone-900/80 p-2 rounded-xl border border-amber-200 dark:border-amber-900">
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">
                      Total Pesaje
                    </span>
                    <span className="text-base font-black text-amber-800 dark:text-amber-300">
                      {totalKgToSupply} kg
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-stone-900/80 p-2 rounded-xl border border-amber-200 dark:border-amber-900">
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">
                      Consumo Día
                    </span>
                    <span className="text-base font-black text-stone-800 dark:text-stone-200">
                      {dailyGrainKg} kg
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-stone-900/80 p-2 rounded-xl border border-amber-200 dark:border-amber-900">
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">
                      Duración
                    </span>
                    <span className="text-base font-black text-emerald-800 dark:text-emerald-400">
                      {feedCalculation.daysDuration} DÍAS
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-stone-900/80 p-2 rounded-xl border border-amber-200 dark:border-amber-900">
                    <span className="text-[9px] uppercase font-bold text-stone-500 block">
                      Fin Estimado
                    </span>
                    <span className="text-xs font-black text-rose-700 dark:text-rose-400 block mt-1">
                      {feedCalculation.depletionDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  <span className="text-base">📲</span>
                  <span>
                    <strong>Alerta Automática WhatsApp:</strong> Se activará el{" "}
                    <strong>{feedCalculation.alertDate}</strong> (exactamente 2 días antes de terminarse).
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Plan con Alimento Incluido:</strong> El concentrado y raciones de este ejemplar son suministrados en su totalidad por el criadero desde la bodega general.
              </span>
            </div>
          )}

          {/* PROGRAMACIÓN DE RACIONES DIARIAS Y SESIÓN DE MONTA / PISTA */}
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-sky-950 dark:text-sky-200 flex items-center gap-1.5 text-xs">
                <span>🍽</span>
                <span>Raciones Diarias & Programación de Pista</span>
              </label>
              <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300">
                Se sincroniza con el panel de pista
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Raciones por día */}
              <div className="space-y-1">
                <span className="font-bold text-stone-700 dark:text-stone-300 block">
                  Número de Raciones / Comidas al Día:
                </span>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDailyPortionsCount(num)}
                      className={`flex-1 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                        dailyPortionsCount === num
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      {num} {num === 1 ? "ración" : "raciones"}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-stone-500">
                  El panel de pista generará dinámicamente: {Array.from({ length: dailyPortionsCount }, (_, i) => `Ración ${i + 1}`).join(", ")}
                </p>
              </div>

              {/* ¿Programado para monta? */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 dark:text-stone-300">
                    ¿Programado para Monta Diaria?
                  </span>
                  <button
                    type="button"
                    onClick={() => setScheduledForRidingToday(!scheduledForRidingToday)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      scheduledForRidingToday
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300"
                        : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border-transparent"
                    }`}
                  >
                    {scheduledForRidingToday ? "✓ Sí, en entrenamiento" : "No, en descanso / cuadra"}
                  </button>
                </div>

                {scheduledForRidingToday && (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Montador Asignado (ej: Montador Carlos Valderrama)"
                      value={assignedRiderName}
                      onChange={(e) => setAssignedRiderName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Rutina / Modalidad (ej: Pista de adiestramiento, Torno)"
                      value={ridingActivityType}
                      onChange={(e) => setRidingActivityType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección Opcional: Pedigrí */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIncludePedigree(!includePedigree)}
              className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>
                {includePedigree ? "Quitar datos de Pedigrí" : "+ Agregar Pedigrí del Ejemplar"}
              </span>
            </button>

            {includePedigree && (
              <div className="mt-3 p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Nombre del Padre (Sire)</label>
                    <input
                      type="text"
                      value={sire}
                      onChange={(e) => setSire(e.target.value)}
                      placeholder="ej: Dulce Sueño de Lusitania"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Nombre de la Madre (Dam)</label>
                    <input
                      type="text"
                      value={dam}
                      onChange={(e) => setDam(e.target.value)}
                      placeholder="ej: Silueta de La Alhambra"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Criadero de Origen</label>
                    <input
                      type="text"
                      value={breedingFarm}
                      onChange={(e) => setBreedingFarm(e.target.value)}
                      placeholder="ej: Criadero San Isidro"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">N° Registro Oficial</label>
                    <input
                      type="text"
                      value={registryNumber}
                      onChange={(e) => setRegistryNumber(e.target.value)}
                      placeholder="ej: FED-PFC-8821"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sección Opcional: Herraje */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIncludeFarrier(!includeFarrier)}
              className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>
                {includeFarrier
                  ? "Quitar control de Herraje"
                  : "+ Configurar Último Herraje"}
              </span>
            </button>

            {includeFarrier && (
              <div className="mt-3 p-3.5 bg-sky-50/50 dark:bg-sky-950/20 rounded-2xl border border-sky-200/60 dark:border-sky-900/40 space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Último Herraje</label>
                    <input
                      type="date"
                      value={lastShoeingDate}
                      onChange={(e) => setLastShoeingDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Próximo Vencimiento</label>
                    <input
                      type="date"
                      value={nextShoeingDate}
                      onChange={(e) => setNextShoeingDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Tipo de Herradura</label>
                    <input
                      type="text"
                      value={shoeingType}
                      onChange={(e) => setShoeingType(e.target.value)}
                      placeholder="ej: Herradura Lisa de Trabajo"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Herrador Asignado</label>
                    <input
                      type="text"
                      value={farrierName}
                      onChange={(e) => setFarrierName(e.target.value)}
                      placeholder="ej: Maestro Jairo Restrepo"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-4 text-xs cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl px-6 text-xs font-bold gap-2 cursor-pointer shadow-md bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Ejemplar con Plan ({formatCOP(totalMonthlyPlanCost)})</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
