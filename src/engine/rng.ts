/**
 * Seeded, pure RNG. State is a plain serialisable object; every call returns
 * the value together with the next state, and never mutates its input.
 */
export type Rng = { readonly s: number }

export function seedRng(_seed: number): Rng {
  throw new Error('not implemented')
}

/** A float in [0, 1). */
export function next(_rng: Rng): [number, Rng] {
  throw new Error('not implemented')
}

/** An integer in [0, n). */
export function int(_rng: Rng, _n: number): [number, Rng] {
  throw new Error('not implemented')
}

/** A shuffled copy of `xs`; `xs` itself is left untouched. */
export function shuffle<T>(_rng: Rng, _xs: readonly T[]): [T[], Rng] {
  throw new Error('not implemented')
}
