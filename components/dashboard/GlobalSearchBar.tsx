"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Building2, Users, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { Horse, Pesebrera, Client } from "@/types";

interface GlobalSearchBarProps {
  horses: Horse[];
  pesebreras: Pesebrera[];
  clients: Client[];
  onSelectHorse: (horse: Horse) => void;
  onNavigateTab: (tab: any) => void;
}

export function GlobalSearchBar({
  horses,
  pesebreras,
  clients,
  onSelectHorse,
  onNavigateTab,
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo de teclado global Ctrl+K / Cmd+K para enfocar la búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cerrar al hacer clic fuera del buscador
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeText = (str?: string | null) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const cleanQuery = normalizeText(query);

  // Filtrar resultados cuando hay al menos 1 caracter
  const matchedHorses = cleanQuery
    ? horses
        .filter(
          (h) =>
            normalizeText(h.name).includes(cleanQuery) ||
            normalizeText(h.breed).includes(cleanQuery) ||
            normalizeText(h.pesebreraCode).includes(cleanQuery) ||
            normalizeText(h.ownerName).includes(cleanQuery) ||
            normalizeText(h.microchip).includes(cleanQuery) ||
            normalizeText(h.passportNumber).includes(cleanQuery)
        )
        .slice(0, 5)
    : [];

  const matchedBoxes = cleanQuery
    ? pesebreras
        .filter(
          (b) =>
            normalizeText(b.code).includes(cleanQuery) ||
            normalizeText(b.name).includes(cleanQuery) ||
            normalizeText(b.zone).includes(cleanQuery) ||
            normalizeText(b.horseName).includes(cleanQuery) ||
            normalizeText(b.assignedHorseName).includes(cleanQuery)
        )
        .slice(0, 4)
    : [];

  const matchedClients = cleanQuery
    ? clients
        .filter(
          (c) =>
            normalizeText(c.fullName).includes(cleanQuery) ||
            normalizeText(c.identification).includes(cleanQuery) ||
            normalizeText(c.phone).includes(cleanQuery) ||
            normalizeText(c.email).includes(cleanQuery)
        )
        .slice(0, 3)
    : [];

  const totalResults = matchedHorses.length + matchedBoxes.length + matchedClients.length;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Input de Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Buscar caballo, pesebrera, dueño o microchip..."
          className="w-full pl-9 pr-14 py-2 rounded-2xl bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-stone-900 transition-all shadow-inner"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-stone-400 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-md shadow-2xs">
              Ctrl K
            </kbd>
          </div>
        )}
      </div>

      {/* Menú Desplegable de Resultados Omnibox */}
      {isOpen && cleanQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto animate-fade-in">
          {totalResults === 0 ? (
            <div className="p-6 text-center space-y-2">
              <span className="text-2xl">🔍</span>
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                No se encontraron resultados para &ldquo;{query}&rdquo;
              </p>
              <p className="text-[11px] text-stone-400">
                Intenta buscar por nombre, raza, box (ej: BOX-A01) o cédula del propietario.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-3">
              {/* Sección Caballos */}
              {matchedHorses.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1 block">
                    🐴 Ejemplares ({matchedHorses.length})
                  </span>
                  <div className="space-y-1">
                    {matchedHorses.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          onSelectHorse(h);
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center justify-between transition-colors text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                            🐎
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 dark:text-stone-100 truncate block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                              {h.name}
                            </span>
                            <span className="text-[11px] text-stone-400 truncate block">
                              {h.breed} • {h.pesebreraCode ? `Box ${h.pesebreraCode}` : "Sin box"} • {h.ownerName}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección Pesebreras */}
              {matchedBoxes.length > 0 && (
                <div className="border-t border-stone-100 dark:border-stone-800 pt-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1 block">
                    🏠 Pesebreras & Boxes ({matchedBoxes.length})
                  </span>
                  <div className="space-y-1">
                    {matchedBoxes.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          onNavigateTab("pesebreras");
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer flex items-center justify-between transition-colors text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                            {b.code}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
                              {b.name} ({b.zone})
                            </span>
                            <span className="text-[11px] text-stone-400 truncate block">
                              Estado: <strong className="capitalize">{b.status}</strong> • {b.horseName || b.assignedHorseName ? `Huésped: ${b.horseName || b.assignedHorseName}` : "Sin huésped"}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-600 dark:group-hover:text-stone-200 transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección Propietarios */}
              {matchedClients.length > 0 && (
                <div className="border-t border-stone-100 dark:border-stone-800 pt-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1 block">
                    👥 Propietarios ({matchedClients.length})
                  </span>
                  <div className="space-y-1">
                    {matchedClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigateTab("propietarios");
                          setIsOpen(false);
                          setQuery("");
                        }}
                        className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer flex items-center justify-between transition-colors text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-sm shrink-0">
                            👤
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
                              {c.fullName}
                            </span>
                            <span className="text-[11px] text-stone-400 truncate block">
                              Doc: {c.identification} • Tel: {c.phone} • {c.horsesCount} caballo(s)
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-sky-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
