/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Public by design (shipped to the browser). */
  readonly VITE_SUPABASE_URL: string;
  /** Supabase anon/public key. Public by design; never put a service_role key here. */
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
