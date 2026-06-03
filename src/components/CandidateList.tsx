import type { CriterionResult, ManagerCriteria, RankedCandidate, RecruiterCriteria } from "../engine/types";
import type { OverridesMap } from "../uitypes";
import CandidateBreakdown from "./CandidateBreakdown";

interface Props {
  ranked: RankedCandidate[];
  managerCriteria: ManagerCriteria;
  recruiterCriteria: RecruiterCriteria;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  overrides: OverridesMap;
  onOverride: (candidateId: string, criterionId: string, result: CriterionResult, note: string) => void;
  onResetOverride: (candidateId: string, criterionId: string) => void;
  onDismissFlag: (candidateId: string, flagCode: string) => void;
  onRestoreFlag: (candidateId: string, flagCode: string) => void;
  onManualScore: (candidateId: string, score: number | undefined) => void;
  onRemove: (candidateId: string) => void;
}

function scoreBarColor(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-400";
  return "bg-red-400";
}

function ScoreBar({ score, disqualified }: { score: number; disqualified: boolean }) {
  if (disqualified) return <div className="h-1.5 w-full rounded-full bg-red-100" />;
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${scoreBarColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function quickFlags(r: RankedCandidate): string[] {
  const flags: string[] = [];
  const allFlags = [
    ...r.breakdown.managerCriteriaScores,
    ...r.breakdown.recruiterCriteriaScores,
  ].flatMap(s => s.flags);
  if (allFlags.some(f => f.severity === "disqualify")) flags.push("hard gate");
  const penalties = allFlags.filter(f => f.code === "STRONG_PENALTY_MISSED").length;
  if (penalties > 0) flags.push(`${penalties} deal-breaker${penalties > 1 ? "s" : ""} missed`);
  if (r.breakdown.qualitySignals.aiLikelihoodScore > 0.5) {
    flags.push(`AI signal ${(r.breakdown.qualitySignals.aiLikelihoodScore * 100).toFixed(0)}%`);
  }
  if (r.breakdown.qualitySignals.consistencyScore < 0.7) flags.push("date inconsistency");
  return flags;
}

export default function CandidateList({
  ranked,
  managerCriteria,
  recruiterCriteria,
  expandedId,
  onToggleExpand,
  overrides,
  onOverride,
  onResetOverride,
  onDismissFlag,
  onRestoreFlag,
  onManualScore,
  onRemove,
}: Props) {
  return (
    <div>
      {/* Column header */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-5 py-2 grid grid-cols-[2rem_5rem_1fr_8rem_14rem_2rem] gap-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <span>#</span>
        <span>Score</span>
        <span>Candidate</span>
        <span>Status</span>
        <span>Quick signals</span>
        <span />
      </div>

      {ranked.map(r => {
        const isExpanded = expandedId === r.candidate.id;
        const candidateOverrides = overrides[r.candidate.id];
        const hasOverrides = Object.keys(candidateOverrides?.criteria ?? {}).length > 0;
        const displayScore = candidateOverrides?.manualScore ?? r.breakdown.signalScore;
        const flags = quickFlags(r);

        return (
          <div key={r.candidate.id} className="border-b border-gray-200">
            {/* Candidate row */}
            <div className={`group flex items-stretch border-l-2 transition-colors ${
              isExpanded
                ? "bg-blue-50 border-l-blue-500"
                : "hover:bg-gray-50 border-l-transparent"
            }`}>
            <button
              onClick={() => onToggleExpand(r.candidate.id)}
              className="flex-1 text-left px-5 py-3.5 grid grid-cols-[2rem_5rem_1fr_8rem_14rem] gap-3 items-center"
            >
              {/* Rank */}
              <span className="text-sm font-semibold text-gray-400">#{r.rank}</span>

              {/* Score + bar */}
              <div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  {r.breakdown.disqualified ? (
                    <span className="text-sm font-bold text-red-600">DQ</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-900">{displayScore}</span>
                  )}
                  {hasOverrides && !r.breakdown.disqualified && (
                    <span className="text-xs text-purple-600" title="Contains manual overrides">⊙</span>
                  )}
                  {!r.breakdown.disqualified && (
                    <span className="text-xs text-gray-400">/ 100</span>
                  )}
                </div>
                <ScoreBar score={displayScore} disqualified={r.breakdown.disqualified} />
              </div>

              {/* Name */}
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.candidate.name}</p>
                <p className="text-xs text-gray-400">
                  {r.candidate.source === "sharepoint" ? "SharePoint" : r.candidate.source}
                  {r.candidate.sourceUrl && (
                    <span className="ml-1 text-blue-400" title={r.candidate.sourceUrl}>· linked</span>
                  )}
                </p>
              </div>

              {/* Status */}
              {r.breakdown.disqualified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5">
                  ✗ Disqualified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5">
                  ✓ Active
                </span>
              )}

              {/* Quick signals */}
              <div className="flex flex-wrap gap-1">
                {flags.map(f => (
                  <span
                    key={f}
                    className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    ⚑ {f}
                  </span>
                ))}
                {flags.length === 0 && (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>
            </button>

            {/* Remove button */}
            <button
              onClick={e => { e.stopPropagation(); onRemove(r.candidate.id); }}
              className="px-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              title="Remove candidate"
            >
              ✕
            </button>
            </div>

            {/* Breakdown panel */}
            {isExpanded && (
              <div className="border-t border-blue-100 bg-white">
                <CandidateBreakdown
                  ranked={r}
                  managerCriteria={managerCriteria}
                  recruiterCriteria={recruiterCriteria}
                  overrides={candidateOverrides}
                  onOverride={(cId, result, note) => onOverride(r.candidate.id, cId, result, note)}
                  onResetOverride={cId => onResetOverride(r.candidate.id, cId)}
                  onDismissFlag={code => onDismissFlag(r.candidate.id, code)}
                  onRestoreFlag={code => onRestoreFlag(r.candidate.id, code)}
                  onManualScore={score => onManualScore(r.candidate.id, score)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
