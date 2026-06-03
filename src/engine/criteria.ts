/**
 * Applies hiring-manager, recruiter, and org criteria to a resume text.
 * Pure functions only — no React, no side-effects.
 *
 * rawScore semantics (unweighted result quality):
 *   met             →  1.0
 *   partial         →  0.5
 *   unknown         →  0.3
 *   missed (normal) →  0.0
 *   missed (strong_penalty deal-breaker) → -STRONG_PENALTY_MULTIPLIER (-2.0)
 *   missed (hard_gate deal-breaker)      →  0.0  (disqualification flag set separately)
 */

import type {
  Criterion,
  CriterionResult,
  CriterionScore,
  Flag,
  ManagerCriteria,
  OrgCriteria,
  RecruiterCriteria,
  Tier,
} from "./types";

// Missed deal-breaker contributes −0.5× its weight — meaningfully negative
// but not catastrophic. Candidate stays ranked; recruiter sees the flag.
export const STRONG_PENALTY_MULTIPLIER = 0.5;

export const TIER_DEFAULT_WEIGHTS: Record<Tier, number> = {
  deal_breaker: 1.0,
  medium: 0.5,
  preferred: 0.2,
};

/** Effective raw weight for a criterion (custom or tier default). */
export function effectiveWeight(criterion: Criterion): number {
  return criterion.weight ?? TIER_DEFAULT_WEIGHTS[criterion.tier];
}

// ─── Keyword extraction & matching ────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","of","in","at","for","with","and","or","to","is","are",
  "has","have","on","by","from","as","be","been","were","was","its","this",
  "that","their","than","more","least","years","year","experience",
]);

function extractKeywords(criterion: Criterion): string[] {
  if (criterion.keywords && criterion.keywords.length > 0) {
    return criterion.keywords.map((k) => k.toLowerCase());
  }
  return criterion.label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function matchKeywords(
  keywords: string[],
  text: string
): { result: CriterionResult; evidence: string[] } {
  if (keywords.length === 0) return { result: "unknown", evidence: [] };

  const lower = text.toLowerCase();
  const evidence: string[] = [];
  let matched = 0;

  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      matched++;
      const start = Math.max(0, idx - 60);
      const end = Math.min(text.length, idx + kw.length + 60);
      evidence.push("..." + text.slice(start, end).trim() + "...");
    }
  }

  const ratio = matched / keywords.length;
  const result: CriterionResult =
    ratio >= 0.8 ? "met" : ratio >= 0.3 ? "partial" : "missed";

  return { result, evidence: evidence.slice(0, 3) };
}

// ─── Core application ─────────────────────────────────────────────────────────

/** Apply a single criterion to resume text and return a scored result. */
export function applyCriterion(
  criterion: Criterion,
  resumeText: string
): CriterionScore {
  const keywords = extractKeywords(criterion);
  const { result, evidence } = matchKeywords(keywords, resumeText);
  const flags: Flag[] = [];
  let rawScore = 0.0;

  switch (result) {
    case "met":
      rawScore = 1.0;
      break;
    case "partial":
      rawScore = 0.5;
      break;
    case "unknown":
      rawScore = 0.3;
      break;
    case "missed":
      if (criterion.tier === "deal_breaker") {
        const behavior = criterion.dealBreakerBehavior ?? "strong_penalty";
        if (behavior === "hard_gate") {
          rawScore = 0.0;
          flags.push({
            code: "HARD_GATE_MISSED",
            severity: "disqualify",
            reason: `Hard-gate deal-breaker "${criterion.label}" not found — candidate disqualified.`,
          });
        } else {
          rawScore = -STRONG_PENALTY_MULTIPLIER;
          flags.push({
            code: "STRONG_PENALTY_MISSED",
            severity: "warn",
            reason: `Deal-breaker "${criterion.label}" not found — strong penalty applied.`,
          });
        }
      } else {
        rawScore = 0.0;
      }
      break;
  }

  return {
    criterionId: criterion.id,
    result,
    rawScore,
    evidence,
    flags,
    overridden: false,
  };
}

// ─── Layer application ────────────────────────────────────────────────────────

export function applyManagerCriteria(
  managerCriteria: ManagerCriteria,
  resumeText: string
): CriterionScore[] {
  return managerCriteria.criteria.map((c) => applyCriterion(c, resumeText));
}

export function applyRecruiterCriteria(
  recruiterCriteria: RecruiterCriteria,
  resumeText: string
): CriterionScore[] {
  return recruiterCriteria.criteria
    .filter((c) => c.enabled)
    .map((c) => applyCriterion(c, resumeText));
}

export function applyOrgCriteria(
  orgCriteria: OrgCriteria,
  resumeText: string
): CriterionScore[] {
  return orgCriteria.criteria
    .filter((c) => c.appliesGlobally || c.enabled)
    .map((c) => applyCriterion(c, resumeText));
}
