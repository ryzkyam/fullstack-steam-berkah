import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://vmhuvevvnoaawaqlrlzd.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Pake Anon Key dari Dashboard Supabase
);
