/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** The Supabase project's address and public (anon / publishable) key. Both set = real sign-in (S1); unset = the in-memory build. */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** 'true' once an SMS provider sends the sign-in codes from the server's outbox. */
  readonly VITE_SMS_CONNECTED?: string;
  /** 'true' once Google sign-in is set up in Google Cloud and the Supabase project (docs/SUPABASE_SETUP.md). */
  readonly VITE_GOOGLE_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
