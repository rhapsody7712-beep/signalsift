// ─── Tiers ────────────────────────────────────────────────────────────────────

export type Tier = "deal_breaker" | "medium" | "preferred";

// ─── Criterion ────────────────────────────────────────────────────────────────

export type DealBreakerBehavior = "hard_gate" | "strong_penalty";

export type CriterionResult = "met" | "partial" | "missed" | "unknown";

export interface Criterion {
  id: string;
  label: string;
  tier: Tier;
  weight?: number;                    // raw value; optional — engine defaults by tier
  dealBreakerBehavior?: DealBreakerBehavior; // only relevant when tier === "deal_breaker"
  description?: string;
  keywords?: string[];                // hint keywords for text matching
}

// ─── Manager criteria ──────────────────────────────────────────────────────────
// 5–7 criteria: 3–4 deal-breakers, ~2 medium, 1–2 preferred

export interface ManagerCriteria {
  roleId: string;
  criteria: Criterion[];
}

// ─── Recruiter criteria ────────────────────────────────────────────────────────
// Each type is explicitly togglable. Engine skips disabled criteria and
// excludes their weight from the normalization pool.

export interface WorkAuthCriterion extends Criterion {
  kind: "work_auth";
  location: string;    // "eligible to work in [location] without sponsorship"
  enabled: boolean;
}

export interface LocationCriterion extends Criterion {
  kind: "location";
  targetRegion: string; // e.g. "Seattle metro" or "Remote – US"
  enabled: boolean;
}

export interface CustomRecruiterCriterion extends Criterion {
  kind: "custom";
  enabled: boolean;
}

export type RecruiterCriterionType =
  | WorkAuthCriterion
  | LocationCriterion
  | CustomRecruiterCriterion;

export interface RecruiterCriteria {
  criteria: RecruiterCriterionType[];
}

// ─── Org / company criteria ────────────────────────────────────────────────────
// Company-wide standards (compliance, policy, etc.). Globally-applied criteria
// cannot be disabled by manager or recruiter.

export type OrgCriterionKind = "policy" | "compliance" | "standard" | "custom";

export interface OrgCriterion extends Criterion {
  kind: OrgCriterionKind;
  enabled: boolean;
  appliesGlobally: boolean; // true → always enforced; manager cannot disable
  ownedBy: string;          // e.g. "Legal", "HR" — audit trail
}

export interface OrgCriteria {
  organizationId: string;
  criteria: OrgCriterion[];
}

// ─── Candidate ────────────────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  name: string;
  resumeText: string;  // raw .txt / pasted content only (Phase 0)
  source: "uploaded" | "pasted" | "sample" | "sharepoint";
  sourceUrl?: string;  // SharePoint or other URL (content still pasted manually in Phase 0)
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface Flag {
  code: string;
  severity: "info" | "warn" | "disqualify";
  reason: string;
  confidence?: number; // 0–1; required for probabilistic flags (e.g. AI likelihood)
}

export interface CriterionScore {
  criterionId: string;
  result: CriterionResult;
  // Unweighted result quality in [-2, 1].
  // met=1.0  partial=0.5  unknown=0.3  missed=0.0  strong_penalty_miss=-2.0
  rawScore: number;
  evidence: string[];  // snippets from resume text supporting the result
  flags: Flag[];
  overridden: boolean;
  overrideNote?: string;
}

export interface QualitySignals {
  evidenceDensityScore: number;    // 0–1
  consistencyScore: number;        // 0–1
  aiLikelihoodScore: number;       // 0–1; probabilistic — never auto-disqualifies
  aiLikelihoodConfidence: number;  // 0–1; how confident the estimate is
}

export interface ScoreBreakdown {
  candidateId: string;
  managerCriteriaScores: CriterionScore[];
  recruiterCriteriaScores: CriterionScore[];
  orgCriteriaScores: CriterionScore[];
  qualitySignals: QualitySignals;
  signalScore: number;         // 0–100 composite
  disqualified: boolean;       // true only when a hard_gate deal-breaker is missed
  disqualifyReasons: string[];
  overallOverridden: boolean;
  overallOverrideNote?: string;
}

export interface RankedCandidate {
  candidate: Candidate;
  breakdown: ScoreBreakdown;
  rank: number;
}
