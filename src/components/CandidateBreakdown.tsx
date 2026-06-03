import { useState } from "react";
import type { CriterionResult, CriterionScore, Flag, ManagerCriteria, RankedCandidate, RecruiterCriteria } from "../engine/types";
import type { CandidateOverrides } from "../uitypes";

interface Props {
  ranked: RankedCandidate;
  managerCriteria: ManagerCriteria;
  recruiterCriteria: RecruiterCriteria;
  overrides: CandidateOverrides | undefined;
  onOverride: (criterionId: string, result: CriterionResult, note: string) => void;
  onResetOverride: (criterionId: string) => void;
  onDismissFlag: (code: string) => void;
  onRestoreFlag: (code: string) => void;
  onManualScore: (score: number | undefined) => void;
}

const RESULT_STYLES: Record<CriterionResult, string> = {
  met: "bg-green-50 text-green-700 border-green-200",
  partial: "bg-yellow-50 text-yellow-700 border-yellow-200",
  missed: "bg-red-50 text-red-700 border-red-200",
  unknown: "bg-gray-50 text-gray-500 border-gray-200",
};

const RESULT_LABELS: Record<CriterionResult, string> = {
  met: "Met",
  partial: "Partial",
  missed: "Missed",
  unknown: "Unknown",
};

const TIER_CHIP: Record<string, string> = {
  deal_breaker: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  preferred: "bg-gray-50 text-gray-500 border-gray-200",
};

const TIER_LABELS: Record<string, string> = {
  deal_breaker: "Deal-breaker",
  medium: "Medium",
  preferred: "Preferred",
};

function DensityBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-700">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

