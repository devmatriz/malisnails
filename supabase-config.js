export const SUPABASE_URL = "https://ipvcbunpuuleypkzdltf.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Ds_W7DwZoWYNgwbtLtBlsg_w0bPdFDh";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("TU-PROYECTO") &&
  SUPABASE_ANON_KEY !== "TU-ANON-KEY";
