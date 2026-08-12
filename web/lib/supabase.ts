import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local",
  );
}

/**
 * La app no tiene login: un solo cliente con la key publica sirve tanto en
 * Server Components/Server Actions como en Client Components (no hay
 * sesion/cookies que mantener).
 *
 * Sin generic <Database>: los tipos de fila estan escritos a mano en
 * database.types.ts (PersonaRow, PrestamoRow, etc.) y se aplican en cada
 * query/action con `lanzarSiError<T>()`, en vez de pelear con la inferencia
 * generica de supabase-js contra un Database hecho a mano (requiere
 * Relationships y formas exactas que no vale la pena reproducir aqui).
 */
export const supabase = createClient(url, key);
