import { describe, expect, it } from "vitest";
import { int, next, seedRng, shuffle, type Rng } from "./rng";

function floats(rng: Rng, count: number): number[] {
  const out: number[] = [];
  let r = rng;
  for (let i = 0; i < count; i++) {
    const [x, r2] = next(r);
    out.push(x);
    r = r2;
  }
  return out;
}

describe("seedRng / next", () => {
  it("gives the same sequence for the same seed", () => {
    expect(floats(seedRng(42), 100)).toEqual(floats(seedRng(42), 100));
  });

  it("gives different sequences for different seeds", () => {
    expect(floats(seedRng(1), 10)).not.toEqual(floats(seedRng(2), 10));
  });

  it("does not repeat a value on consecutive calls", () => {
    const xs = floats(seedRng(7), 100);
    expect(new Set(xs).size).toBe(xs.length);
  });

  it("returns floats in [0, 1)", () => {
    for (const x of floats(seedRng(123), 10_000)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("does not mutate the state it is given", () => {
    const rng = seedRng(5);
    const before = { ...rng };
    next(rng);
    expect(rng).toEqual(before);
  });

  it("resumes the same sequence after a JSON round-trip", () => {
    const [, mid] = next(seedRng(99));
    const restored = JSON.parse(JSON.stringify(mid)) as Rng;
    expect(floats(restored, 20)).toEqual(floats(mid, 20));
  });
});

describe("int", () => {
  it("stays within [0, n) and hits every value over 10k samples", () => {
    const n = 6;
    const seen = new Set<number>();
    let r = seedRng(2024);
    for (let i = 0; i < 10_000; i++) {
      const [k, r2] = int(r, n);
      expect(Number.isInteger(k)).toBe(true);
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThan(n);
      seen.add(k);
      r = r2;
    }
    expect(seen.size).toBe(n);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects n = %s", (n) => {
    expect(() => int(seedRng(1), n)).toThrow(RangeError);
  });

  it("always returns 0 for n = 1", () => {
    let r = seedRng(3);
    for (let i = 0; i < 100; i++) {
      const [k, r2] = int(r, 1);
      expect(k).toBe(0);
      r = r2;
    }
  });
});

describe("shuffle", () => {
  const input = Object.freeze(["a", "b", "c", "d", "e", "f", "g", "h"]);

  it("does not change its input", () => {
    shuffle(seedRng(1), input);
    expect(input).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });

  it("returns a permutation of its input", () => {
    const [out] = shuffle(seedRng(1), input);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });

  it("is deterministic for a given seed", () => {
    expect(shuffle(seedRng(8), input)[0]).toEqual(
      shuffle(seedRng(8), input)[0],
    );
  });

  it("produces more than one ordering across seeds", () => {
    const orders = new Set<string>();
    for (let seed = 0; seed < 20; seed++)
      orders.add(shuffle(seedRng(seed), input)[0].join(""));
    expect(orders.size).toBeGreaterThan(1);
  });

  it("handles an empty array", () => {
    expect(shuffle(seedRng(1), [])[0]).toEqual([]);
  });
});
