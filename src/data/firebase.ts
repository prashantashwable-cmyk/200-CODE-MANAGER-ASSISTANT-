/**
 * Firebase adapter slot — NOT WIRED UP IN THIS BUILD.
 *
 * The Foundation prompt specifies Firebase Auth (phone + OTP primary,
 * email/password and Google as fallbacks), Firestore for the data model, and
 * Firebase Hosting. None of that can be provisioned from here: it needs a real
 * Firebase project, real API keys, and an owner-approved billing tier. So this
 * build ships the seeded in-memory repository instead, behind the same
 * `Repository` interface, and Demo Mode is fully functional.
 *
 * ---------------------------------------------------------------------------
 * WHAT TO DO WHEN YOU HAVE A FIREBASE PROJECT
 * ---------------------------------------------------------------------------
 * 1. npm i firebase
 * 2. Create .env.local with (Vite only exposes VITE_-prefixed vars):
 *      VITE_FIREBASE_API_KEY=...
 *      VITE_FIREBASE_AUTH_DOMAIN=...
 *      VITE_FIREBASE_PROJECT_ID=...
 *      VITE_FIREBASE_STORAGE_BUCKET=...
 *      VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *      VITE_FIREBASE_APP_ID=...
 *    Never commit .env.local.
 * 3. Implement `firebaseRepository` below against the same `Repository`
 *    interface, mapping each method to a Firestore query on these collections:
 *      users, leads, deals, jobs, payments, suppliers,
 *      activity, alerts, zones, routePlans, commissions,
 *      automations, siteVisits
 * 4. In src/main.tsx, pass it in:  <DataProvider repository={firebaseRepository}>
 *
 * SECURITY RULES — do this before any real data goes in. Demo records carry
 * `isDemo: true`; production records must carry `isDemo: false`, and the rules
 * must forbid a demo session from reading or writing anything where
 * `isDemo == false`. That separation is a stated requirement of the login
 * screen spec ("can never write to or mix with real production records, even
 * by accident"), and it belongs in server-side rules — a client-side check
 * alone is not a boundary.
 *
 * ALSO STILL REQUIRED BEFORE GOING LIVE (each called out in the prompt set):
 *   - a real payment gateway account and keys
 *   - a WhatsApp Business API account for the communication engine
 *   - a financing-partner integration
 *   - legal review of the generated contract and compliance copy
 */

import type { Repository } from './repository';

export const FIREBASE_COLLECTIONS = [
  'users',
  'leads',
  'deals',
  'jobs',
  'payments',
  'suppliers',
  'activity',
  'alerts',
  'zones',
  'routePlans',
  'commissions',
  'automations',
  'siteVisits',
] as const;

export const firebaseConfigFromEnv = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const isFirebaseConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

/** Placeholder so the intended shape is obvious. Not exported to the app. */
export type FirebaseRepository = Repository;
