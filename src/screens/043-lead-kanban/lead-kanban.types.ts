/** Screen 043 — Lead Stage Pipeline Kanban. Types and translation keys only. */

export type LeadKanbanStatus = 'loading' | 'ready' | 'error';

export type MoveResult = 'moved' | 'blocked_quoted' | 'blocked_won' | 'error';

export const LEAD_KANBAN_KEYS = {
  title: 'leadKanban.title',
  subtitle: 'leadKanban.subtitle',
  loading: 'leadKanban.loading',
  error: { title: 'leadKanban.error.title', body: 'leadKanban.error.body' },
  columnCount: 'leadKanban.columnCount',
  daysInStage: 'leadKanban.daysInStage',
  staleTag: 'leadKanban.staleTag',
  photoCount: 'leadKanban.photoCount',
  unassigned: 'leadKanban.unassigned',
  moveSheet: {
    title: 'leadKanban.moveSheet.title',
    moveTo: 'leadKanban.moveSheet.moveTo',
    openDetail: 'leadKanban.moveSheet.openDetail',
    blockedQuoted: 'leadKanban.moveSheet.blockedQuoted',
    blockedWon: 'leadKanban.moveSheet.blockedWon',
  },
  toast: {
    moved: 'leadKanban.toast.moved',
    blockedQuoted: 'leadKanban.toast.blockedQuoted',
    blockedWon: 'leadKanban.toast.blockedWon',
  },
  dragHint: 'leadKanban.dragHint',
} as const;
