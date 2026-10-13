import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/session/SessionProvider';
import { HOME_PATH_BY_ROLE } from '@/navigation/registry';
import { serverConfigured } from '@/data/supabase/client';
import { finishGoogleSignIn } from '@/features/auth/serverAuth';

export type GoogleReturnState = 'working' | 'cancelled' | 'failed';

/**
 * Where Google sends a person back to. The database, not this screen, says who they are:
 *  - an AIEC account that is open → straight to their home;
 *  - an account waiting for Admin or not open → 003 says so;
 *  - no account linked yet → 003 asks them to confirm their mobile number once, which links it.
 */
export function useGoogleReturn(): { state: GoogleReturnState; back: () => void } {
  const navigate = useNavigate();
  const { signInWithServer } = useSession();
  const [state, setState] = useState<GoogleReturnState>('working');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice; the sign-in is finished once.
    started.current = true;
    if (!serverConfigured) {
      setState('failed');
      return;
    }
    // Google says the person stopped on its screen.
    if (new URLSearchParams(window.location.search).get('error')) {
      setState('cancelled');
      return;
    }
    void (async () => {
      try {
        const result = await finishGoogleSignIn();
        if (!result) {
          setState('cancelled');
          return;
        }
        const { profile } = result;
        if (!profile) {
          navigate('/login/otp', { replace: true, state: { server: true, link: true } });
          return;
        }
        if (profile.status === 'active' && profile.role) {
          await signInWithServer(profile);
          navigate(HOME_PATH_BY_ROLE[profile.role], { replace: true });
          return;
        }
        navigate('/login/otp', { replace: true, state: { server: true, profile } });
      } catch {
        setState('failed');
      }
    })();
  }, [navigate, signInWithServer]);

  return { state, back: () => navigate('/login', { replace: true }) };
}
