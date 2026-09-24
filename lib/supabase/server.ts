import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea y retorna un cliente de Supabase para su uso en Server Components,
 * Server Actions y Route Handlers.
 * Utiliza exclusivamente las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan las variables de entorno de Supabase: asegúrate de definir NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local"
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // La llamada a `setAll` ocurrió desde un Server Component donde
          // no se pueden mutar cookies directamente. Esto se maneja normalmente
          // a través de Server Actions, Route Handlers o middleware.
        }
      },
    },
  });
}
