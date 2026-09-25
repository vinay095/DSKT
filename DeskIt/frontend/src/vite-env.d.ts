/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Floor Creator absolute URL (default http://localhost:5174/). Do not use same origin as DeskIt. */
  readonly VITE_FLOOR_CREATOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
