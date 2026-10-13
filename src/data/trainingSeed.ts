import type { RefresherCadence, Assessment, AssessmentAttempt, AssessmentQuestion, CertificationBadge, LessonVisual, TrainingCheck, TrainingLesson, TrainingLessonProgress, TrainingModule, TrainingProgress, TrainingRole } from './types';

/**
 * The seeded curriculum (151). Sixteen modules across four topics, role-aware: some are for everyone, some only for the role whose work they
 * describe. The three safety modules a technician must finish before being put on a job carry `gatesJobAssignment`. Two modules have a second
 * version, so the library can show a partner what changed.
 */
const ALL: TrainingRole[] = ['surveyor', 'technician', 'supplier'];
const FIELD: TrainingRole[] = ['surveyor', 'technician'];
const v1 = [{ version: 1, effectiveFrom: '2026-01-01', minVersion: 1 }];

const m = (id: string, topic: TrainingModule['topic'], order: number, requiredFor: TrainingRole[], relevantFor: TrainingRole[], dependsOn: string[], minutes: number, lessons: number, offlineKb: number, extra: Partial<TrainingModule> = {}): TrainingModule => ({
  id: `tm-${id}`, code: id.toUpperCase(), topic, order, requiredFor, relevantFor: [...new Set([...requiredFor, ...relevantFor])], dependsOn: dependsOn.map((d) => `tm-${d}`), gatesJobAssignment: false, minutes, lessons, offlineKb, versions: v1, status: 'published', isDemo: true, ...extra,
});

export const seedTrainingModules: TrainingModule[] = [
  m('onb-01', 'onboarding', 1, ALL, ALL, [], 15, 2, 1800),
  m('onb-02', 'onboarding', 2, FIELD, ALL, ['onb-01'], 20, 5, 2600),
  m('onb-03', 'onboarding', 3, ['supplier'], [], ['onb-01'], 20, 5, 2400),
  m('saf-01', 'safety', 1, FIELD, ['supplier'], [], 30, 6, 4200, { gatesJobAssignment: true }),
  m('saf-02', 'safety', 2, ['technician'], [], ['saf-01'], 40, 3, 6800, { gatesJobAssignment: true, versions: [...v1, { version: 2, effectiveFrom: '2026-08-15', minVersion: 1, changeKey: 'change2' }] }),
  m('saf-03', 'safety', 3, ['technician'], [], ['saf-01'], 35, 3, 5200, { gatesJobAssignment: true }),
  m('saf-04', 'safety', 4, ['technician'], ['surveyor'], ['saf-01'], 25, 5, 3600),
  m('saf-05', 'safety', 5, ['supplier'], [], ['onb-01'], 25, 5, 3000),
  m('cus-01', 'customer', 1, FIELD, ['supplier'], ['onb-01'], 20, 4, 2200),
  m('cus-02', 'customer', 2, ['surveyor'], [], ['cus-01'], 30, 6, 4000),
  m('cus-03', 'customer', 3, ['technician'], [], ['cus-01', 'prd-03'], 20, 4, 2600),
  m('prd-01', 'product', 1, FIELD, ['supplier'], ['onb-01'], 35, 7, 5600),
  m('prd-02', 'product', 2, ['surveyor'], [], ['prd-01'], 30, 6, 4400),
  m('prd-03', 'product', 3, ['technician'], [], ['saf-02', 'saf-03', 'prd-01'], 60, 10, 9800, { versions: [...v1, { version: 2, effectiveFrom: '2026-09-10', minVersion: 1, changeKey: 'change2' }] }),
  m('prd-04', 'product', 4, [], ['technician'], ['prd-03'], 30, 6, 4800),
  m('prd-05', 'product', 5, ['supplier'], [], ['prd-01'], 30, 6, 4200),
];

