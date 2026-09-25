"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  HeartPulse,
  DollarSign,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelTop,
  SlidersHorizontal,
} from "lucide-react";
import { UserRole } from "@/types";
import { USER_ROLES } from "@/lib/roles";
import { UserRoleSwitcher } from "@/components/layout/UserRoleSwitcher";

export type ActiveTab =
  | "resumen"
  | "pesebreras"
  | "caballos"
  | "propietarios"
  | "sanidad"
  | "finanzas"
  | "inventario"
  | "ajustes"
  | "operativo_montador"
  | "portal_propietario";

interface ModuleNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pesebrerasCount: number;
  horsesCount: number;
  clientsCount: number;
  inventoryCount: number;
  onOpenQuickSettings: () => void;
  navLayout: "top" | "sidebar";
  onToggleNavLayout: () => void;
  currentUserRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export function ModuleNavBar({
  activeTab,
  onTabChange,
  pesebrerasCount,
  horsesCount,
  clientsCount,
  inventoryCount,
  onOpenQuickSettings,
  navLayout,
  onToggleNavLayout,
  currentUserRole = "admin",
  onRoleChange,
}: ModuleNavBarProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const allTabs = [
    { id: "resumen" as ActiveTab, label: "Resumen General", icon: LayoutDashboard },
    { id: "pesebreras" as ActiveTab, label: `Pesebreras (${pesebrerasCount})`, icon: Building2 },
    { id: "caballos" as ActiveTab, label: `Equinos (${horsesCount})`, icon: null, emoji: "🐎" },
    { id: "propietarios" as ActiveTab, label: `Propietarios (${clientsCount})`, icon: Users },
    { id: "sanidad" as ActiveTab, label: "Sanidad & Fármacos", icon: HeartPulse },
    { id: "finanzas" as ActiveTab, label: "Alquileres & Pagos", icon: DollarSign },
    { id: "inventario" as ActiveTab, label: `Inventario (${inventoryCount})`, icon: Package },
    { id: "ajustes" as ActiveTab, label: "Ajustes", icon: Settings },
    { id: "operativo_montador" as ActiveTab, label: "Pista & Raciones", icon: null, emoji: "🏇" },
    { id: "portal_propietario" as ActiveTab, label: "Portal Propietario", icon: null, emoji: "📱" },
  ];

  // Filtrado según el rol de usuario activo
  const roleConfig = USER_ROLES[currentUserRole] || USER_ROLES.admin;
  const tabs = allTabs.filter((tab) => roleConfig.allowedTabs.includes(tab.id));


  // Comprobar si se puede desplazar a izquierda o derecha
  const checkScroll = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = tabsContainerRef.current;
    if (!el) return;

    // Escuchar scroll del contenedor
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    // Escuchar rueda del ratón (wheel) para desplazamiento horizontal ultrasuave
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Botones de desplazamiento horizontal
  const handleScrollLeft = () => {
    tabsContainerRef.current?.scrollBy({ left: -220, behavior: "smooth" });
  };

  const handleScrollRight = () => {
    tabsContainerRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  };

  // Arrastre con el ratón (Drag to scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tabsContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tabsContainerRef.current.offsetLeft);
    setScrollLeftState(tabsContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tabsContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tabsContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // SI EL MODO ES SIDEBAR (BARRA VERTICAL LATERAL)
  if (navLayout === "sidebar") {
    return (
      <aside className="w-full md:w-64 flex-shrink-0 sticky top-20 z-20 self-start">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-3 sm:p-4 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Barra Lateral
            </span>
            <button
              onClick={onToggleNavLayout}
              title="Mover barra hacia arriba"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <PanelTop className="w-3.5 h-3.5" />
              <span>Mover Arriba</span>
            </button>
          </div>

          {/* Selector de Rol / Perfil Activo */}
          {onRoleChange && (
            <div className="pb-1">
              <UserRoleSwitcher
                currentRole={currentUserRole}
                onRoleChange={onRoleChange}
              />
            </div>
          )}

          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-emerald-800 text-white shadow-xs"
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {Icon ? (
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-stone-500"}`} />
                    ) : (
                      <span className="text-sm">{tab.emoji}</span>
                    )}
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>}
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={onOpenQuickSettings}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Ajustes Rápidos</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // MODO SUPERIOR (BARRA HORIZONTAL CON DESPLAZAMIENTO DINÁMICO)
  return (
    <div className="relative sticky top-16 z-20 bg-[#fafaf9]/95 dark:bg-[#0c0a09]/95 backdrop-blur-md py-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-stone-200/90 dark:border-stone-800 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Contenedor central desplazable con flechas interactivas */}
        <div className="relative flex-1 flex items-center min-w-0">
          {/* Botón Flecha Izquierda para Desplazar */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={handleScrollLeft}
              title="Desplazar barra a la izquierda"
              className="absolute -left-2 z-10 p-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 shadow-md hover:bg-stone-50 dark:hover:bg-stone-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Riel Desplazable de Pestañas (Soporta arrastre, rueda del ratón y touch) */}
          <div
            ref={tabsContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-1 transition-all select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                    isActive
                      ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/20 scale-[1.02]"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60"
                  }`}
                >
                  {Icon ? (
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-stone-500"}`} />
                  ) : (
                    <span>{tab.emoji}</span>
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Botón Flecha Derecha para Desplazar */}
          {canScrollRight && (
            <button
              type="button"
              onClick={handleScrollRight}
              title="Desplazar barra a la derecha"
              className="absolute -right-2 z-10 p-1.5 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 shadow-md hover:bg-stone-50 dark:hover:bg-stone-700 transition-all cursor-pointer animate-pulse"
            >
              <ChevronRight className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            </button>
          )}
        </div>

        {/* Acciones de la Barra: Selector de Perfil, Mover al Lateral y Configuración */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
          {onRoleChange && (
            <UserRoleSwitcher
              currentRole={currentUserRole}
              onRoleChange={onRoleChange}
              compact
            />
          )}

          {/* Botón para mover la barra al lateral (Sidebar Mode) */}
          <button
            onClick={onToggleNavLayout}
            title="Mover barra de navegación al lateral de la pantalla"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 transition-all cursor-pointer"
          >
            <PanelLeft className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Mover al Lateral</span>
          </button>

          {/* Botón Panel de Configuración Lateral */}
          <button
            onClick={onOpenQuickSettings}
            title="Abrir panel lateral de configuración rápida"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Configuración</span>
          </button>
        </div>
      </div>
    </div>
  );
}
