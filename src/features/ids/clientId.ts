/**
 * Ids made on the device for things that may be sent later (an offline outbox, a double tap): the repository uses them to
 * recognise the same item twice. They come from the platform's cryptographic random source, never `Math.random`.
 */

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A time-ordered, collision-safe id, e.g. `c-m1x2y3z4-9f3a1c2e`. */
export const newClientId = (prefix = ''): string => `${prefix}${Date.now().toString(36)}-${randomHex(4)}`;

/** Random digits for a one-time code, uniformly drawn (no modulo bias). */
export function randomDigits(length: number): string {
  let out = '';
  while (out.length < length) {
    const [n] = globalThis.crypto.getRandomValues(new Uint32Array(1));
    if (n < 4_294_967_290) out += String(n % 10); // reject the top few values so every digit is equally likely
  }
  return out;
}

/** A random lowercase token for a link key. */
export const randomToken = (bytes = 12): string => randomHex(bytes);

/** A one-time code of `length` digits that never starts with 0 (so it reads as the length it is). */
export function randomCode(length: number): string {
  let first = '0';
  while (first === '0') first = randomDigits(1);
  return first + randomDigits(length - 1);
}
