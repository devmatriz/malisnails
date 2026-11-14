import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "../../supabase-config.js";

export let supabase = null;
export { isSupabaseConfigured };

let loading = null;

// Concurrent callers share one import and one client instance.
export function initSupabaseClient() {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (supabase) return Promise.resolve(supabase);

  loading ??= import("https://esm.sh/@supabase/supabase-js@2")
    .then(({ createClient }) => {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabase;
    })
    .catch((error) => {
      console.error("Supabase client failed to load", error);
      loading = null;
      return null;
    });
  return loading;
}
