import type { AutomatedActionLogEntry } from '@/data/types';

/**
 * Every action an automation takes on its own initiative gets a permanent
 * record, distinct from a human-triggered action's lead-timeline entry.
 * Pure builder only — the store and `logAutomatedAction()` wrapper live in
 * memoryRepository.ts.
 */
export type AutomatedActionInput = Omit<AutomatedActionLogEntry, 'id' | 'at' | 'isDemo'>;

export function buildAutomatedActionEntry(input: AutomatedActionInput, id: string, now: string): AutomatedActionLogEntry {
  return { id, at: now, isDemo: true, ...input };
}