const ts = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();
const done = (userId: string, code: string, daysAgo: number, version = 1): TrainingProgress => {
  const mod = seedTrainingModules.find((x) => x.code === code.toUpperCase()) as TrainingModule;
  return { userId, moduleId: mod.id, status: 'completed', startedAt: ts(daysAgo + 2), completedAt: ts(daysAgo), version, lessonsDone: mod.lessons };
};
const doing = (userId: string, code: string, daysAgo: number, lessonsDone: number): TrainingProgress => ({ userId, moduleId: `tm-${code}`, status: 'in_progress', startedAt: ts(daysAgo), version: 1, lessonsDone });

const techFull = (id: string, base: number, v2 = 2): TrainingProgress[] => [
  done(id, 'onb-01', base + 40), done(id, 'onb-02', base + 38), done(id, 'saf-01', base + 35), done(id, 'saf-02', base + 30, v2), done(id, 'saf-03', base + 28), done(id, 'saf-04', base + 25),
  done(id, 'cus-01', base + 22), done(id, 'prd-01', base + 20), done(id, 'prd-03', base + 15, v2), done(id, 'cus-03', base + 10),
];
const surveyorFull = (id: string, base: number): TrainingProgress[] => [done(id, 'onb-01', base + 30), done(id, 'onb-02', base + 28), done(id, 'saf-01', base + 26), done(id, 'cus-01', base + 22), done(id, 'cus-02', base + 18), done(id, 'prd-01', base + 14), done(id, 'prd-02', base + 10)];

export const seedTrainingProgress: TrainingProgress[] = [
  // Technicians. Santosh finished safety before the hoistway module was revised (still counts, shown as updated); Ajay has not finished the safety modules yet, so he cannot be put on a new job.
  ...techFull('u-tech-1', 3, 1),
  ...techFull('u-tech-2', 1),
  ...techFull('u-tech-5', 5),
  done('u-tech-3', 'onb-01', 30), done('u-tech-3', 'onb-02', 28), done('u-tech-3', 'saf-01', 20), doing('u-tech-3', 'saf-02', 3, 1),
  // Surveyors.
  ...surveyorFull('u-srv-1', 4),
  done('u-srv-2', 'onb-01', 25), done('u-srv-2', 'onb-02', 24), done('u-srv-2', 'saf-01', 20), doing('u-srv-2', 'cus-01', 2, 2),
  done('u-srv-3', 'onb-01', 12),
  // Suppliers.
  done('u-sup-1', 'onb-01', 200), done('u-sup-1', 'onb-03', 198), done('u-sup-1', 'saf-05', 190), done('u-sup-1', 'prd-01', 185), done('u-sup-1', 'prd-05', 180),
];

/* ------------------------------------------------------------------ lessons (152) */

const scene = (module: string, n: number, lesson: number, durationS: number, visual: LessonVisual) => ({ id: `${module}-${lesson}-s${n}`, durationS, visual });
const lesson = (code: string, order: number, visuals: LessonVisual[], durations: number[], checks: Omit<TrainingCheck, 'id'>[], points: number, changedInVersion = 1): TrainingLesson => ({
  id: `tl-${code}-${order}`,
  moduleId: `tm-${code}`,
  order,
  changedInVersion,
  scenes: visuals.map((v, i) => scene(code, i + 1, order, durations[i] ?? 45, v)),
  checks: checks.map((c, i) => ({ ...c, id: `${code}-${order}-c${i + 1}` })),
  points,
});

/**
 * The lessons that are authored so far: the welcome module and the two safety modules that decide whether a technician can be put on a job.
 * Their wording is a starting draft for the owner's own safety adviser to review. A module with no lessons here says so; nobody is shown an empty
 * player and nothing can be marked finished without being played.
 */
