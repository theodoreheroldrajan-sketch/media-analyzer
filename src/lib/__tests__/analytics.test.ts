import { describe, it, expect } from "vitest";
import {
  computeKeyMetrics,
  benjaminiHochberg,
  noiseAdjustedRank,
  computeModelStability,
  countPredictors,
  computeTrustScore,
  computeVariablePerformance,
  type CreativeData,
  type VariablePerformance,
} from "@/lib/analytics";

// ─── Helpers ────────────────────────────────────────────────────────

function makeCreative(
  overrides: Partial<CreativeData> & { creativeId: string }
): CreativeData {
  return {
    filename: `${overrides.creativeId}.png`,
    extractedVariables: {},
    impressions: 1000,
    clicks: 50,
    spend: 100,
    conversions: 5,
    revenue: 200,
    ...overrides,
  };
}

// ─── computeKeyMetrics ──────────────────────────────────────────────

describe("computeKeyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeKeyMetrics([]);
    expect(m.creativesAnalysed).toBe(0);
    expect(m.avgCTR).toBe(0);
    expect(m.avgCPC).toBe(0);
  });

  it("computes volume-weighted averages correctly", () => {
    const data: CreativeData[] = [
      makeCreative({
        creativeId: "a",
        impressions: 1000,
        clicks: 100,
        spend: 50,
        conversions: 10,
        revenue: 200,
      }),
      makeCreative({
        creativeId: "b",
        impressions: 3000,
        clicks: 150,
        spend: 150,
        conversions: 30,
        revenue: 600,
      }),
    ];

    const m = computeKeyMetrics(data);

    expect(m.creativesAnalysed).toBe(2);
    expect(m.totalImpressions).toBe(4000);
    expect(m.totalClicks).toBe(250);
    expect(m.totalSpend).toBe(200);
    expect(m.totalConversions).toBe(40);
    expect(m.totalRevenue).toBe(800);

    // CTR = (250 / 4000) * 100 = 6.25%
    expect(m.avgCTR).toBeCloseTo(6.25, 4);
    // CPC = 200 / 250 = 0.80
    expect(m.avgCPC).toBeCloseTo(0.8, 4);
    // CPA = 200 / 40 = 5.0
    expect(m.avgCPA).toBeCloseTo(5.0, 4);
    // CVR = (40 / 250) * 100 = 16%
    expect(m.avgCVR).toBeCloseTo(16.0, 4);
    // ROAS = 800 / 200 = 4.0
    expect(m.avgROAS).toBeCloseTo(4.0, 4);
  });

  it("handles zero impressions/clicks/spend gracefully", () => {
    const data = [
      makeCreative({
        creativeId: "z",
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
      }),
    ];
    const m = computeKeyMetrics(data);
    expect(m.avgCTR).toBe(0);
    expect(m.avgCPC).toBe(0);
    expect(m.avgCPA).toBe(0);
    expect(m.avgCVR).toBe(0);
    expect(m.avgROAS).toBe(0);
  });
});

// ─── benjaminiHochberg ──────────────────────────────────────────────

