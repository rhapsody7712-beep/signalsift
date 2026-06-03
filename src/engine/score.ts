/**
 * Composite scoring and ranking.
 * Pure functions only — no React, no side-effects.
 *
 * Score formula:
 *   criteriaScore  = Σ (normalizedWeight_i × rawScore_i)   ∈ [-0.5, 1]
 *   qualityScore   = f(evidenceDensity, consistency, aiLikelihood) ∈ [0, 1]
 *   raw            = criteriaScore × 0.85 + qualityScore × 0.15
 *   signalScore    = round(clamp(raw, 0, 1) × 100)         ∈ [0, 100]
 *
 * Weights are raw values normalized across all ACTIVE criteria from all three
 * layers (org + manager + recruiter). Disabled recruiter criteria and
 * non-globally-applied, disabled org criteria are excluded from the pool.
 */

import type {
  Candidate,
  Criterion,
  CriterionScore,
  ManagerCriteria,
  OrgCriteria,
  QualitySignals,
  RankedCandidate,
  RecruiterCriteria,
  ScoreBreakdown,
} from "./types";
import {
  applyManagerCriteria,
  applyOrgCriteria,
  applyRecruiterCriteria,
  effectiveWeight,
} from "./criteria";
import {
  scoreAILikelihood,
  scoreConsistency,
  scoreEvidenceDensity,
} from "./evidence";

// ─── Weight normalization ─────────────────────────────────────────────────────

/**
 * Returns a map of criterion id → normalized weight (sums to 1.0 across
 * the provided criteria list).
 */
export function normalizeWeights(criteria: Criterion[]): Map<string, number> {
  const total = criteria.reduce((s, c) => s + effectiveWeight(c), 0);
  return new Map(
    criteria.map((c) => [c.id, total > 0 ? effectiveWeight(c) / total : 0])
  );
}

// ─── Criteria score ───────────────────────────────────────────────────────────

function computeCriteriaScore(
  scores: CriterionScore[],
  criteria: Criterion[]
): number {
  if (criteria.length === 0) return 0;

  const weights = normalizeWeights(criteria);
  const criterionMap = new Map(criteria.map((c) => [c.id, c]));

  return scores.reduce((sum, score) => {
    const criterion = criterionMap.get(score.criterionId);
    if (!criterion) return sum;
    const nw = weights.get(criterion.id) ?? 0;
    return sum + nw * score.rawScore;
  }, 0);
}

// ─── Quality score ────────────────────────────────────────────────────────────

function computeQualityScore(q: QualitySignals): number {
  const base = q.evidenceDensityScore * 0.5 + q.consistencyScore * 0.5;
  // AI likelihood is a probabilistic signal shown for human review — small penalty only.
  const aiPenalty = q.aiLikelihoodScore * q.aiLikelihoodConfidence * 0.1;
  return Math.max(0, Math.min(1, base - aiPenalty));
}

// ─── Single-candidate scoring ─────────────────────────────────────────────────

export function scoreCandidate(
  candidate: Candidate,
  managerCriteria: ManagerCriteria,
  recruiterCriteria: RecruiterCriteria,
  orgCriteria: OrgCriteria
): ScoreBreakdown {
  const text = candidate.resumeText;

  // Apply all three layers
  const managerScores = applyManagerCriteria(managerCriteria, text);
  const recruiterScores = applyRecruiterCriteria(recruiterCriteria, text);
  const orgScores = applyOrgCriteria(orgCriteria, text);

  // Active criteria from each layer (for weight normalization)
  const activeCriteria: Criterion[] = [
    ...managerCriteria.criteria,
    ...recruiterCriteria.criteria.filter((c) => c.enabled),
    ...orgCriteria.criteria.filter((c) => c.appliesGlobally || c.enabled),
  ];

  const allScores = [...managerScores, ...recruiterScores, ...orgScores];

  // Quality signals
  const aiResult = scoreAILikelihood(text);
  const qualitySignals: QualitySignals = {
    evidenceDensityScore: scoreEvidenceDensity(text),
    consistencyScore: scoreConsistency(text),
    aiLikelihoodScore: aiResult.score,
    aiLikelihoodConfidence: aiResult.confidence,
  };

  // Disqualification: any hard-gate flag across all layers
  const disqualifyFlags = allScores
    .flatMap((s) => s.flags)
    .filter((f) => f.severity === "disqualify");

  const disqualified = disqualifyFlags.length > 0;
  const disqualifyReasons = disqualifyFlags.map((f) => f.reason);

  // Composite score
  const criteriaScore = computeCriteriaScore(allScores, activeCriteria);
  const qualityScore = computeQualityScore(qualitySignals);

  const raw = criteriaScore * 0.85 + qualityScore * 0.15;
  const signalScore = Math.round(Math.max(0, Math.min(1, raw)) * 100);

  return {
    candidateId: candidate.id,
    managerCriteriaScores: managerScores,
    recruiterCriteriaScores: recruiterScores,
    orgCriteriaScores: orgScores,
    qualitySignals,
    signalScore,
    disqualified,
    disqualifyReasons,
    overallOverridden: false,
  };
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

/**
 * Score and rank all candidates.
 *
 * Ranking rules:
 *   1. Non-disqualified candidates always rank above disqualified ones.
 *   2. Within each group, higher signalScore ranks first.
 *   3. Disqualified candidates are still included (never silently removed).
 */
export function rankCandidates(
  candidates: Candidate[],
  managerCriteria: ManagerCriteria,
  recruiterCriteria: RecruiterCriteria,
  orgCriteria: OrgCriteria
): RankedCandidate[] {
  const breakdowns = candidates.map((c) =>
    scoreCandidate(c, managerCriteria, recruiterCriteria, orgCriteria)
  );

  const candidateMap = new Map(candidates.map((c) => [c.id, c]));

  const sorted = [...breakdowns].sort((a, b) => {
    if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
    return b.signalScore - a.signalScore;
  });

  return sorted.map((breakdown, i) => ({
    candidate: candidateMap.get(breakdown.candidateId)!,
    breakdown,
    rank: i + 1,
  }));
}
