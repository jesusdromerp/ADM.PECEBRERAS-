"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dataService } from "@/services";
import { UserRole } from "@/types";
import { USER_ROLES } from "@/lib/roles";
import {
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Building2,
} from "lucide-react";
import Link from "next/link";

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/admin",
  veterinario: "/veterinario",
  mayordomo: "/mayordomo",
  propietario: "/propietario",
  montador: "/montador",
  palafrenero: "/palafrenero",
};

const DEMO_ACCOUNTS = [
  {
    role: "admin" as UserRole,
    user: "admin",
    pass: "admin123",
    name: "Administrador General",
    route: "/admin",
    desc: "Control total, canones, finanzas y usuarios",
  },
  {
    role: "veterinario" as UserRole,
    user: "veterinario",
    pass: "vet123",
    name: "Dr. Juan Pablo Morales",
    route: "/veterinario",
    desc: "Sanidad, historial clínico y prescripciones",
  },
  {
    role: "mayordomo" as UserRole,
    user: "mayordomo",
    pass: "cuadras123",
    name: "Carlos Restrepo (Jefe Cuadras)",
    route: "/mayordomo",
    desc: "Boxes, inventario de insumos y operativa",
  },
  {
    role: "propietario" as UserRole,
    user: "propietario",
    pass: "prop123",
    name: "María Camila Gómez",
    route: "/propietario",
    desc: "Mis equinos, estados de cuenta y canones",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [centerSettings, setCenterSettings] = useState(() => dataService.getCenterSettings());

  useEffect(() => {
    // Si ya hay usuario logueado, redirigir
    const current = dataService.getCurrentUser();
    if (current) {
      const targetRoute = redirectParam || ROLE_ROUTES[current.role] || "/admin";
      router.push(targetRoute);
    }
  }, [redirectParam, router]);

  const handleLogin = (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const targetUser = customUser || username;
    const targetPass = customPass || password;

    if (!targetUser.trim() || !targetPass.trim()) {
      setErrorMsg("Por favor ingresa usuario y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const user = dataService.authenticateUser(targetUser, targetPass);
      if (!user) {
        setErrorMsg("Credenciales incorrectas o usuario inactivo.");
        setLoading(false);
        return;
      }

      // Éxito: Enrutar a su apartado específico
      const destination = redirectParam || ROLE_ROUTES[user.role] || "/admin";
      router.push(destination);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al autenticar el usuario.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(demo.user);
    setPassword(demo.pass);
    handleLogin(undefined, demo.user, demo.pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 text-stone-900 dark:text-stone-100">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Panel Izquierdo: Formulario de Login */}
        <div className="p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Portal de Acceso Seguro
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Ingresa con tus credenciales asignadas para acceder a tu ruta y módulo correspondiente.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. admin, veterinario, mayordomo"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? "Accediendo..." : "Ingresar a mi Ruta"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition-colors"
            >
              ← Volver al portal general
            </Link>
          </div>
        </div>

        {/* Panel Derecho: Accesos Rápidos por Rol */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-stone-50 to-stone-100/80 dark:from-stone-850 dark:to-stone-900 border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                Ingreso Rápido por Perfil (Demo)
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Haz clic en cualquiera de las siguientes cuentas preconfiguradas para probar sus rutas de acceso:
            </p>

            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((demo) => {
                const roleDef = USER_ROLES[demo.role];
                return (
                  <button
                    key={demo.user}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className="w-full p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200/90 dark:border-stone-700/80 hover:border-emerald-500/50 hover:shadow-md transition-all text-left flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                        {roleDef.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate">
                            {demo.name}
                          </span>
                          <span
                            className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full border ${roleDef.color}`}
                          >
                            {demo.route}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          User: <strong className="font-mono text-stone-700 dark:text-stone-300">{demo.user}</strong> • Pass: <strong className="font-mono text-stone-700 dark:text-stone-300">{demo.pass}</strong>
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0">
                      Entrar →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              El sistema guarda la sesión localmente y restringe las vistas según el perfil.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando portal de acceso...</div>}>
      <LoginForm />
    </Suspense>
  );
}
