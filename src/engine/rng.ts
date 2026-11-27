/**
 * Seeded, pure RNG (mulberry32). State is a plain serialisable object; every
 * call returns the value together with the next state, and never mutates its
 * input.
 */
export type Rng = { readonly s: number };

/** `seed` is reduced to a uint32 (`seed >>> 0`). */
export function seedRng(seed: number): Rng {
  return { s: seed >>> 0 };
}

/** A float in [0, 1). */
export function next(rng: Rng): [number, Rng] {
  const s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, { s }];
}

/** An integer in [0, n). `n` must be a positive integer. */
export function int(rng: Rng, n: number): [number, Rng] {
  if (!Number.isInteger(n) || n < 1)
    throw new RangeError(`int: n must be a positive integer, got ${n}`);
  const [x, r] = next(rng);
  return [Math.floor(x * n), r];
}

/** A shuffled copy of `xs` (Fisher–Yates); `xs` itself is left untouched. */
export function shuffle<T>(rng: Rng, xs: readonly T[]): [T[], Rng] {
  const out = [...xs];
  let r = rng;
  for (let i = out.length - 1; i > 0; i--) {
    const [j, r2] = int(r, i + 1);
    r = r2;
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return [out, r];
}
