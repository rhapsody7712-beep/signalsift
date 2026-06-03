/**
 * SignalSift Phase 0 demo runner.
 * Runs the scoring engine over the 5 sample candidates and prints a ranked breakdown.
 *
 * Usage:  npm run demo
 */

import { rankCandidates } from "../src/engine/score";
import type { CriterionScore, RankedCandidate } from "../src/engine/types";
import {
  SAMPLE_CANDIDATES,
  SAMPLE_MANAGER_CRITERIA,
  SAMPLE_ORG_CRITERIA,
  SAMPLE_RECRUITER_CRITERIA,
} from "../src/data/samples";

// ─── Formatting helpers ───────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD  = "\x1b[1m";
const DIM   = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED   = "\x1b[31m";
const YELLOW= "\x1b[33m";
const CYAN  = "\x1b[36m";

function bold(s: string)   { return `${BOLD}${s}${RESET}`; }
function green(s: string)  { return `${GREEN}${s}${RESET}`; }
function red(s: string)    { return `${RED}${s}${RESET}`; }
function yellow(s: string) { return `${YELLOW}${s}${RESET}`; }
function cyan(s: string)   { return `${CYAN}${s}${RESET}`; }
function dim(s: string)    { return `${DIM}${s}${RESET}`; }

function bar(value: number, width = 16): string {
  const filled = Math.round(value * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function resultSymbol(result: CriterionScore["result"]): string {
  switch (result) {
    case "met":     return green("✓ MET    ");
    case "partial": return yellow("~ PARTIAL");
    case "missed":  return red("✗ MISSED ");
    case "unknown": return dim("? UNKNOWN");
  }
}

function tierLabel(score: CriterionScore, allCriteria: typeof SAMPLE_MANAGER_CRITERIA.criteria): string {
  const criterion = allCriteria.find(c => c.id === score.criterionId);
  if (!criterion) return "";
  if (criterion.tier === "deal_breaker") {
    const bhv = criterion.dealBreakerBehavior ?? "strong_penalty";
    return bhv === "hard_gate"
      ? red("[DEAL-BREAKER / hard_gate]     ")
      : yellow("[DEAL-BREAKER / strong_penalty]");
  }
  if (criterion.tier === "medium")    return cyan("[medium]                       ");
  return dim("[preferred]                    ");
}

function line(char = "─", width = 72): string {
  return char.repeat(width);
}

// ─── Print summary table ──────────────────────────────────────────────────────

function printSummary(ranked: RankedCandidate[]) {
  console.log();
  console.log(bold("RANKED RESULTS"));
  console.log(line());
  console.log(
    bold(" Rank  Score  Status           Candidate")
  );
  console.log(line());

  const profiles: Record<string, string> = {
    "alice-chen":      "Evidence-heavy",
    "brandon-kim":     "AI / template",
    "carlos-m":        "Vague / thin",
    "diana-warren":    "Consistency issue (overlapping dates)",
    "ethan-rodriguez": "Strong — fails hard-gate deal-breaker",
  };

  for (const r of ranked) {
    const rank  = String(r.rank).padStart(2);
    const score = r.breakdown.disqualified
      ? red(" DQ ")
      : String(r.breakdown.signalScore).padStart(3) + " ";
    const status = r.breakdown.disqualified
      ? red("DISQUALIFIED     ")
      : green("Active           ");
    const name    = r.candidate.name.padEnd(20);
    const profile = dim(profiles[r.candidate.id] ?? "");
    console.log(` ${rank}   ${score}  ${status} ${bold(name)}  ${profile}`);
  }
  console.log(line());
}

// ─── Print one candidate's full breakdown ─────────────────────────────────────

function printBreakdown(r: RankedCandidate) {
  const { candidate, breakdown, rank } = r;
  const scoreStr = breakdown.disqualified
    ? red("DISQUALIFIED")
    : bold(`${breakdown.signalScore} / 100`);

  console.log();
  console.log(line("━"));
  console.log(
    bold(`  #${rank}  ${candidate.name}`) +
    `  ·  Signal Score: ${scoreStr}`
  );
  console.log(line("━"));

  // Manager criteria
  console.log();
  console.log(bold("  Manager criteria"));
  console.log("  " + line("─", 68));

  const allManagerCriteria = SAMPLE_MANAGER_CRITERIA.criteria;
  for (const s of breakdown.managerCriteriaScores) {
    const criterion = allManagerCriteria.find(c => c.id === s.criterionId)!;
    const sym   = resultSymbol(s.result);
    const tier  = tierLabel(s, allManagerCriteria);
    const label = criterion.label;
    console.log(`  ${sym}  ${tier}  ${label}`);

    // Evidence snippet (first one if available)
    if (s.evidence.length > 0 && (s.result === "met" || s.result === "partial")) {
      console.log(dim(`             Evidence: ${s.evidence[0].slice(0, 90)}`));
    }
    // Flags
    for (const flag of s.flags) {
      const flagColor = flag.severity === "disqualify" ? red : yellow;
      console.log(flagColor(`             ⚑ ${flag.code}: ${flag.reason}`));
    }
  }

  // Recruiter criteria
  if (breakdown.recruiterCriteriaScores.length > 0) {
    console.log();
    console.log(bold("  Recruiter criteria"));
    console.log("  " + line("─", 68));

    const allRecruiterCriteria = SAMPLE_RECRUITER_CRITERIA.criteria;
    for (const s of breakdown.recruiterCriteriaScores) {
      const criterion = allRecruiterCriteria.find(c => c.id === s.criterionId)!;
      const sym   = resultSymbol(s.result);
      const tLabel = criterion.tier === "medium"
        ? cyan("[medium]   ")
        : dim("[preferred]");
      console.log(`  ${sym}  ${tLabel}  ${criterion.label}`);
      if (s.evidence.length > 0 && s.result === "met") {
        console.log(dim(`             Evidence: ${s.evidence[0].slice(0, 90)}`));
      }
      for (const flag of s.flags) {
        console.log(yellow(`             ⚑ ${flag.code}: ${flag.reason}`));
      }
    }
  }

  // Quality signals
  const q = breakdown.qualitySignals;
  console.log();
  console.log(bold("  Quality signals"));
  console.log("  " + line("─", 68));
  console.log(
    `  Evidence density  ${q.evidenceDensityScore.toFixed(2)}  ${bar(q.evidenceDensityScore)}` +
    dim("  (higher = more quantified accomplishments)")
  );
  console.log(
    `  Consistency       ${q.consistencyScore.toFixed(2)}  ${bar(q.consistencyScore)}` +
    dim("  (lower = date/tenure issues detected)")
  );
  const aiColor = q.aiLikelihoodScore > 0.5 ? yellow : (q.aiLikelihoodScore > 0.25 ? dim : dim);
  console.log(
    `  AI likelihood     ${aiColor(q.aiLikelihoodScore.toFixed(2))}  ${bar(q.aiLikelihoodScore)}` +
    `  confidence: ${q.aiLikelihoodConfidence.toFixed(2)}` +
    red("  ← SIGNAL ONLY — never auto-rejects")
  );

  // Disqualify reasons
  if (breakdown.disqualified) {
    console.log();
    console.log(red("  DISQUALIFIED"));
    for (const reason of breakdown.disqualifyReasons) {
      console.log(red(`    • ${reason}`));
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ranked = rankCandidates(
  SAMPLE_CANDIDATES,
  SAMPLE_MANAGER_CRITERIA,
  SAMPLE_RECRUITER_CRITERIA,
  SAMPLE_ORG_CRITERIA
);

console.log();
console.log(line("═"));
console.log(bold("  SignalSift Demo — Senior Platform / SRE Engineer"));
console.log(line("═"));

printSummary(ranked);

for (const r of ranked) {
  printBreakdown(r);
}

console.log();
console.log(line("═"));
console.log(dim("  All scores are explainable. Every number traces to a criterion and evidence."));
console.log(dim("  Human override is available on every flag and criterion result."));
console.log(line("═"));
console.log();
