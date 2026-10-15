import { describe, expect, it } from 'vitest';
import { memoryRepository } from '@/data/memoryRepository';
import { withServer } from '@/data/supabase/serverRepository';
import { repositoryForSession } from '@/session/demoScope';

describe('a demo session never reaches the server', () => {
  const serverBacked = withServer(memoryRepository);

  it('gives a demo session the in-memory repository even when the app repository is server-backed', () => {
    const repo = repositoryForSession('demo', serverBacked, memoryRepository);
    expect(repo).toBe(memoryRepository);
    // The methods the Owner and Supplier demo homes use are the in-memory ones, not the server overrides.
    expect(repo.listDecisionCards).toBe(memoryRepository.listDecisionCards);
    expect(repo.decideDecisionCard).toBe(memoryRepository.decideDecisionCard);
    expect(repo.verifyDecisionChain).toBe(memoryRepository.verifyDecisionChain);
    expect(serverBacked.decideDecisionCard).not.toBe(memoryRepository.decideDecisionCard);
  });

  it('leaves real and signed-out sessions on the app repository', () => {
    expect(repositoryForSession('authenticated', serverBacked, memoryRepository)).toBe(serverBacked);
    expect(repositoryForSession('anonymous', serverBacked, memoryRepository)).toBe(serverBacked);
  });
});
