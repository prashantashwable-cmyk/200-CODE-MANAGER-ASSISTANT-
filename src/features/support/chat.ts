/**
 * The support chat's rules, pure (176). The same chat, bot and human-handoff idea the Communication Engine already has, framed for after the sale: the assistant answers what it can answer
 * from the customer's own records, and anything it is not clearly sure of goes to a person, warmly and with the customer's whole picture. **Every threshold and word list is a placeholder
 * for the owner to confirm, flagged on screen.**
 */
import { hours } from '@/features/sla/clock';
import { safetyWordsIn } from '@/features/service/tickets';

export type Intent = 'greeting' | 'thanks' | 'payment_status' | 'amc' | 'progress' | 'documents' | 'troubleshoot' | 'human' | 'out_of_scope' | 'unknown';
export type TipId = 'door' | 'call_button' | 'slow' | 'display' | 'power' | 'noise_light';
export type HandoffReason = 'requested' | 'low_confidence' | 'borderline' | 'safety' | 'needs_person';

/** The quick replies offered above the composer. */
export const QUICK_INTENTS: Intent[] = ['payment_status', 'progress', 'amc', 'troubleshoot', 'human'];
/** A reply is expected within this many business minutes, the same target the internal reply inbox uses (057). */
export const REPLY_TARGET_MIN = 60;
/** After a person has replied, the assistant stays out of it for this long. */
export const HUMAN_HOLD = hours(12);
/** A queue this long is "busy": the customer is told honestly and offered another way. */
export const QUEUE_BUSY = 5;
/** How long one conversation typically takes a person (placeholder), for an honest estimate of the wait. */
export const HANDLE_MINUTES = 15;
/** Within this of the bot's configured limit counts as borderline: a person answers, not a guess. */
export const BORDERLINE_MARGIN = 0.1;
export const MAX_MESSAGE = 1000;

const WORDS: Record<Exclude<Intent, 'unknown' | 'troubleshoot'>, string[]> = {
  greeting: ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'good morning', 'good evening', 'नमस्ते', 'नमस्कार'],
  thanks: ['thank', 'thanks', 'dhanyavad', 'shukriya', 'आभार', 'धन्यवाद', 'शुक्रिया'],
  payment_status: ['payment', 'pay ', 'due', 'owe', 'overdue', 'how much', 'pending', 'invoice', 'balance', 'paid', 'emi', 'receipt', 'bill', 'amount', 'bhugtan', 'paisa', 'पेमेंट', 'भुगतान', 'बकाया', 'बाकी', 'रसीद', 'बिल', 'पावती', 'इन्व्हॉइस', 'रक्कम'],
  amc: ['amc', 'annual maintenance', 'service plan', 'renew', 'maintenance contract', 'नवीनीकरण', 'नूतनीकरण', 'सर्विस प्लान', 'सर्व्हिस प्लॅन'],
  progress: ['progress', 'status', 'when will', 'how long', 'installation date', 'handover', 'kab', 'kitna', 'स्थिति', 'कब तक', 'प्रगति', 'कधीपर्यंत', 'केव्हा', 'स्थिती'],
  documents: ['document', 'certificate', 'warranty paper', 'agreement', 'copy of', 'दस्तावेज', 'प्रमाणपत्र', 'करार', 'कागदपत्र'],
  human: ['talk to', 'speak to', 'human', 'person', 'agent', 'call me', 'someone', 'representative', 'insaan', 'बात करनी', 'किसी से बात', 'माणसाशी', 'कोणाशी तरी बोल', 'बोलायचे'],
  out_of_scope: ['parking', 'plumbing', 'drainage', 'water supply', 'water tank', 'society', 'maintenance charge', 'intercom', 'cctv', 'security guard', 'garden', 'swimming', 'gym', 'property tax', 'rent', 'पार्किंग', 'सोसायटी', 'पानी'],
};
const TIPS: { id: TipId; words: string[] }[] = [
  { id: 'door', words: ['door', 'doors', 'sticks', 'not closing', 'not opening', 'darwaza', 'दरवाज़ा', 'दरवाजा'] },
  { id: 'call_button', words: ['button', 'call button', 'not responding', 'not coming', 'बटन'] },
  { id: 'slow', words: ['slow', 'slowly', 'takes long', 'dheere', 'धीमा', 'हळू'] },
  { id: 'display', words: ['display', 'floor indicator', 'screen', 'डिस्प्ले'] },
  { id: 'power', words: ['power', 'light', 'no light', 'electric', 'बिजली', 'वीज'] },
  { id: 'noise_light', words: ['noise', 'sound', 'squeak', 'humming', 'vibration', 'आवाज'] },
];
const TROUBLE = ['not working', 'problem', 'issue', 'fault', 'stopped', 'stops', 'broken', 'stuck', "doesn't work", 'kharab', 'band', 'खराब', 'बंद', 'चालत नाही', 'काम नहीं', 'समस्या'];

