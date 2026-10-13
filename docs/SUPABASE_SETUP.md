# Setting up Supabase for AIEC

AIEC's real database will be a Supabase project. Only the owner can create it, because it is an account
in the business's name. This takes about 15 minutes and costs nothing on the free plan.

## What the free plan gives, and where it stops

| | Free plan | Paid plan (Pro, about US$25 a month plus compute) |
|---|---|---|
| Database | 500 MB | 8 GB, more for a fee |
| People signing in | 50,000 a month | 100,000 a month |
| Projects | 2 | per project |
| A week with nobody using it | **the project pauses** (one click to resume) | never pauses |
| Daily backups | **none** | yes |
| Second sign-in step (multi-factor) | not included | included |

The free plan is right while the app is being built and tried. Before real customers and real money
depend on it, move to the paid plan for the backups and so it never pauses. Prices are Supabase's and can
change; check supabase.com/pricing when you decide.

**Sign-in codes by SMS are never free on any plan.** Each code is a text message sent through an SMS
company (Supabase connects to Twilio, MessageBird, Textlocal or Vonage), paid per message. In India the
wording must match a template registered on the DLT portal. This is needed in the next step (S1), not now.

## Steps

1. **Create the account.** Go to supabase.com, sign up with the business's email, and create an
   organisation (Free plan).
2. **Create the project.** New project:
   - Name: `aiec`
   - Database password: make a long one and **save it somewhere safe** (a password manager). It cannot be
     shown again.
   - Region: **South Asia (Mumbai)**, so data stays in India and the app is fast for people here.
3. **Find three values** (keep them private):
   - **Project reference**: Project Settings → General → "Reference ID" (looks like `abcdefghijklmnopqrst`).
   - **Database password**: the one you saved in step 2.
   - **Access token**: your account menu (top right) → Account preferences → Access Tokens → "Generate new
     token", name it `github-deploy`.
4. **Put them into GitHub, not into the chat.** In the GitHub repository: Settings → Secrets and variables →
   Actions → "New repository secret", three times:
   - `SUPABASE_PROJECT_REF` = the project reference
   - `SUPABASE_DB_PASSWORD` = the database password
   - `SUPABASE_ACCESS_TOKEN` = the access token
5. **Send the database to the project.** GitHub → Actions → "Deploy database" → "Run workflow". When it is
   green, the tables, rules and the every-minute heartbeat exist in your project. You can see them in the
   Supabase dashboard under Table Editor (`profiles`, `audit_events`, `heartbeat_runs`).
6. **Tell Claude it is done.** Then two more values are needed for the app itself (Project Settings → API:
   the **Project URL** and the **anon / publishable key**). These two are safe to share: they are meant to
   be in the app, and the database rules decide what anyone can do with them. Never share the
   `service_role` key or the database password.

## What is in the database after step 5

- `profiles`: one row per person (phone, name, role, status, demo or real). A phone that signs in for the
  first time and is not known gets a pending profile with no role, and can see nothing until Admin
  decides. Only Admin changes a role or status, and the last active Admin cannot remove themself.
- `audit_events`: the permanent record. Each entry carries a SHA-256 fingerprint of the one before it, so
  any change or deletion is detectable, and nobody (not even Admin) can edit or delete an entry.
- `heartbeat_runs`: one line a minute from the server's own clock, which checks the record is intact.
- Two private file stores, `evidence` (site photos and videos) and `documents`.

Since S1, sign-in and people use it (below). Every other screen still works on sample data in the browser and
moves onto the database one module at a time.

## Turning on real sign-in (S1)

After step 5 (the database is deployed, including `sms_outbox` and `send_sms_hook`):

7. **Phone sign-in.** Supabase dashboard → Authentication → Sign In / Providers → **Phone**: turn it on. If it
   asks for an SMS provider, choose any (for example Twilio) and type `not-used` in its fields: the next step
   makes the database receive the codes instead, so those fields are never used.
   **Also turn on "Enable phone confirmations" there. This is essential:** with it off, a signed-in account that
   adds a mobile number (a Google sign-in, step 12) would get the number at once without a code, so anyone could
   claim someone else's number and, with it, their AIEC account.
