import type { ReactNode } from 'react';
import { DataProvider, useData } from '@/data/DataProvider';
import { memoryRepository } from '@/data/memoryRepository';
import { useSession } from './SessionProvider';
import { repositoryForSession } from './demoScope';

/** Below the session: a demo session reads and writes sample data only (see `repositoryForSession`). */
export function DemoDataScope({ children }: { children: ReactNode }) {
  const { kind } = useSession();
  const appRepository = useData();
  const repository = repositoryForSession(kind, appRepository, memoryRepository);
  if (repository === appRepository) return <>{children}</>;
  return <DataProvider repository={repository}>{children}</DataProvider>;
}