const hitsOf = (hay: string, words: string[]): number => words.filter((w) => hay.includes(w)).length;

export interface Parsed { intent: Intent; confidence: number; tip: TipId | null; safety: string[] }
/** What a message is about, and how sure we are. A tie between two things, or nothing recognisable, is not sure. */
export function intentOf(text: string, hint?: Intent | null): Parsed {
  const hay = ` ${text.toLowerCase().trim()} `;
  const safety = safetyWordsIn(text);
  if (hint && hint !== 'unknown') return { intent: hint, confidence: 0.95, tip: null, safety };
  if (safety.length > 0) return { intent: 'troubleshoot', confidence: 0.95, tip: null, safety };
  if (hay.trim().length < 2) return { intent: 'unknown', confidence: 0.2, tip: null, safety };
  const scores: { intent: Intent; n: number }[] = (Object.keys(WORDS) as (keyof typeof WORDS)[]).map((k) => ({ intent: k, n: hitsOf(hay, WORDS[k]) }));
  const tip = TIPS.map((t) => ({ t, n: hitsOf(hay, t.words) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)[0];
  const trouble = hitsOf(hay, TROUBLE) + (tip ? 1 : 0);
  if (trouble > 0) scores.push({ intent: 'troubleshoot', n: trouble });
  const ranked = scores.filter((s) => s.n > 0).sort((a, b) => b.n - a.n);
  if (ranked.length === 0) return { intent: 'unknown', confidence: 0.3, tip: null, safety };
  // "Talk to someone" always wins: the customer asked.
  if (ranked.some((r) => r.intent === 'human')) return { intent: 'human', confidence: 0.95, tip: null, safety };
  const [a, b] = ranked;
  if (b && b.n === a.n && a.intent !== 'greeting' && b.intent !== 'greeting') return { intent: a.intent, confidence: 0.6, tip: null, safety };
  const base = a.n >= 2 ? 0.92 : 0.85;
  // A greeting with a real question in it is about the question.
  const real = ranked.find((r) => r.intent !== 'greeting' && r.intent !== 'thanks') ?? a;
  return { intent: real.intent, confidence: real === a ? base : 0.85, tip: real.intent === 'troubleshoot' ? tip?.t.id ?? null : null, safety };
}

export interface Decision { answer: boolean; reason: HandoffReason | null }
/** Answer only when clearly sure (above the configured limit plus a margin); otherwise a person, warmly. */
export function decide(p: Parsed, threshold: number): Decision {
  if (p.safety.length > 0) return { answer: false, reason: 'safety' };
  if (p.intent === 'human') return { answer: false, reason: 'requested' };
  if (p.confidence < threshold) return { answer: false, reason: 'low_confidence' };
  if (p.confidence < threshold + BORDERLINE_MARGIN) return { answer: false, reason: 'borderline' };
  return { answer: true, reason: null };
}

export type Handling = 'bot' | 'waiting' | 'human';
export function handlingOf(f: { openHandoff: boolean; lastAgentAt: string | null; botResumedAt: string | null; now: number }): Handling {
  if (f.openHandoff) return 'waiting';
  const agent = f.lastAgentAt ? Date.parse(f.lastAgentAt) : 0;
  const resumed = f.botResumedAt ? Date.parse(f.botResumedAt) : 0;
  return agent > resumed && f.now - agent < HUMAN_HOLD ? 'human' : 'bot';
}

export interface Queue { position: number; expectedMin: number; busy: boolean }
/** Where a waiting conversation stands among the others (oldest first), and an honest wait. */
export function queueOf(waiting: { id: string; since: number }[], id: string): Queue | null {
  const ordered = [...waiting].sort((a, b) => a.since - b.since);
  const i = ordered.findIndex((w) => w.id === id);
  if (i < 0) return null;
  return { position: i + 1, expectedMin: Math.max(5, (i + 1) * HANDLE_MINUTES), busy: ordered.length >= QUEUE_BUSY };
}

export type AgentTemplate = 'greet' | 'looking' | 'call' | 'ticket' | 'thanks';
export const AGENT_TEMPLATES: AgentTemplate[] = ['greet', 'looking', 'call', 'ticket', 'thanks'];