8. **Send the codes to the database.** Authentication → Hooks → **Send SMS hook** → Postgres function →
   schema `public`, function `send_sms_hook` → Enable. From now on every sign-in code lands in the private
   table `sms_outbox` (nobody using the app can read it, not even Admin).
9. **Make yourself the first Admin.** Dashboard → SQL Editor, with your own 10-digit mobile number:
   ```sql
   insert into public.profiles (phone, name, role, status)
   values ('+91XXXXXXXXXX', 'Prashant Vasant Wable', 'admin', 'active');
   ```
   When you sign in with that number, the database links the sign-in to this row. Any other number that
   signs in waits with no role until you approve it (screen "Choose your role", `/onboarding/role`, as Admin).
10. **Give the app the two public values.** Where the app is built (Vercel → Project → Settings → Environment
    Variables, or a `.env.local` file on a computer), set:
    - `VITE_SUPABASE_URL` = the Project URL
    - `VITE_SUPABASE_ANON_KEY` = the anon / publishable key
    Then rebuild. The login screen now says "Sign in with your mobile number" instead of the demo note.
11. **Until an SMS company is connected**, the code is not sent to anyone's phone, and the code screen says
    so. To let someone in, read their code in the SQL Editor and tell them (it lasts a few minutes):
    ```sql
    select phone, code, created_at from public.sms_outbox order by id desc limit 5;
    ```
    Connecting an SMS company (a DLT-registered template, paid per message) is a later step: a sender reads
    `sms_outbox`, sends, and records `sent_at`. Once it does, set `VITE_SMS_CONNECTED=true` so the code
    screen says the code was sent by SMS.

## Turning on "Continue with Google" (free)

Anyone may sign in with Google (owner's decision). A Google account AIEC does not know is asked once for its mobile
number and the code sent to it; after that, Google and that number are the same AIEC account (or it waits for you, as
a new number does). Someone who already signs in with the phone code can add Google from Settings → Connect Google.

12. **Google Cloud (free).** Go to console.cloud.google.com with the business Google account and create a project
    `AIEC`. Then:
    - APIs & Services → **OAuth consent screen**: User type **External**; app name `AIEC`; your support email; save.
      It starts in **Testing**: only the Google accounts you list under "Test users" (up to 100) can sign in. When
      you are ready for everyone, press **Publish app** (AIEC only asks for name and email, so Google does not
      need a review for that).
    - APIs & Services → **Credentials** → Create credentials → **OAuth client ID** → Web application, name `AIEC`.
      Under "Authorised redirect URIs" add `https://<project-ref>.supabase.co/auth/v1/callback` (the project
      reference from step 3). Create, and keep the **Client ID** and **Client secret** private.
13. **Supabase.** Authentication → Sign In / Providers → **Google**: turn it on and paste the Client ID and Client
    secret. Authentication → **URL Configuration**: Site URL = the app's address on Vercel (for example
    `https://aiec.vercel.app`); under Redirect URLs add `https://<that address>/login/google` and
    `https://<that address>/settings` (and, for Vercel preview links, `https://*-prashantashwable-5664s-projects.vercel.app/**`).
    Authentication → Sign In / Providers → turn on **Allow manual linking** (this is what "Connect Google" in
    Settings uses).
14. **Vercel.** Add the environment variable `VITE_GOOGLE_ENABLED` = `true` and rebuild. Until then the Google button
    says it is not set up yet, rather than sending people to an error.

Admins who sign in for real still meet the app's own second step (code `246810`, shown on that screen), because
Supabase's own second step is a paid feature; see KNOWN_GAPS.md.

### Trying it on a computer first

`npx supabase start` (needs Docker) runs the same thing locally; `npx supabase status` prints the local URL
and key. `npm run test:db` with `DB_ALREADY_MIGRATED=1 DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres`
checks the rules there (run `npx supabase db reset --local` first when the stack has been used before: one test breaks
the audit chain on purpose), and `SUPABASE_ANON_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> npm run test:e2e:server` signs
in end to end in a browser, by phone code and by the return from Google (Google's own screen needs a real Google
account, so the test starts just after it). Start the stack with
`SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=not-used SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=not-used SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=not-used`.