export const seedTrainingLessons: TrainingLesson[] = [
  lesson('onb-01', 1, ['welcome', 'promise', 'person'], [40, 50, 40], [{ afterScene: 1, kind: 'single', options: 3, correct: [1] }], 3),
  lesson('onb-01', 2, ['phone', 'inspect', 'warning'], [40, 50, 45], [{ afterScene: 1, kind: 'single', options: 3, correct: [1] }], 3),
  lesson('saf-02', 1, ['harness', 'inspect', 'warning'], [50, 55, 40], [{ afterScene: 1, kind: 'multi', options: 3, correct: [0, 1] }], 3),
  lesson('saf-02', 2, ['anchor', 'anchor', 'warning'], [45, 55, 40], [{ afterScene: 1, kind: 'single', options: 3, correct: [1] }], 3, 2),
  lesson('saf-02', 3, ['person', 'rescue', 'warning'], [45, 55, 45], [{ afterScene: 1, kind: 'single', options: 3, correct: [0] }], 3),
  lesson('saf-03', 1, ['power', 'power', 'person'], [50, 55, 35], [{ afterScene: 1, kind: 'single', options: 3, correct: [0] }], 3),
  lesson('saf-03', 2, ['lock', 'tag', 'lock'], [40, 40, 55], [{ afterScene: 1, kind: 'multi', options: 3, correct: [0, 1] }], 3),
  lesson('saf-03', 3, ['meter', 'meter', 'warning'], [40, 55, 40], [{ afterScene: 1, kind: 'single', options: 3, correct: [1] }], 3),
];

const lessonById = (id: string) => seedTrainingLessons.find((l) => l.id === id) as TrainingLesson;
const lessonDone = (userId: string, id: string, daysAgo: number, version = 1): TrainingLessonProgress => {
  const l = lessonById(id);
  const total = l.scenes.reduce((n, x) => n + x.durationS, 0);
  const at = ts(daysAgo);
  return { userId, lessonId: id, moduleId: l.moduleId, version, positionS: total, furthestS: total, checks: l.checks.map((c) => ({ checkId: c.id, attempts: [{ at, selected: c.correct, correct: true }], clearedAt: at })), startedAt: ts(daysAgo + 0.01), updatedAt: at, completedAt: at };
};

/** Ajay has finished the first hoistway lesson and is part-way through the second. Everyone else's completions are module-level (taken before lessons were recorded one by one). */
export const seedTrainingLessonProgress: TrainingLessonProgress[] = [
  lessonDone('u-tech-3', 'tl-saf-02-1', 3),
  { userId: 'u-tech-3', lessonId: 'tl-saf-02-2', moduleId: 'tm-saf-02', version: 1, positionS: 62, furthestS: 62, checks: [], startedAt: ts(2), updatedAt: ts(2) },
];

/* ------------------------------------------------------------------ assessments (154) */

const q = (id: string, kind: 'single' | 'multi', options: number, correct: number[], sinceVersion = 1): AssessmentQuestion => ({ id, kind, options, correct, sinceVersion });

/**
 * The tests for the modules that have lessons. Pass mark and cooldowns are placeholders (Admin configures them). The safety modules' tests are
 * what makes finishing them count towards being given a job (151's gate); the wording is a starting draft for the owner's safety adviser.
 */
export const seedAssessments: Assessment[] = [
  { id: 'as-onb-01', moduleId: 'tm-onb-01', passPercent: 80, cooldownHours: [1, 4, 24], questions: [q('q1', 'single', 3, [0]), q('q2', 'multi', 3, [0, 1]), q('q3', 'single', 3, [0]), q('q4', 'single', 3, [0])] },
  { id: 'as-saf-02', moduleId: 'tm-saf-02', passPercent: 80, cooldownHours: [1, 4, 24], questions: [q('q1', 'multi', 3, [0, 1]), q('q2', 'single', 3, [1], 2), q('q3', 'single', 3, [0]), q('q4', 'single', 3, [0]), q('q5', 'single', 3, [0])] },
  { id: 'as-saf-03', moduleId: 'tm-saf-03', passPercent: 80, cooldownHours: [1, 4, 24], questions: [q('q1', 'single', 3, [1]), q('q2', 'multi', 3, [0, 1]), q('q3', 'single', 3, [0]), q('q4', 'single', 3, [0]), q('q5', 'single', 3, [1])] },
];

