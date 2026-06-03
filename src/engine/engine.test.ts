import { describe, it, expect } from "vitest";
import { scoreCandidate, rankCandidates, normalizeWeights } from "./score";
import { effectiveWeight, TIER_DEFAULT_WEIGHTS, STRONG_PENALTY_MULTIPLIER } from "./criteria";
import { scoreEvidenceDensity, scoreConsistency, scoreAILikelihood } from "./evidence";
import type {
  Candidate,
  Criterion,
  ManagerCriteria,
  OrgCriteria,
  RecruiterCriteria,
} from "./types";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const emptyRecruiter: RecruiterCriteria = { criteria: [] };
const emptyOrg: OrgCriteria = { organizationId: "test", criteria: [] };

function makeCandidate(id: string, resumeText: string): Candidate {
  return { id, name: id, resumeText, source: "sample" };
}

function makeManager(criteria: Criterion[]): ManagerCriteria {
  return { roleId: "test-role", criteria };
}

// ─── effectiveWeight ──────────────────────────────────────────────────────────

describe("effectiveWeight", () => {
  it("returns tier defaults when weight is omitted", () => {
    expect(effectiveWeight({ id: "a", label: "a", tier: "deal_breaker" })).toBe(
      TIER_DEFAULT_WEIGHTS.deal_breaker
    );
    expect(effectiveWeight({ id: "b", label: "b", tier: "medium" })).toBe(
      TIER_DEFAULT_WEIGHTS.medium
    );
    expect(effectiveWeight({ id: "c", label: "c", tier: "preferred" })).toBe(
      TIER_DEFAULT_WEIGHTS.preferred
    );
  });

  it("respects an explicit custom weight over the tier default", () => {
    expect(
      effectiveWeight({ id: "a", label: "a", tier: "deal_breaker", weight: 0.3 })
    ).toBe(0.3);
  });

  it("tier defaults are ordered deal_breaker > medium > preferred", () => {
    expect(TIER_DEFAULT_WEIGHTS.deal_breaker).toBeGreaterThan(
      TIER_DEFAULT_WEIGHTS.medium
    );
    expect(TIER_DEFAULT_WEIGHTS.medium).toBeGreaterThan(
      TIER_DEFAULT_WEIGHTS.preferred
    );
  });
});

// ─── normalizeWeights ─────────────────────────────────────────────────────────

