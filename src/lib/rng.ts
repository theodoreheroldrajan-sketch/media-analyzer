/**
 * Seeded xorshift32 PRNG. Deterministic for the same seed.
 * Used in bootstrap CIs (analytics.ts) and demo data generation.
 */
export function createRng(seed: number) {
  let s = seed | 0;
  return {
    next(): number {
      s ^= s << 13;
      s ^= s >> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    },
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
    float(min: number, max: number): number {
      return this.next() * (max - min) + min;
    },
    chance(p: number): boolean {
      return this.next() < p;
    },
  };
}

export type Rng = ReturnType<typeof createRng>;