let badgeNo = 1000;
const monthsAfter = (iso: string, months: number | null) => { if (!months) return null; const d = new Date(iso); d.setUTCMonth(d.getUTCMonth() + months); return d.toISOString(); };
const MONTHS: Record<string, number | null> = { 'onb-01': null, 'saf-02': 12, 'saf-03': 12 };
const GRACE: Record<string, number> = { 'onb-01': 0, 'saf-02': 14, 'saf-03': 14 };
const badge = (userId: string, code: string, daysAgo: number, score = 100, version = 1): CertificationBadge => {
  const issuedAt = ts(daysAgo);
  badgeNo += 1;
  return { id: `cb-${userId}-${code}`, code: `AIEC-CT-${badgeNo}`, userId, moduleId: `tm-${code}`, assessmentId: `as-${code}`, version, score, attemptId: null, issuedAt, expiresAt: monthsAfter(issuedAt, MONTHS[code] ?? null), graceDays: GRACE[code] ?? 0, cadenceVersion: 1 };
};

/**
 * People who finished before the tests existed were certified by the owner's hand at the time: the badge records the version they were certified on.
 * Three safety certifications are seeded near their year: Vishal's saf-03 has about a month left (a renewal reminder is due), Anand's saf-03 ended a few days
 * ago and he is in the grace period, and Santosh's ended well past grace while he is on a job (that job finishes, new ones wait until he renews).
 */
export const seedCertBadges: CertificationBadge[] = [
  badge('u-tech-1', 'onb-01', 38), badge('u-tech-1', 'saf-02', 27, 100, 1), badge('u-tech-1', 'saf-03', 400),
  badge('u-tech-2', 'onb-01', 36), badge('u-tech-2', 'saf-02', 25, 100, 2), badge('u-tech-2', 'saf-03', 340),
  badge('u-tech-5', 'onb-01', 42), badge('u-tech-5', 'saf-02', 30, 100, 2), badge('u-tech-5', 'saf-03', 370),
  badge('u-tech-3', 'onb-01', 29),
  badge('u-srv-1', 'onb-01', 32), badge('u-sup-1', 'onb-01', 199),
];

/** Dinesh-type case: a surveyor who finished the welcome module and has not passed its test in three tries. */
export const seedAssessmentAttempts: AssessmentAttempt[] = [50, 50, 75].map((score, i) => {
  const a = seedAssessments[0];
  const correctCount = Math.round((score / 100) * a.questions.length);
  const at = ts(6 - i * 1.5);
  return {
    id: `at-seed-${i + 1}`, assessmentId: a.id, moduleId: a.moduleId, userId: 'u-srv-2', version: 1, attemptNumber: i + 1, questionIds: a.questions.map((x) => x.id),
    answers: a.questions.map((x, n) => ({ questionId: x.id, selected: n < correctCount ? x.correct : [(x.correct[0] + 1) % x.options] })),
    status: 'submitted' as const, startedAt: at, updatedAt: at, submittedAt: at, correctCount, score, passPercent: 80, passed: false,
  };
});

/**
 * How often each certification is refreshed (156): the cadence versions in force. The two safety certifications are refreshed yearly with two weeks' grace;
 * the welcome certification does not expire. These are placeholder business decisions, flagged on screen, and Admin changes them as versions.
 */
export const seedRefresherCadences: RefresherCadence[] = [
  { assessmentId: 'as-onb-01', versions: [{ version: 1, effectiveFrom: '2026-01-01T00:00:00.000Z', months: null, graceDays: 0, reason: 'Starting cadence: a general introduction does not need refreshing.', setByName: 'Prashant Vasant Wable', setAt: '2026-01-01T00:00:00.000Z' }] },
  { assessmentId: 'as-saf-02', versions: [{ version: 1, effectiveFrom: '2026-01-01T00:00:00.000Z', months: 12, graceDays: 14, reason: 'Starting cadence: working at height is refreshed every year.', setByName: 'Prashant Vasant Wable', setAt: '2026-01-01T00:00:00.000Z' }] },
  { assessmentId: 'as-saf-03', versions: [{ version: 1, effectiveFrom: '2026-01-01T00:00:00.000Z', months: 12, graceDays: 14, reason: 'Starting cadence: electrical safety is refreshed every year.', setByName: 'Prashant Vasant Wable', setAt: '2026-01-01T00:00:00.000Z' }] },
];