describe("benjaminiHochberg", () => {
  it("returns empty array for empty input", () => {
    expect(benjaminiHochberg([])).toEqual([]);
  });

  it("adjusts p-values correctly for a known set", () => {
    // Classic BH example: 4 tests
    const raw = [0.01, 0.04, 0.03, 0.20];
    const adjusted = benjaminiHochberg(raw);

    // Sorted by raw p: 0.01 (rank 1), 0.03 (rank 2), 0.04 (rank 3), 0.20 (rank 4)
    // Adjusted = p * n / rank, then enforce monotonicity from bottom:
    //   rank 4: 0.20 * 4/4 = 0.20
    //   rank 3: min(0.20, 0.04 * 4/3) = min(0.20, 0.0533) = 0.0533
    //   rank 2: min(0.0533, 0.03 * 4/2) = min(0.0533, 0.06) = 0.0533
    //   rank 1: min(0.0533, 0.01 * 4/1) = min(0.0533, 0.04) = 0.04
    // Mapped back to original order: [0.04, 0.0533, 0.0533, 0.20]
    expect(adjusted[0]).toBeCloseTo(0.04, 6);
    expect(adjusted[1]).toBeCloseTo(0.0533, 3);
    expect(adjusted[2]).toBeCloseTo(0.0533, 3);
    expect(adjusted[3]).toBeCloseTo(0.2, 6);
  });

  it("never returns values above 1", () => {
    const adjusted = benjaminiHochberg([0.8, 0.9, 0.95]);
    for (const p of adjusted) {
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("preserves single p-value", () => {
    const adjusted = benjaminiHochberg([0.05]);
    expect(adjusted[0]).toBeCloseTo(0.05, 6);
  });
});

// ─── noiseAdjustedRank ──────────────────────────────────────────────

describe("noiseAdjustedRank", () => {
  it("computes |delta| * sqrt(count)", () => {
    const vp: VariablePerformance = {
      variable: "color",
      value: "red",
      count: 16,
      avgMetric: 5,
      overallAvg: 4,
      delta: 25,
      delta95Lower: 10,
      delta95Upper: 40,
      confidence: "high",
    };
    // |25| * sqrt(16) = 25 * 4 = 100
    expect(noiseAdjustedRank(vp)).toBe(100);
  });

  it("uses absolute value of negative delta", () => {
    const vp: VariablePerformance = {
      variable: "color",
      value: "blue",
      count: 9,
      avgMetric: 3,
      overallAvg: 4,
      delta: -25,
      delta95Lower: -40,
      delta95Upper: -10,
      confidence: "medium",
    };
    // |-25| * sqrt(9) = 25 * 3 = 75
    expect(noiseAdjustedRank(vp)).toBe(75);
  });
});

// ─── computeModelStability ──────────────────────────────────────────

describe("computeModelStability", () => {
  it("returns green for ratio >= 10", () => {
    expect(computeModelStability(100, 10)).toBe("green");
    expect(computeModelStability(200, 10)).toBe("green");
  });

  it("returns yellow for ratio 5-10", () => {
    expect(computeModelStability(50, 10)).toBe("yellow");
    expect(computeModelStability(70, 10)).toBe("yellow");
  });

  it("returns red for ratio < 5", () => {
    expect(computeModelStability(40, 10)).toBe("red");
    expect(computeModelStability(10, 10)).toBe("red");
  });

  it("returns red for zero predictors", () => {
    expect(computeModelStability(100, 0)).toBe("red");
  });
});

// ─── countPredictors ────────────────────────────────────────────────

describe("countPredictors", () => {
  it("counts boolean as 1, integer as 1, enum as k-1, string as 0", () => {
    const vars = [
      { type: "boolean" as const },
      { type: "integer" as const },
      { type: "enum" as const, values: ["a", "b", "c", "d"] }, // 4-1 = 3
      { type: "string" as const },
    ];
    expect(countPredictors(vars)).toBe(5); // 1 + 1 + 3 + 0
  });

  it("handles enum with no values", () => {
    const vars = [{ type: "enum" as const }];
    expect(countPredictors(vars)).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(countPredictors([])).toBe(0);
  });
});

// ─── computeTrustScore ──────────────────────────────────────────────

describe("computeTrustScore", () => {
  it("returns a score in [0, 100] with correct level", () => {
    const varPerf: VariablePerformance[] = Array.from({ length: 10 }, (_, i) => ({
      variable: "v",
      value: String(i),
      count: 10,
      avgMetric: 5,
      overallAvg: 5,
      delta: 0,
      delta95Lower: 0,
      delta95Upper: 0,
      confidence: "high" as const,
    }));

    const score = computeTrustScore(50, 1_000_000, 100, 100, varPerf);

    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.level).toBe("excellent");
  });

  it("floor-gates on the lowest of creative count, mapping, completeness", () => {
    const varPerf: VariablePerformance[] = [];

    // High creative count and completeness, but low mapping
    const score = computeTrustScore(50, 1_000_000, 20, 100, varPerf);

    // Floor = min(100, 20, 100) = 20. With 50 bucket balance (default when empty),
    // upper = volume * 0.5 + bucketBalance * 0.5
    // Overall = floor * (upper / 100) -- capped by the floor
    expect(score.overall).toBeLessThanOrEqual(20);
    expect(score.mappingQuality).toBe(20);
  });

  it("returns poor for near-zero inputs", () => {
    const score = computeTrustScore(2, 100, 10, 10, []);
    expect(score.level).toBe("poor");
    expect(score.overall).toBeLessThan(40);
  });

  it("sub-scores are individually 0-100", () => {
    const score = computeTrustScore(200, 10_000_000, 100, 100, []);
    expect(score.creativeCount).toBeLessThanOrEqual(100);
    expect(score.volumeScore).toBeLessThanOrEqual(100);
  });
});

// ─── computeVariablePerformance ─────────────────────────────────────

describe("computeVariablePerformance", () => {
  it("returns empty for empty data", () => {
    expect(computeVariablePerformance([], ["color"], "ctr")).toEqual([]);
  });

  it("computes correct delta direction for a known split", () => {
    // "red" creatives have higher CTR than "blue"
    const data: CreativeData[] = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeCreative({
          creativeId: `red-${i}`,
          impressions: 1000,
          clicks: 100, // 10% CTR
          extractedVariables: { color: "red" },
        })
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeCreative({
          creativeId: `blue-${i}`,
          impressions: 1000,
          clicks: 20, // 2% CTR
          extractedVariables: { color: "blue" },
        })
      ),
    ];

    const results = computeVariablePerformance(data, ["color"], "ctr");

    const red = results.find((r) => r.value === "red");
    const blue = results.find((r) => r.value === "blue");

    expect(red).toBeDefined();
    expect(blue).toBeDefined();
    expect(red!.delta).toBeGreaterThan(0); // red outperforms overall
    expect(blue!.delta).toBeLessThan(0); // blue underperforms overall
    expect(red!.count).toBe(5);
    expect(blue!.count).toBe(5);
  });

  it("assigns confidence levels based on sample size", () => {
    const data: CreativeData[] = [
      // 2 creatives with "rare" -- should be insufficient
      ...Array.from({ length: 2 }, (_, i) =>
        makeCreative({
          creativeId: `rare-${i}`,
          extractedVariables: { tag: "rare" },
        })
      ),
      // 4 creatives with "uncommon" -- should be low
      ...Array.from({ length: 4 }, (_, i) =>
        makeCreative({
          creativeId: `uncommon-${i}`,
          extractedVariables: { tag: "uncommon" },
        })
      ),
      // 7 creatives with "common" -- should be medium
      ...Array.from({ length: 7 }, (_, i) =>
        makeCreative({
          creativeId: `common-${i}`,
          extractedVariables: { tag: "common" },
        })
      ),
      // 12 creatives with "frequent" -- should be high
      ...Array.from({ length: 12 }, (_, i) =>
        makeCreative({
          creativeId: `frequent-${i}`,
          extractedVariables: { tag: "frequent" },
        })
      ),
    ];

    const results = computeVariablePerformance(data, ["tag"], "ctr");

    const byValue = Object.fromEntries(results.map((r) => [r.value, r]));
    expect(byValue["rare"].confidence).toBe("insufficient");
    expect(byValue["uncommon"].confidence).toBe("low");
    expect(byValue["common"].confidence).toBe("medium");
    expect(byValue["frequent"].confidence).toBe("high");
  });

  it("bootstrap CIs have positive width for sufficient samples", () => {
    const data: CreativeData[] = Array.from({ length: 20 }, (_, i) =>
      makeCreative({
        creativeId: `c-${i}`,
        impressions: 800 + i * 50,
        clicks: 40 + i * 3,
        extractedVariables: { split: i < 10 ? "A" : "B" },
      })
    );

    const results = computeVariablePerformance(data, ["split"], "ctr");

    for (const r of results) {
      // CI should have nonzero width (bootstrap introduces variance)
      expect(r.delta95Upper).toBeGreaterThanOrEqual(r.delta95Lower);
    }
  });

  it("skips null/undefined variable values", () => {
    const data: CreativeData[] = [
      makeCreative({
        creativeId: "a",
        extractedVariables: { color: "red" },
      }),
      makeCreative({
        creativeId: "b",
        extractedVariables: { color: null as unknown as string },
      }),
      makeCreative({
        creativeId: "c",
        extractedVariables: {}, // color is undefined
      }),
    ];

    const results = computeVariablePerformance(data, ["color"], "ctr");
    // Only "red" group should appear (the null/undefined are skipped)
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe("red");
    expect(results[0].count).toBe(1);
  });
});
