import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wfkrnvslntzcibzcjycn.supabase.co";
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_FpnXUq47PXLljp6Q3dWD1w_NKH6NrpN";

export const isStudentPortalConfigured = Boolean(supabaseUrl && publishableKey);

export const supabase = isStudentPortalConfigured
  ? createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
