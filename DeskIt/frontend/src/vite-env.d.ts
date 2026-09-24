/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Optional override for the hosted Floor Creator URL (default: https://dskt.vercel.app/). */
  readonly VITE_FLOOR_CREATOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
