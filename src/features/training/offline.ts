/**
 * What a phone keeps so training works in a lift shaft with no signal (151 saves, 152 reads). The lesson words are already in the app; what is
 * kept here is the module's structure and the person's place in it, so a lesson opens and plays on from the exact second they left it.
 */
import type { ModuleLessonsView } from '@/data/repository';

export const lessonCacheKey = (userId: string, moduleId: string) => `aiec.lessonCache.${userId}.${moduleId}`;

export function readJson<V>(key: string): V | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as V) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, v: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // Not kept on this phone.
  }
}

export const readLessonCache = (userId: string, moduleId: string) => readJson<ModuleLessonsView>(lessonCacheKey(userId, moduleId));
export const writeLessonCache = (userId: string, moduleId: string, v: ModuleLessonsView) => writeJson(lessonCacheKey(userId, moduleId), v);