describe("normalizeWeights", () => {
  it("normalized weights sum to 1.0", () => {
    const criteria: Criterion[] = [
      { id: "a", label: "a", tier: "deal_breaker" },
      { id: "b", label: "b", tier: "medium" },
      { id: "c", label: "c", tier: "preferred" },
    ];
    const weights = normalizeWeights(criteria);
    const sum = [...weights.values()].reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it("higher-tier criteria get proportionally larger normalized weight", () => {
    const criteria: Criterion[] = [
      { id: "db", label: "a", tier: "deal_breaker" },
      { id: "m", label: "b", tier: "medium" },
      { id: "p", label: "c", tier: "preferred" },
    ];
    const weights = normalizeWeights(criteria);
    expect(weights.get("db")!).toBeGreaterThan(weights.get("m")!);
    expect(weights.get("m")!).toBeGreaterThan(weights.get("p")!);
  });
});

// ─── Hard-gate deal-breaker ───────────────────────────────────────────────────

describe("hard-gate deal-breaker", () => {
  const hardGateCriteria = makeManager([
    {
      id: "db1",
      label: "Kubernetes",
      tier: "deal_breaker",
      dealBreakerBehavior: "hard_gate",
      keywords: ["kubernetes", "k8s"],
    },
  ]);

  it("disqualifies a candidate who misses a hard-gate criterion", () => {
    const candidate = makeCandidate("miss", "Experienced Python developer.");
    const result = scoreCandidate(candidate, hardGateCriteria, emptyRecruiter, emptyOrg);
    expect(result.disqualified).toBe(true);
    expect(result.disqualifyReasons.length).toBeGreaterThan(0);
  });

  it("does NOT disqualify a candidate who meets the hard-gate criterion", () => {
    const candidate = makeCandidate("hit", "Kubernetes and k8s cluster expert.");
    const result = scoreCandidate(candidate, hardGateCriteria, emptyRecruiter, emptyOrg);
    expect(result.disqualified).toBe(false);
    expect(result.disqualifyReasons).toHaveLength(0);
  });

  it("flags the missed criterion with severity=disqualify", () => {
    const candidate = makeCandidate("miss", "Python developer, no container experience.");
    const result = scoreCandidate(candidate, hardGateCriteria, emptyRecruiter, emptyOrg);
    const flags = result.managerCriteriaScores.flatMap((s) => s.flags);
    expect(flags.some((f) => f.severity === "disqualify")).toBe(true);
  });
});

// ─── Strong-penalty deal-breaker ──────────────────────────────────────────────

describe("strong-penalty deal-breaker", () => {
  const penaltyCriteria = makeManager([
    {
      id: "db1",
      label: "Kubernetes",
      tier: "deal_breaker",
      dealBreakerBehavior: "strong_penalty",
      keywords: ["kubernetes"],
    },
  ]);

  it("does NOT disqualify a candidate who misses a strong-penalty criterion", () => {
    const candidate = makeCandidate("miss", "Python developer.");
    const result = scoreCandidate(candidate, penaltyCriteria, emptyRecruiter, emptyOrg);
    expect(result.disqualified).toBe(false);
  });

  it("applies a rawScore of -STRONG_PENALTY_MULTIPLIER on a miss", () => {
    const candidate = makeCandidate("miss", "Python developer.");
    const result = scoreCandidate(candidate, penaltyCriteria, emptyRecruiter, emptyOrg);
    expect(result.managerCriteriaScores[0].rawScore).toBe(-STRONG_PENALTY_MULTIPLIER);
  });

  it("strongly lowers score vs a candidate who met the same criterion", () => {
    const met = makeCandidate("met", "Expert kubernetes engineer with 5 years production experience, reduced costs by 30%.");
    const missed = makeCandidate("missed", "Python and Java developer, no container work.");

    const metResult = scoreCandidate(met, penaltyCriteria, emptyRecruiter, emptyOrg);
    const missedResult = scoreCandidate(missed, penaltyCriteria, emptyRecruiter, emptyOrg);

    expect(metResult.signalScore).toBeGreaterThan(missedResult.signalScore);
  });

  it("flags the missed criterion with severity=warn (not disqualify)", () => {
    const candidate = makeCandidate("miss", "Python developer.");
    const result = scoreCandidate(candidate, penaltyCriteria, emptyRecruiter, emptyOrg);
    const flags = result.managerCriteriaScores.flatMap((s) => s.flags);
    expect(flags.some((f) => f.severity === "warn")).toBe(true);
    expect(flags.every((f) => f.severity !== "disqualify")).toBe(true);
  });
});

// ─── Tier weight ordering ─────────────────────────────────────────────────────

describe("tier weight ordering in scoring", () => {
  it("meeting a medium criterion scores higher than meeting only a preferred criterion", () => {
    const criteria = makeManager([
      { id: "m1", label: "agile scrum", tier: "medium", keywords: ["agile"] },
      { id: "p1", label: "open-source contribution", tier: "preferred", keywords: ["open-source"] },
    ]);

    // Each candidate meets exactly one criterion
    const meetsMedium = makeCandidate("med", "agile practitioner certified.");
    const meetsPreferred = makeCandidate("pref", "open-source contributor on GitHub.");

    const medScore = scoreCandidate(meetsMedium, criteria, emptyRecruiter, emptyOrg);
    const prefScore = scoreCandidate(meetsPreferred, criteria, emptyRecruiter, emptyOrg);

    expect(medScore.signalScore).toBeGreaterThan(prefScore.signalScore);
  });

  it("deal-breaker (hard-gate, met) candidate outscores medium-only candidate", () => {
    const criteria = makeManager([
      {
        id: "db1",
        label: "kubernetes",
        tier: "deal_breaker",
        dealBreakerBehavior: "hard_gate",
        keywords: ["kubernetes"],
      },
      { id: "m1", label: "agile", tier: "medium", keywords: ["agile"] },
    ]);

    const meetsDB = makeCandidate("db", "kubernetes engineer.");
    const meetsMedium = makeCandidate("med", "agile practitioner.");

    const dbScore = scoreCandidate(meetsDB, criteria, emptyRecruiter, emptyOrg);
    const mScore = scoreCandidate(meetsMedium, criteria, emptyRecruiter, emptyOrg);

    // meetsMedium misses the hard_gate → disqualified; meetsDB is not
    expect(dbScore.disqualified).toBe(false);
    expect(mScore.disqualified).toBe(true);
    // Non-disqualified always ranks above disqualified
    expect(dbScore.signalScore).toBeGreaterThanOrEqual(mScore.signalScore);
  });
});

// ─── Recruiter criteria toggling ──────────────────────────────────────────────

describe("recruiter criteria", () => {
  it("skips a disabled recruiter criterion entirely", () => {
    const recruiter: RecruiterCriteria = {
      criteria: [
        {
          id: "wa1",
          label: "work authorization",
          tier: "deal_breaker",
          dealBreakerBehavior: "hard_gate",
          kind: "work_auth",
          location: "United States",
          enabled: false,
          keywords: ["visa", "sponsorship"],
        },
      ],
    };

    // Resume does NOT mention visa/sponsorship — would disqualify if enabled
    const candidate = makeCandidate("c1", "Software engineer in Seattle.");
    const result = scoreCandidate(candidate, makeManager([]), recruiter, emptyOrg);

    expect(result.disqualified).toBe(false);
    expect(result.recruiterCriteriaScores).toHaveLength(0);
  });

  it("applies an enabled recruiter criterion", () => {
    const recruiter: RecruiterCriteria = {
      criteria: [
        {
          id: "wa1",
          label: "work authorization",
          tier: "deal_breaker",
          dealBreakerBehavior: "hard_gate",
          kind: "work_auth",
          location: "United States",
          enabled: true,
          keywords: ["authorized", "citizen"],
        },
      ],
    };

    const candidate = makeCandidate("c1", "US citizen, authorized to work.");
    const result = scoreCandidate(candidate, makeManager([]), recruiter, emptyOrg);

    expect(result.recruiterCriteriaScores).toHaveLength(1);
    expect(result.recruiterCriteriaScores[0].result).toBe("met");
    expect(result.disqualified).toBe(false);
  });
});

// ─── Org criteria ─────────────────────────────────────────────────────────────

describe("org criteria", () => {
  it("always enforces a globally-applied org criterion even when enabled=false", () => {
    const org: OrgCriteria = {
      organizationId: "acme",
      criteria: [
        {
          id: "o1",
          label: "background check eligible",
          tier: "deal_breaker",
          dealBreakerBehavior: "hard_gate",
          kind: "compliance",
          enabled: false,        // explicitly false
          appliesGlobally: true, // but globally enforced
          ownedBy: "Legal",
          keywords: ["background check"],
        },
      ],
    };

    const candidate = makeCandidate("c1", "Software engineer with no mention of checks.");
    const result = scoreCandidate(candidate, makeManager([]), emptyRecruiter, org);

    // Globally-applied criterion is enforced → hard-gate missed → disqualified
    expect(result.disqualified).toBe(true);
    expect(result.orgCriteriaScores).toHaveLength(1);
  });

  it("skips a non-global, disabled org criterion", () => {
    const org: OrgCriteria = {
      organizationId: "acme",
      criteria: [
        {
          id: "o1",
          label: "security clearance",
          tier: "deal_breaker",
          dealBreakerBehavior: "hard_gate",
          kind: "policy",
          enabled: false,
          appliesGlobally: false,
          ownedBy: "Security",
          keywords: ["clearance"],
        },
      ],
    };

    const candidate = makeCandidate("c1", "Software engineer.");
    const result = scoreCandidate(candidate, makeManager([]), emptyRecruiter, org);

    expect(result.disqualified).toBe(false);
    expect(result.orgCriteriaScores).toHaveLength(0);
  });
});

// ─── Ranking ──────────────────────────────────────────────────────────────────

describe("rankCandidates", () => {
  const criteria = makeManager([
    {
      id: "db1",
      label: "kubernetes",
      tier: "deal_breaker",
      dealBreakerBehavior: "hard_gate",
      keywords: ["kubernetes"],
    },
  ]);

  it("places non-disqualified candidates above disqualified ones regardless of score", () => {
    const qualified = makeCandidate(
      "q1",
      "kubernetes engineer"
    );
    // High evidence density but no kubernetes → disqualified
    const disqualifiedHighScore = makeCandidate(
      "dq1",
      "Senior engineer: increased revenue by $10M, grew team 3x, reduced latency by 40%, saved $2M annually."
    );

    const ranked = rankCandidates(
      [disqualifiedHighScore, qualified],
      criteria,
      emptyRecruiter,
      emptyOrg
    );

    const qRank = ranked.find((r) => r.candidate.id === "q1")!.rank;
    const dqRank = ranked.find((r) => r.candidate.id === "dq1")!.rank;

    expect(qRank).toBeLessThan(dqRank);
  });

  it("ranks higher-scoring non-disqualified candidates first", () => {
    const highScore = makeCandidate(
      "high",
      "kubernetes expert: reduced costs by 40%, improved throughput by 3x, saved $1M, led 10-person team."
    );
    const lowScore = makeCandidate("low", "kubernetes beginner.");

    const ranked = rankCandidates(
      [lowScore, highScore],
      criteria,
      emptyRecruiter,
      emptyOrg
    );

    expect(ranked[0].candidate.id).toBe("high");
    expect(ranked[1].candidate.id).toBe("low");
  });

  it("assigns rank 1 to the top candidate", () => {
    const a = makeCandidate("a", "kubernetes engineer with 10 years experience, grew revenue 50%.");
    const b = makeCandidate("b", "junior kubernetes user.");

    const ranked = rankCandidates([b, a], criteria, emptyRecruiter, emptyOrg);
    expect(ranked.find((r) => r.candidate.id === "a")!.rank).toBe(1);
  });
});

// ─── Evidence density ─────────────────────────────────────────────────────────

describe("scoreEvidenceDensity", () => {
  it("returns 0 for empty text", () => {
    expect(scoreEvidenceDensity("")).toBe(0);
  });

  it("returns higher score for quantified text", () => {
    const generic = "Experienced software engineer with strong communication skills.";
    const quantified =
      "Increased revenue by 30%, saved $2M annually, grew team from 5 to 20 engineers, reduced latency by 40%.";
    expect(scoreEvidenceDensity(quantified)).toBeGreaterThan(
      scoreEvidenceDensity(generic)
    );
  });

  it("caps at 1.0", () => {
    const dense = Array(30)
      .fill("increased revenue by 20% saved $1M reduced costs by 30%")
      .join(" ");
    expect(scoreEvidenceDensity(dense)).toBeLessThanOrEqual(1.0);
  });
});

// ─── Consistency ──────────────────────────────────────────────────────────────

describe("scoreConsistency", () => {
  it("returns 0.7 (benefit of the doubt) when no dates are found", () => {
    expect(scoreConsistency("No dates in this resume at all.")).toBe(0.7);
  });

  it("penalizes overlapping date ranges", () => {
    const clean = "Software Engineer 2018 – 2020, Product Manager 2020 – 2023.";
    const overlapping = "Software Engineer 2018 – 2022, Product Manager 2019 – 2023.";
    expect(scoreConsistency(clean)).toBeGreaterThan(scoreConsistency(overlapping));
  });
});

// ─── AI likelihood ────────────────────────────────────────────────────────────

describe("scoreAILikelihood", () => {
  it("returns score and confidence both in [0, 1]", () => {
    const { score, confidence } = scoreAILikelihood("Some resume text.");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it("scores template-heavy text higher than evidence-rich text", () => {
    const template =
      "Results-driven team player with strong communication skills and proven track record. " +
      "Detail-oriented self-starter passionate about leverage and synergy. " +
      "Highly motivated dynamic professional seeking a challenging role.";
    const concrete =
      "Led migration of 3 microservices to Kubernetes, reducing deployment time by 60% and saving $400k/year. " +
      "Grew engineering team from 4 to 12, shipped 8 features in Q3 with zero P1 incidents.";

    expect(scoreAILikelihood(template).score).toBeGreaterThan(
      scoreAILikelihood(concrete).score
    );
  });
});
