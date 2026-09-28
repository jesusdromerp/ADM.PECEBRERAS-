export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "theme-changed";

/**
 * Script que corre en el <head> antes de pintar la página: aplica la clase "dark"
 * según la preferencia guardada o la del sistema, para evitar el destello en claro.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento (modo privado): el tema se aplica solo en esta visita
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { theme } }));
}

export function subscribeTheme(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
