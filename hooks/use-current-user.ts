"use client";

import { useSyncExternalStore } from "react";
import { dataService } from "@/services";
import { UserRole } from "@/types";

export interface CurrentUserInfo {
  id: string;
  name: string;
  role: UserRole;
  linkedClientId?: string;
}

// useSyncExternalStore exige devolver la misma referencia mientras el usuario no cambie.
let cachedKey = "";
let cachedUser: CurrentUserInfo | null = null;

function getSnapshot(): CurrentUserInfo | null {
  const user = dataService.getCurrentUser();
  const key = user ? `${user.id}|${user.role}|${user.name}|${user.linkedClientId ?? ""}` : "";
  if (key !== cachedKey) {
    cachedKey = key;
    cachedUser = user
      ? { id: user.id, name: user.name, role: user.role, linkedClientId: user.linkedClientId }
      : null;
  }
  return cachedUser;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("user-session-changed", onChange);
  window.addEventListener("users-updated", onChange);
  return () => {
    window.removeEventListener("user-session-changed", onChange);
    window.removeEventListener("users-updated", onChange);
  };
}

/** Usuario con sesión iniciada (null en el servidor o sin sesión), para firmar registros. */
export function useCurrentUser(): CurrentUserInfo | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
