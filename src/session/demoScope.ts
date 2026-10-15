import type { Repository } from '@/data/repository';
import type { SessionKind } from './SessionProvider';

/**
 * A demo session only ever sees sample data. With a Supabase project set, the app's repository sends some methods to the
 * server (`withServer`); a demo session has no server identity of its own, and a real sign-in left in this browser must
 * never be used under a demo account (spec 002: demo never writes to real records). So below the session, a demo gets the
 * plain in-memory repository, whatever the app's repository is.
 */
export function repositoryForSession(kind: SessionKind, appRepository: Repository, demoRepository: Repository): Repository {
  return kind === 'demo' ? demoRepository : appRepository;
}
