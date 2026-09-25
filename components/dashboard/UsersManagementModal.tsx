"use client";

import React, { useState, useEffect } from "react";
import { UserAccount, UserRole, Client } from "@/types";
import { USER_ROLES, ROLE_LIST } from "@/lib/roles";
import { dataService } from "@/services";
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  Phone,
  Mail,
  User,
  AlertTriangle,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface UsersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/admin",
  veterinario: "/veterinario",
  mayordomo: "/mayordomo",
  propietario: "/propietario",
  montador: "/montador",
  palafrenero: "/palafrenero",
};

export function UsersManagementModal({
  isOpen,
  onClose,
  clients,
}: UsersManagementModalProps) {
  const [users, setUsers] = useState<UserAccount[]>(() => dataService.getUsers());
  const [isCreating, setIsCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "veterinario" as UserRole,
    email: "",
    phone: "",
    linkedClientId: "",
    active: true,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const refreshUsers = () => {
    setUsers(dataService.getUsers());
  };

  useEffect(() => {
    const handleUpdate = () => refreshUsers();
    window.addEventListener("users-updated", handleUpdate);
    return () => window.removeEventListener("users-updated", handleUpdate);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshUsers();
      setErrorMsg("");
      setSuccessMsg("");
      setIsCreating(false);
      setEditingUserId(null);
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "veterinario",
      email: "",
      phone: "",
      linkedClientId: "",
      active: true,
    });
    setIsCreating(false);
    setEditingUserId(null);
    setErrorMsg("");
  };

  const handleStartEdit = (user: UserAccount) => {
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role,
      email: user.email || "",
      phone: user.phone || "",
      linkedClientId: user.linkedClientId || "",
      active: user.active,
    });
    setEditingUserId(user.id);
    setIsCreating(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Ingresa el nombre completo del usuario.");
      return;
    }
    if (!formData.username.trim()) {
      setErrorMsg("Ingresa un nombre de usuario válido sin espacios.");
      return;
    }
    if (!formData.password.trim()) {
      setErrorMsg("Ingresa una contraseña para la cuenta.");
      return;
    }

    try {
      if (editingUserId) {
        dataService.updateUser(editingUserId, {
          name: formData.name.trim(),
          username: formData.username.trim(),
          password: formData.password.trim(),
          role: formData.role,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          linkedClientId: formData.role === "propietario" ? formData.linkedClientId || undefined : undefined,
          active: formData.active,
        });
        setSuccessMsg(`Usuario '${formData.username}' actualizado con éxito.`);
      } else {
        dataService.createUser({
          name: formData.name.trim(),
          username: formData.username.trim(),
          password: formData.password.trim(),
          role: formData.role,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          linkedClientId: formData.role === "propietario" ? formData.linkedClientId || undefined : undefined,
          active: formData.active,
        });
        setSuccessMsg(`Usuario '${formData.username}' creado con acceso a la ruta ${ROLE_ROUTES[formData.role]}.`);
      }
      refreshUsers();
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar el usuario.");
    }
  };

  const handleDelete = (id: string, username: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario '${username}'?`)) {
      try {
        dataService.deleteUser(id);
        refreshUsers();
        setSuccessMsg(`Usuario '${username}' eliminado.`);
      } catch (err: any) {
        setErrorMsg(err.message || "Error al eliminar usuario.");
      }
    }
  };

  const handleToggleActive = (user: UserAccount) => {
    try {
      dataService.updateUser(user.id, { active: !user.active });
      refreshUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar estado.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera decorativa */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

        {/* Encabezado */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Gestión de Usuarios y Rutas de Acceso
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Crea y administra credenciales personalizadas para cada rol: Administrador, Veterinario, Mayordomo y Propietario.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsCreating(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Crear Usuario</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificaciones de error o éxito */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
          {/* Formulario de creación / edición */}
          {isCreating && (
            <form
              onSubmit={handleSave}
              className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-850/70 border border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5">
                <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  {editingUserId ? "Editar Cuenta de Usuario" : "Crear Nueva Cuenta y Ruta de Acceso"}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* Nombre Completo */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Dr. Juan Pablo Morales"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Nombre de Usuario */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
                    Usuario de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/\s+/g, ""),
                      })
                    }
                    placeholder="Ej. veterinario"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Contraseña de acceso"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Rol del Sistema */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
                    Rol Operativo *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ROLE_LIST.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.emoji} {r.title} ({r.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+573001234567"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@pesebreras.com"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Si el rol es Propietario: vincular a un Cliente */}
                {formData.role === "propietario" && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase mb-1">
                      Vincular a Propietario Registrado en Sistema
                    </label>
                    <select
                      value={formData.linkedClientId}
                      onChange={(e) => setFormData({ ...formData, linkedClientId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-xs text-stone-900 dark:text-stone-100 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Sin vincular (Verá todos los caballos demo) --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.horsesCount} equinos • {c.identification})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Botón de Enviar */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                >
                  {editingUserId ? "Guardar Cambios" : "Crear Usuario y Habilitar Ruta"}
                </button>
              </div>
            </form>
          )}

          {/* Tabla de Usuarios Registrados */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-white dark:bg-stone-900">
            <div className="p-3 bg-stone-50 dark:bg-stone-850/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-stone-500 tracking-wider">
                Cuentas de Acceso Activas ({users.length})
              </span>
              <span className="text-[11px] text-stone-400">
                Cada usuario tiene su propia ruta protegida en el sistema
              </span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {users.map((u) => {
                const roleDef = USER_ROLES[u.role] || USER_ROLES.admin;
                const route = ROLE_ROUTES[u.role] || "/admin";
                const linkedClient = u.linkedClientId
                  ? clients.find((c) => c.id === u.linkedClientId)
                  : null;

                return (
                  <div
                    key={u.id}
                    className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl shrink-0">
                        {roleDef.emoji}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                            {u.name}
                          </h5>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${roleDef.color}`}
                          >
                            {roleDef.badge}
                          </span>
                          {!u.active && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              Desactivado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-1 flex-wrap">
                          <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300">
                            Usuario: <strong>{u.username}</strong>
                          </span>
                          <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300 flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-stone-400" />
                            Pass: {u.password}
                          </span>
                          {u.phone && <span>Tel: {u.phone}</span>}
                          {linkedClient && (
                            <span className="text-purple-700 dark:text-purple-400 font-semibold">
                              Propietario: {linkedClient.fullName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Enlace directo a la ruta de acceso */}
                      <Link
                        href={route}
                        onClick={onClose}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1"
                        title={`Ir a la ruta ${route}`}
                      >
                        <span>Ruta: {route}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(u)}
                        className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Modificar usuario o contraseña"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Eliminar (protegido contra admin) */}
                      {u.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.username)}
                          className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-stone-50 dark:bg-stone-850/80 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            💡 Las rutas dedicadas permiten que el personal ingrese directamente con su perfil sin ver módulos ajenos.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 font-bold text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
