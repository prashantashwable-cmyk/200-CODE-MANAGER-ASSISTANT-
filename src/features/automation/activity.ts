/** The recent-activity log, summarised so a busy system stays readable (181): runs of the same kind of action fold into one line with a count. */
export interface ActivityInput { id: string; at: string; category: string; sourceKey: string; actionTaken: string; subjectLabel?: string }
export interface ActivityGroup { key: string; category: string; sourceKey: string; count: number; latestAt: string; oldestAt: string; latest: ActivityInput }

/** Newest first. `windowMs` folds entries of one kind that sit within it of each other; `max` caps the number of lines. */
export function foldActivity(entries: ActivityInput[], windowMs: number, max: number): ActivityGroup[] {
  const groups: ActivityGroup[] = [];
  for (const e of [...entries].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : b.id.localeCompare(a.id)))) {
    const t = Date.parse(e.at);
    const open = groups.find((g) => g.category === e.category && g.sourceKey === e.sourceKey && Date.parse(g.oldestAt) - t <= windowMs);
    if (open) { open.count += 1; open.oldestAt = e.at; continue; }
    groups.push({ key: `${e.category}|${e.sourceKey}|${e.id}`, category: e.category, sourceKey: e.sourceKey, count: 1, latestAt: e.at, oldestAt: e.at, latest: e });
  }
  return groups.slice(0, max);
}
