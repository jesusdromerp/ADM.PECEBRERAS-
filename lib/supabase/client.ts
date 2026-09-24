import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea y retorna un cliente de Supabase para su uso en componentes del navegador (Client Components).
 * Utiliza exclusivamente las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan las variables de entorno de Supabase: asegúrate de definir NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