function OverrideForm({
  currentResult,
  onSave,
  onCancel,
}: {
  currentResult: CriterionResult;
  onSave: (result: CriterionResult, note: string) => void;
  onCancel: () => void;
}) {
  const [result, setResult] = useState<CriterionResult>(currentResult);
  const [note, setNote] = useState("");

  return (
    <div className="mt-2 p-2.5 bg-purple-50 border border-purple-200 rounded space-y-2">
      <p className="text-xs font-semibold text-purple-700">Override result</p>
      <div className="flex gap-1.5 flex-wrap">
        {(["met", "partial", "missed", "unknown"] as CriterionResult[]).map(r => (
          <button
            key={r}
            onClick={() => setResult(r)}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
              result === r
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
            }`}
          >
            {RESULT_LABELS[r]}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Reason for override (required)…"
        rows={2}
        className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => note.trim() && onSave(result, note.trim())}
          disabled={!note.trim()}
          className="text-xs px-2.5 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save override
        </button>
        <button
          onClick={onCancel}
          className="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CriterionRow({
  score,
  tier,
  label,
  behavior,
  overrideResult,
  overrideNote,
  dismissedFlags,
  onOverride,
  onResetOverride,
  onDismissFlag,
  onRestoreFlag,
}: {
  score: CriterionScore;
  tier: string;
  label: string;
  behavior?: string;
  overrideResult?: CriterionResult;
  overrideNote?: string;
  dismissedFlags: string[];
  onOverride: (result: CriterionResult, note: string) => void;
  onResetOverride: () => void;
  onDismissFlag: (code: string) => void;
  onRestoreFlag: (code: string) => void;
}) {
  const [showOverride, setShowOverride] = useState(false);
  const displayResult = overrideResult ?? score.result;
  const isOverridden = !!overrideResult;

  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border ${TIER_CHIP[tier]}`}>
              {TIER_LABELS[tier]}
            </span>
            {tier === "deal_breaker" && behavior && (
              <span className="text-xs text-gray-400">· {behavior === "hard_gate" ? "hard gate" : "strong penalty"}</span>
            )}
            {isOverridden && (
              <span className="text-xs px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
                ⊙ overridden
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${RESULT_STYLES[displayResult]}`}>
            {RESULT_LABELS[displayResult]}
          </span>
          {!showOverride && (
            <button
              onClick={() => setShowOverride(true)}
              className="text-xs text-gray-400 hover:text-purple-600 px-1"
              title="Override this result"
            >
              ✎
            </button>
          )}
          {isOverridden && (
            <button
              onClick={onResetOverride}
              className="text-xs text-gray-400 hover:text-red-500 px-1"
              title="Reset to engine result"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {overrideNote && (
        <p className="mt-1 text-xs text-purple-600 italic">Override note: {overrideNote}</p>
      )}

      {/* Evidence */}
      {score.evidence.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {score.evidence.map((e, i) => (
            <p key={i} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 border-l-2 border-gray-200">
              {e}
            </p>
          ))}
        </div>
      )}

      {/* Flags */}
      {score.flags.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {score.flags.map((flag: Flag) => {
            const isDismissed = dismissedFlags.includes(flag.code);
            return (
              <div
                key={flag.code}
                className={`flex items-start justify-between gap-2 text-xs rounded px-2 py-1 border ${
                  flag.severity === "disqualify"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : flag.severity === "warn"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                } ${isDismissed ? "opacity-40 line-through" : ""}`}
              >
                <span>⚑ {flag.reason}</span>
                {isDismissed ? (
                  <button
                    onClick={() => onRestoreFlag(flag.code)}
                    className="shrink-0 underline text-gray-400 hover:text-gray-600 no-underline"
                    title="Restore flag"
                  >
                    restore
                  </button>
                ) : (
                  <button
                    onClick={() => onDismissFlag(flag.code)}
                    className="shrink-0 text-gray-400 hover:text-gray-600"
                    title="Dismiss flag"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showOverride && (
        <OverrideForm
          currentResult={displayResult}
          onSave={(r, n) => { onOverride(r, n); setShowOverride(false); }}
          onCancel={() => setShowOverride(false)}
        />
      )}
    </div>
  );
}

export default function CandidateBreakdown({
  ranked,
  managerCriteria,
  recruiterCriteria,
  overrides,
  onOverride,
  onResetOverride,
  onDismissFlag,
  onRestoreFlag,
  onManualScore,
}: Props) {
  const [editingScore, setEditingScore] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const { breakdown, candidate } = ranked;
  const dismissedFlags = overrides?.dismissedFlags ?? [];
  const manualScore = overrides?.manualScore;

  // Build lookup maps from criteria definitions
  const managerMap = new Map(managerCriteria.criteria.map(c => [c.id, c]));
  const recruiterMap = new Map(recruiterCriteria.criteria.map(c => [c.id, c]));

  const qs = breakdown.qualitySignals;

  return (
    <div className="p-4 space-y-5">
      {/* Disqualification banner */}
      {breakdown.disqualified && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-xs font-bold text-red-700 mb-1">Disqualified — Hard Gate</p>
          <ul className="space-y-0.5">
            {breakdown.disqualifyReasons.map((r, i) => (
              <li key={i} className="text-xs text-red-600">· {r}</li>
            ))}
          </ul>
          <p className="text-xs text-red-400 mt-1.5 italic">
            Use per-criterion override below to reinstate this candidate.
          </p>
        </div>
      )}

      {/* Score summary + manual override */}
      <div className="flex items-center justify-between bg-gray-50 rounded p-3 border border-gray-200">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Signal Score</p>
          {breakdown.disqualified ? (
            <p className="text-2xl font-bold text-red-600">DQ</p>
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              {manualScore ?? breakdown.signalScore}
              <span className="text-sm font-normal text-gray-400 ml-1">/ 100</span>
              {manualScore !== undefined && (
                <span className="ml-2 text-xs font-normal text-purple-600">⊙ manual</span>
              )}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            engine: {breakdown.signalScore} · criteria 85% · quality 15%
          </p>
        </div>
        <div className="text-right">
          {!editingScore ? (
            <button
              onClick={() => { setScoreInput(String(manualScore ?? breakdown.signalScore)); setEditingScore(true); }}
              className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 bg-purple-50 px-2.5 py-1 rounded"
            >
              ✎ Override score
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="100"
                value={scoreInput}
                onChange={e => setScoreInput(e.target.value)}
                className="w-16 text-xs text-right border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <button
                onClick={() => {
                  const v = parseInt(scoreInput, 10);
                  if (!isNaN(v) && v >= 0 && v <= 100) onManualScore(v);
                  setEditingScore(false);
                }}
                className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Save
              </button>
              <button
                onClick={() => { onManualScore(undefined); setEditingScore(false); }}
                className="text-xs px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manager criteria */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
          Manager Criteria
        </h3>
        <div className="border border-gray-100 rounded divide-y divide-gray-100">
          {breakdown.managerCriteriaScores.map(score => {
            const def = managerMap.get(score.criterionId);
            const ov = overrides?.criteria[score.criterionId];
            return (
              <div key={score.criterionId} className="px-3">
                <CriterionRow
                  score={score}
                  tier={def?.tier ?? "medium"}
                  label={def?.label ?? score.criterionId}
                  behavior={def?.dealBreakerBehavior}
                  overrideResult={ov?.result}
                  overrideNote={ov?.note}
                  dismissedFlags={dismissedFlags}
                  onOverride={(r, n) => onOverride(score.criterionId, r, n)}
                  onResetOverride={() => onResetOverride(score.criterionId)}
                  onDismissFlag={onDismissFlag}
                  onRestoreFlag={onRestoreFlag}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Recruiter criteria */}
      {breakdown.recruiterCriteriaScores.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Recruiter Criteria
          </h3>
          <div className="border border-gray-100 rounded divide-y divide-gray-100">
            {breakdown.recruiterCriteriaScores.map(score => {
              const def = recruiterMap.get(score.criterionId);
              const ov = overrides?.criteria[score.criterionId];
              return (
                <div key={score.criterionId} className="px-3">
                  <CriterionRow
                    score={score}
                    tier={def?.tier ?? "medium"}
                    label={def?.label ?? score.criterionId}
                    overrideResult={ov?.result}
                    overrideNote={ov?.note}
                    dismissedFlags={dismissedFlags}
                    onOverride={(r, n) => onOverride(score.criterionId, r, n)}
                    onResetOverride={() => onResetOverride(score.criterionId)}
                    onDismissFlag={onDismissFlag}
                    onRestoreFlag={onRestoreFlag}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quality signals */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
          Resume Quality Signals
        </h3>
        <div className="border border-gray-100 rounded p-3 space-y-3">
          <DensityBar
            value={qs.evidenceDensityScore}
            label="Evidence density — quantified, verifiable accomplishments"
            color="bg-blue-400"
          />
          <DensityBar
            value={qs.consistencyScore}
            label="Internal consistency — date ranges, tenure overlap"
            color={qs.consistencyScore < 0.7 ? "bg-orange-400" : "bg-blue-400"}
          />
          <div>
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">AI / template likelihood</span>
                <span className="text-xs px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                  signal only — never auto-rejects
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-700">
                  {Math.round(qs.aiLikelihoodScore * 100)}%
                </span>
                <span className="text-xs text-gray-400">
                  ({Math.round(qs.aiLikelihoodConfidence * 100)}% conf.)
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${qs.aiLikelihoodScore > 0.5 ? "bg-amber-400" : "bg-blue-400"}`}
                style={{ width: `${qs.aiLikelihoodScore * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              confidence: {Math.round(qs.aiLikelihoodConfidence * 100)}% · this is a probabilistic signal,
              not a verdict. Override any criterion result above if you disagree.
            </p>
          </div>
        </div>
      </section>

      {/* Org criteria (if any) */}
      {breakdown.orgCriteriaScores.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Org Criteria
          </h3>
          <div className="border border-gray-100 rounded divide-y divide-gray-100">
            {breakdown.orgCriteriaScores.map(score => {
              const ov = overrides?.criteria[score.criterionId];
              return (
                <div key={score.criterionId} className="px-3">
                  <CriterionRow
                    score={score}
                    tier="medium"
                    label={score.criterionId}
                    overrideResult={ov?.result}
                    overrideNote={ov?.note}
                    dismissedFlags={dismissedFlags}
                    onOverride={(r, n) => onOverride(score.criterionId, r, n)}
                    onResetOverride={() => onResetOverride(score.criterionId)}
                    onDismissFlag={onDismissFlag}
                    onRestoreFlag={onRestoreFlag}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer note */}
      <div className="pt-2 border-t border-gray-100 text-center space-y-0.5">
        <p className="text-xs text-gray-300">
          {candidate.name} · source: {candidate.source === "sharepoint" ? "SharePoint" : candidate.source} · every result above is traceable to evidence
        </p>
        {candidate.sourceUrl && (
          <p className="text-xs text-blue-300 break-all">
            {candidate.sourceUrl}
          </p>
        )}
      </div>
    </div>
  );
}
